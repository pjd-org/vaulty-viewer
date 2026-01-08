import { useState, useEffect, useCallback } from 'react';

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
};

/**
 * Compute validation status from human state
 */
function computeValidation(humanState, session) {
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
    const hasBlocking = warnings.some(
      (w) =>
        w.includes('HARD_STOP window active') ||
        w.includes('overtime') ||
        (w.includes('energy') && parseInt(w.match(/\d+/)?.[0] || '100') < 20)
    );
    status = hasBlocking ? 'FAIL' : 'WARN';
  }

  return { status, warnings, lastChecked: new Date().toISOString() };
}

/**
 * Hook to fetch and manage COD status
 * Uses static data from GraphQL at build time, with optional API polling for live updates
 */
export function useCODStatus(staticData = null) {
  const [data, setData] = useState(() => {
    if (staticData) {
      const humanState = staticData.humanStateJson || DEFAULT_STATUS.humanState;
      const session = staticData.activeSessionJson || null;
      const validation = computeValidation(humanState, session);
      return { validation, humanState, session, warnings: validation.warnings };
    }
    return DEFAULT_STATUS;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const apiUrl = typeof window !== 'undefined' ? window.TASKER_API_URL : null;
    if (!apiUrl) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/cod/status`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      const humanState = result.humanState || DEFAULT_STATUS.humanState;
      const session = result.session || null;
      const validation = computeValidation(humanState, session);

      setData({
        validation,
        humanState,
        session,
        warnings: validation.warnings,
      });
    } catch (err) {
      setError(err.message);
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for updates when API available
  useEffect(() => {
    const apiUrl = typeof window !== 'undefined' ? window.TASKER_API_URL : null;
    if (!apiUrl) return;

    // Initial fetch
    refresh();

    // Poll every 60 seconds
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { ...data, loading, error, refresh };
}

export default useCODStatus;
