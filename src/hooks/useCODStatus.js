import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import getApiBase, { apiFetch } from '../utils/api';

/**
 * Default/mock COD status for static builds or when API unavailable
 */
const DEFAULT_STATUS = {
  validation: {
    status: 'UNKNOWN',
    warnings: [],
    lastChecked: null,
  },
  humanState: {
    energy: 0,
    focusCapacity: 'unknown',
    stress: 0,
    sleepDebt: 0,
    timeAvailableMin: 0,
    source: 'none',
    timestamp: null,
  },
  session: null,
  warnings: [],
  avatarVitals: {
    money: { default_currency: '', balances: {}, forms: {} },
    notoriety: 0,
    health: 0,
    healthTrend: null,
  },
};

/**
 * Compute validation status from human state
 */
function computeValidation(humanState, session, avatarVitals = {}) {
  const warnings = [];

  if (humanState) {
    // Energy check
    if (humanState.energy < 0.40) {
      warnings.push(`Low energy (${Math.round(humanState.energy * 100)}%)`);
    }

    // Stress check
    if (humanState.stress > 0.70) {
      warnings.push(`High stress (${Math.round(humanState.stress * 100)}%)`);
    }

    // Sleep debt check
    if (humanState.sleepDebt > 2) {
      warnings.push(`Sleep debt (${humanState.sleepDebt}h)`);
    }

    // Focus check
    if (humanState.focusCapacity === 'low') {
      warnings.push('Low focus capacity');
    }

    // Time available check
    if (humanState.timeAvailableMin < 30) {
      warnings.push(`Limited time (${humanState.timeAvailableMin} min)`);
    }
  }

  // Avatar health guardrail
  if (avatarVitals.health !== undefined && avatarVitals.health < 40) {
    warnings.push(`Health low (${Math.round(avatarVitals.health)}%)`);
  }

  // HARD_STOP check (after 23:00)
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 23 || hour < 5) {
    warnings.push('HARD_STOP window active');
  } else if (hour >= 22) {
    warnings.push('Near HARD_STOP window');
  }

  // Session checks
  if (session) {
    const elapsed = Date.now() - new Date(session.startedAt).getTime();
    const elapsedMin = Math.floor(elapsed / 60000);
    if (elapsedMin > session.budgetMin) {
      warnings.push(
        `Session overtime (+${elapsedMin - session.budgetMin} min)`
      );
    }
  }

  let status = 'PASS';
  if (warnings.length > 0) {
    // Check for blocking conditions
    const hasBlocking = warnings.some((w) => {
      if (w.includes('HARD_STOP window active')) return true;
      if (w.includes('overtime')) return true;
      if (w.includes('energy')) {
        const val = parseInt(w.match(/\d+/)?.[0] || '100', 10);
        if (val < 20) return true;
      }
      if (w.includes('Health')) {
        const val = parseInt(w.match(/\d+/)?.[0] || '100', 10);
        if (val < 25) return true;
      }
      return false;
    });
    status = hasBlocking ? 'FAIL' : 'WARN';
  }

  return { status, warnings, lastChecked: new Date().toISOString() };
}

/**
 * Hook to fetch and manage COD status
 * Uses static data from GraphQL at build time, with optional API polling for live updates
 */
