import { useState, useEffect, useCallback } from 'react';
import getApiBase from '../utils/api';

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
    if (humanState.energy < 40) {
      warnings.push(`Low energy (${Math.round(humanState.energy)}%)`);
    }

    // Stress check
    if (humanState.stress > 70) {
      warnings.push(`High stress (${Math.round(humanState.stress)}%)`);
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
        const val = parseInt(w.match(/\d+/)?.[0] || '100');
        if (val < 20) return true;
      }
      if (w.includes('Health')) {
        const val = parseInt(w.match(/\d+/)?.[0] || '100');
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
  const [data, setData] = useState(() => {
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
  });

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Get API URL helper
  const getApiUrl = useCallback(() => {
    const url = getApiBase();
    return url === '' ? '' : url;
  }, []);

  const refresh = useCallback(async () => {
    const apiUrl = getApiUrl();
    if (apiUrl === null) return;

    setLoading(true);
    setError(null);

    try {
      const profileParam = profileOverride ? `?profile=${profileOverride}` : '';
      const response = await fetch(`${apiUrl}/api/v1/cod/status${profileParam}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      const humanState = result.humanState || DEFAULT_STATUS.humanState;
      const session = result.session || null;

      // Try to load avatar vitals (money / notoriety / health)
      let avatarVitals = DEFAULT_STATUS.avatarVitals;
      try {
        const avatarRes = await fetch(`${apiUrl}/api/v1/cod/avatar${profileParam}`);
        if (avatarRes.ok) {
          const avatarJson = await avatarRes.json();
          const vitals =
            avatarJson?.structuredContent?.vitals || avatarJson?.vitals;
          if (vitals) {
            avatarVitals = {
              money: vitals.money ?? avatarVitals.money,
              notoriety: vitals.notoriety ?? avatarVitals.notoriety,
              health: vitals.health ?? avatarVitals.health,
              healthTrend:
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

      setData({
        validation,
        humanState,
        session,
        warnings: validation.warnings,
        avatarVitals,
      });
    } catch (err) {
      setError(err.message);
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, [getApiUrl]);

  /**
   * Update human state via API
   */
  const updateHumanState = useCallback(
    async (newState) => {
      const apiUrl = getApiUrl();
      if (apiUrl === null)
        return { success: false, error: 'API not available' };

      setUpdating(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/v1/cod/human-state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newState),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        // Refresh to get updated state
        await refresh();
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setUpdating(false);
      }
    },
    [getApiUrl, refresh]
  );

  /**
   * Start a new work session
   */
  const startSession = useCallback(
    async ({ taskIds = [], budgetMin = 60 } = {}) => {
      const apiUrl = getApiUrl();
      if (apiUrl === null)
        return { success: false, error: 'API not available' };

      setUpdating(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/v1/cod/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskIds, budgetMin }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        await refresh();
        return { success: true, session: result };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setUpdating(false);
      }
    },
    [getApiUrl, refresh]
  );

  /**
   * End current session
   */
  const endSession = useCallback(
    async (sessionId, status = 'completed') => {
      const apiUrl = getApiUrl();
      if (apiUrl === null)
        return { success: false, error: 'API not available' };

      setUpdating(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/v1/cod/session/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, status }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        await refresh();
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setUpdating(false);
      }
    },
    [getApiUrl, refresh]
  );

  // Poll for updates when API available
  useEffect(() => {
    const apiUrl = getApiUrl();
    if (apiUrl === null) return;

    // Initial fetch
    refresh();

    // Poll every 60 seconds
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [getApiUrl, refresh]);

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
