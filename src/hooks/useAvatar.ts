import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import getApiBase, {
  ForbiddenError,
  UnauthenticatedError,
  apiFetch,
} from '../utils/api';
import { useHydrated } from './useHydrated';

interface AvatarProfile {
  name: string;
  handle: string;
  archetype: string;
  title: string;
  location: string | null;
  interests: string[];
}

interface AvatarVitals {
  health: number;
  energy: number;
  stress: number;
  rank: string;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  sessionsCompletedThisWeek: number;
  totalTasksCompleted?: number;
  totalSessions?: number;
  activeSessions?: number;
  needs: {
    sleep: number;
    social: number;
    food: number;
  };
  [key: string]: unknown;
}

interface AvatarProgression {
  level: number;
  xp: number;
  streakDays: number;
  streakUpdated: string | null;
}

interface AvatarCapacity {
  focusCostMax: number;
  effortScoreMax: number;
  timeBudgetMin: number;
}

interface AvatarKnowledge {
  domains: Record<string, unknown>;
  learning: {
    now: string[];
    next: string[];
  };
  gaps: string[];
}

interface AvatarFlags {
  stagnation: boolean;
  entropyWarning: boolean;
}

interface AvatarState {
  profile: AvatarProfile;
  vitals: AvatarVitals;
  progression: AvatarProgression;
  capacity: AvatarCapacity;
  knowledge: AvatarKnowledge;
  flags: AvatarFlags;
  updated: string | null;
}

/**
 * Default avatar state when API unavailable
 */
const DEFAULT_AVATAR: AvatarState = {
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

export interface UseAvatarResult {
  avatar: AvatarState;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<unknown>;
  apiStatus: 'online' | 'offline' | 'loading' | 'unknown';
  level: number;
  currentXp: number;
  xpToNext: number;
  xpProgress: number;
}

/**
 * Calculate XP needed for next level
 * Simple formula: 100 * level^1.5
 */
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Hook to fetch and manage avatar state
 */
export function useAvatar(): UseAvatarResult {
  // Allow empty string to mean "same origin /api"
  const getApiUrl = useCallback(() => {
    const base = getApiBase();
    return base;
  }, []);

  const apiUrl = getApiUrl();
  const hydrated = useHydrated();
  const queryEnabled = hydrated;

  const avatarQuery = useQuery({
    queryKey: ['avatar', apiUrl],
    enabled: queryEnabled,
    staleTime: 30_000,
    retry: 1,
    queryFn: async () => {
      // Fetch avatar state, session stats, and tasks in parallel
      const [avatarRes, sessionStatsRes, tasksRes] = await Promise.all([
        apiFetch('/api/v1/cod/avatar'),
        apiFetch('/api/v1/sessions/stats').catch(() => null),
        apiFetch('/api/v1/tasks?status=all&limit=1000').catch(() => null),
      ]);

      if (avatarRes.status === 401) {
        throw new UnauthenticatedError('Failed to fetch avatar: 401');
      }
      if (avatarRes.status === 403) {
        throw new ForbiddenError('Failed to fetch avatar: 403');
      }
      if (!avatarRes.ok) throw new Error(`HTTP ${avatarRes.status}`);
      const avatarResult = await avatarRes.json();
      const avatarPayload =
        avatarResult?.structuredContent ?? avatarResult ?? {};
      const state =
        (avatarPayload as { state?: AvatarState }).state || avatarPayload as AvatarState;

      // Get session stats
      let sessionStats = {
        completedSessions: 0,
        totalSessions: 0,
        activeSessions: 0,
      };
      if (sessionStatsRes?.ok) {
        const sessionData = await sessionStatsRes.json();
        sessionStats =
          (sessionData?.structuredContent as typeof sessionStats) ||
          sessionData ||
          sessionStats;
      }

      // Compute task stats from tasks
      let tasksCompletedToday = 0;
      let tasksCompletedThisWeek = 0;
      let totalCompleted = 0;

      if (tasksRes?.ok) {
        const tasksData = await tasksRes.json();
        const tasks =
          (tasksData?.structuredContent as { tasks?: unknown[] })?.tasks ||
          (tasksData as { tasks?: unknown[] })?.tasks ||
          [];

        const now = new Date();
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

        (tasks as Array<{
          status?: string;
          completedAt?: string;
          frontmatter?: { completedAt?: string; completed?: string };
          completed?: string;
        }>).forEach((task) => {
          if (task.status === 'completed') {
            totalCompleted++;
            // Check completion date if available
            const completedDate =
              task.completedAt ||
              task.frontmatter?.completedAt ||
              task.frontmatter?.completed ||
              task.completed;
            if (completedDate) {
              const taskDate = new Date(completedDate);
              if (taskDate >= todayStart) tasksCompletedToday++;
              if (taskDate >= weekStart) tasksCompletedThisWeek++;
            }
          }
        });
      }

      // Merge real stats into vitals
      const vitals: AvatarVitals = {
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

      return {
        profile: state.profile || DEFAULT_AVATAR.profile,
        vitals,
        progression: state.progression || DEFAULT_AVATAR.progression,
        capacity: state.capacity || DEFAULT_AVATAR.capacity,
        knowledge: state.knowledge || DEFAULT_AVATAR.knowledge,
        flags: state.flags || DEFAULT_AVATAR.flags,
        updated: state.updated || null,
      };
    },
  });

  const avatar = avatarQuery.data || DEFAULT_AVATAR;
  const loading = !hydrated || avatarQuery.isFetching;
  const error = avatarQuery.error
    ? avatarQuery.error instanceof Error
      ? avatarQuery.error.message
      : String(avatarQuery.error)
    : null;
  const apiStatus =
    avatarQuery.isFetching && !avatarQuery.data
      ? 'loading'
      : avatarQuery.isError
        ? 'offline'
        : avatarQuery.isSuccess
          ? 'online'
          : 'unknown';

  // Calculate derived values
  const level = avatar.progression?.level || 1;
  const currentXp = avatar.progression?.xp || 0;
  const xpToNext = xpForLevel(level);
  const xpProgress = Math.min(100, Math.round((currentXp / xpToNext) * 100));

  return {
    avatar,
    loading,
    error,
    refresh: () => avatarQuery.refetch(),
    apiStatus,
    // Derived values
    level,
    currentXp,
    xpToNext,
    xpProgress,
  };
}

export type {
  AvatarProfile,
  AvatarVitals,
  AvatarProgression,
  AvatarCapacity,
  AvatarKnowledge,
  AvatarFlags,
  AvatarState,
};

export default useAvatar;