export function useCODStatus(staticData = null, profileOverride = null) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState(null);

  // Get API URL helper
  const getApiUrl = useCallback(() => {
    const url = getApiBase();
    return url;
  }, []);

  const apiUrl = getApiUrl();
  const queryEnabled = typeof window !== 'undefined';

  const initialData = useMemo(() => {
    if (staticData) {
      const humanState = staticData.humanStateJson || DEFAULT_STATUS.humanState;
      const session = staticData.activeSessionJson || null;
      const validation = computeValidation(humanState, session);
      return {
        validation,
        humanState,
        session,
        warnings: validation.warnings,
        avatarVitals: DEFAULT_STATUS.avatarVitals,
      };
    }
    return DEFAULT_STATUS;
  }, [staticData]);

  const queryKey = ['cod-status', apiUrl, profileOverride || 'auto'];

  const statusQuery = useQuery({
    queryKey,
    enabled: queryEnabled,
    initialData,
    staleTime: 10_000,
    retry: 1,
    refetchInterval: queryEnabled ? 60_000 : false,
    queryFn: async () => {
      const response = await apiFetch('/api/v1/cod/status');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      const humanState =
        result.structuredContent?.humanState ||
        result.humanState ||
        DEFAULT_STATUS.humanState;
      const session =
        result.structuredContent?.session || result.session || null;

      // Try to load avatar vitals (money / notoriety / health)
      let avatarVitals = DEFAULT_STATUS.avatarVitals;
      try {
        const avatarRes = await apiFetch('/api/v1/cod/avatar');
        if (avatarRes.ok) {
          const avatarJson = await avatarRes.json();
          const avatarState =
            avatarJson?.structuredContent?.state ||
            avatarJson?.state ||
            avatarJson?.structuredContent ||
            avatarJson;
          const vitals =
            avatarState?.vitals || avatarJson?.structuredContent?.vitals || avatarJson?.vitals;
          if (vitals) {
            avatarVitals = {
              money: vitals.money ?? avatarVitals.money,
              notoriety: vitals.notoriety ?? avatarVitals.notoriety,
              health: vitals.health ?? avatarVitals.health,
              healthTrend:
                avatarState?.trends?.vitals7d?.health ??
                avatarJson?.structuredContent?.trends?.vitals7d?.health ??
                avatarVitals.healthTrend ??
                null,
            };
          }
        }
      } catch {
        // ignore avatar errors; keep defaults
      }

      const validation = computeValidation(humanState, session, avatarVitals);

      return {
        validation,
        humanState,
        session,
        warnings: validation.warnings,
        avatarVitals,
      };
    },
  });

  const refresh = useCallback(async () => {
    if (!queryEnabled) return;
    await statusQuery.refetch();
  }, [queryEnabled, statusQuery]);

  const updateHumanStateMutation = useMutation({
    mutationFn: async ({ newState }) => {
      const response = await apiFetch('/api/v1/cod/human-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      return response.json().catch(() => ({}));
    },
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : String(err));
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async ({ taskIds = [], budgetMin = 60 }) => {
      const response = await apiFetch('/api/v1/cod/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds, budgetMin }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : String(err));
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async ({ sessionId, status = 'completed' }) => {
      const response = await apiFetch('/api/v1/cod/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return response.json().catch(() => ({}));
    },
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : String(err));
    },
  });

  /**
   * Update human state via API
   */
  const updateHumanState = useCallback(
    async (newState) => {
      if (!queryEnabled) {
        return { success: false, error: 'API not available' };
      }

      setActionError(null);
      try {
        await updateHumanStateMutation.mutateAsync({ newState });
        await refresh();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setActionError(message);
        return { success: false, error: message };
      }
    },
    [queryEnabled, refresh, updateHumanStateMutation]
  );

  /**
   * Start a new work session
   */
  const startSession = useCallback(
    async ({ taskIds = [], budgetMin = 60 } = {}) => {
      if (!queryEnabled) {
        return { success: false, error: 'API not available' };
      }

      setActionError(null);
      try {
        const session = await startSessionMutation.mutateAsync({
          taskIds,
          budgetMin,
        });
        await refresh();
        return { success: true, session };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setActionError(message);
        return { success: false, error: message };
      }
    },
    [queryEnabled, refresh, startSessionMutation]
  );

  /**
   * End current session
   */
  const endSession = useCallback(
    async (sessionId, status = 'completed') => {
      if (!queryEnabled) {
        return { success: false, error: 'API not available' };
      }

      setActionError(null);
      try {
        await endSessionMutation.mutateAsync({ sessionId, status });
        await refresh();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setActionError(message);
        return { success: false, error: message };
      }
    },
    [endSessionMutation, queryEnabled, refresh]
  );

  const queryError = statusQuery.error
    ? statusQuery.error instanceof Error
      ? statusQuery.error.message
      : String(statusQuery.error)
    : null;
  const error = actionError || queryError;
  const loading = queryEnabled ? statusQuery.isFetching : false;
  const updating =
    updateHumanStateMutation.isPending ||
    startSessionMutation.isPending ||
    endSessionMutation.isPending;
  const data = statusQuery.data || initialData;

  return {
    ...data,
    loading,
    updating,
    error,
    refresh,
    updateHumanState,
    startSession,
    endSession,
  };
}

export default useCODStatus;
