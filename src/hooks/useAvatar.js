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
      // Fetch avatar state, session stats, and tasks in parallel
      const [avatarRes, sessionStatsRes, tasksRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/cod/avatar`),
        fetch(`${apiUrl}/api/v1/sessions/stats`).catch(() => null),
        fetch(`${apiUrl}/api/v1/tasks`).catch(() => null),
      ]);

      if (!avatarRes.ok) throw new Error(`HTTP ${avatarRes.status}`);
      const avatarResult = await avatarRes.json();
      const state =
        avatarResult?.structuredContent?.state || avatarResult?.state || {};

      // Get session stats
      let sessionStats = {
        completedSessions: 0,
        totalSessions: 0,
        activeSessions: 0,
      };
      if (sessionStatsRes?.ok) {
        const sessionData = await sessionStatsRes.json();
        sessionStats =
          sessionData?.structuredContent || sessionData || sessionStats;
      }

      // Compute task stats from tasks
      let tasksCompletedToday = 0;
      let tasksCompletedThisWeek = 0;
      let totalCompleted = 0;

      if (tasksRes?.ok) {
        const tasksData = await tasksRes.json();
        const tasks = tasksData?.structuredContent?.tasks || [];

        const now = new Date();
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

        tasks.forEach((task) => {
          if (task.status === 'completed') {
            totalCompleted++;
            // Check completion date if available
            const completedDate = task.frontmatter?.completed || task.completed;
            if (completedDate) {
              const taskDate = new Date(completedDate);
              if (taskDate >= todayStart) tasksCompletedToday++;
              if (taskDate >= weekStart) tasksCompletedThisWeek++;
            }
          }
        });
      }

      // Merge real stats into vitals
      const vitals = {
        ...(state.vitals || DEFAULT_AVATAR.vitals),
        tasksCompletedToday:
          tasksCompletedToday || state.vitals?.tasksCompletedToday || 0,
        tasksCompletedThisWeek:
          tasksCompletedThisWeek || state.vitals?.tasksCompletedThisWeek || 0,
        sessionsCompletedThisWeek:
          sessionStats.completedSessions ||
          state.vitals?.sessionsCompletedThisWeek ||
          0,
        totalTasksCompleted: totalCompleted,
        totalSessions: sessionStats.totalSessions || 0,
        activeSessions: sessionStats.activeSessions || 0,
      };

      setAvatar({
        profile: state.profile || DEFAULT_AVATAR.profile,
        vitals,
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
