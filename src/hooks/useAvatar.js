import { useState, useEffect, useCallback } from 'react';

/**
 * Default avatar state when API unavailable
 */
const DEFAULT_AVATAR = {
  profile: {
    name: 'Unknown',
    handle: 'unknown',
    archetype: 'explorer',
    title: 'Vault User',
    location: null,
    interests: [],
  },
  vitals: {
    health: 50,
    energy: 50,
    stress: 50,
    rank: 'E Unproven',
    tasksCompletedToday: 0,
    tasksCompletedThisWeek: 0,
    sessionsCompletedThisWeek: 0,
    needs: { sleep: 50, social: 50, food: 50 },
  },
  progression: {
    level: 1,
    xp: 0,
    streakDays: 0,
    streakUpdated: null,
  },
  capacity: {
    focusCostMax: 5,
    effortScoreMax: 5,
    timeBudgetMin: 120,
  },
  knowledge: {
    domains: {},
    learning: { now: [], next: [] },
    gaps: [],
  },
  flags: {
    stagnation: false,
    entropyWarning: false,
  },
  updated: null,
};

/**
 * Calculate XP needed for next level
 * Simple formula: 100 * level^1.5
 */
function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Hook to fetch and manage avatar state
 */
export function useAvatar() {
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getApiUrl = useCallback(() => {
    return typeof window !== 'undefined' ? window.TASKER_API_URL || '' : null;
  }, []);

  const refresh = useCallback(async () => {
    const apiUrl = getApiUrl();
    if (apiUrl === null) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/v1/cod/avatar`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      const state = result?.structuredContent?.state || result?.state || {};

      setAvatar({
        profile: state.profile || DEFAULT_AVATAR.profile,
        vitals: state.vitals || DEFAULT_AVATAR.vitals,
        progression: state.progression || DEFAULT_AVATAR.progression,
        capacity: state.capacity || DEFAULT_AVATAR.capacity,
        knowledge: state.knowledge || DEFAULT_AVATAR.knowledge,
        flags: state.flags || DEFAULT_AVATAR.flags,
        updated: state.updated || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getApiUrl]);

  // Calculate derived values
  const level = avatar.progression?.level || 1;
  const currentXp = avatar.progression?.xp || 0;
  const xpToNext = xpForLevel(level);
  const xpProgress = Math.min(100, Math.round((currentXp / xpToNext) * 100));

  // Initial fetch
  useEffect(() => {
    const apiUrl = getApiUrl();
    if (apiUrl === null) return;
    refresh();
  }, [getApiUrl, refresh]);

  return {
    avatar,
    loading,
    error,
    refresh,
    // Derived values
    level,
    currentXp,
    xpToNext,
    xpProgress,
  };
}

export default useAvatar;
