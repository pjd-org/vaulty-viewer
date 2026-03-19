import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import getApiBase, { apiFetch } from '../utils/api';

/**
 * Get API URL from window config or default to relative path
 */
const getApiUrl = () => {
  const base = getApiBase();
  return base;
};

/**
 * Calculate goal status based on progress and target date
 */
function calculateGoalStatus(progress, targetDate, hasBlockedTasks) {
  if (progress >= 100) return 'completed';
  if (hasBlockedTasks && progress < 50) return 'blocked';

  if (!targetDate) return 'on-track';

  const now = new Date();
  const target = new Date(targetDate);
  const daysUntilTarget = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

  // Simple ETA: assume linear progress
  const remainingProgress = 100 - progress;
  const progressPerDay = progress > 0 ? progress / 7 : 5; // assume 7 days of work or 5%/day default
  const daysToComplete = remainingProgress / progressPerDay;

  if (daysToComplete <= daysUntilTarget) return 'on-track';
  if (daysToComplete <= daysUntilTarget + 7) return 'at-risk';
  return 'behind';
}

/**
 * Hook to fetch and compute goal progress from tasks
 */
export function useGoals() {
  const apiUrl = getApiUrl();
  const queryEnabled = typeof window !== 'undefined';

  const tasksQuery = useQuery({
    queryKey: ['goals', 'tasks', apiUrl],
    enabled: queryEnabled,
    staleTime: 30_000,
    retry: 1,
    queryFn: async () => {
      const tasksRes = await apiFetch('/api/v1/tasks?status=all&limit=1000');
      if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
      const tasksData = await tasksRes.json();
      return tasksData.structuredContent?.tasks || tasksData.tasks || [];
    },
  });

  const tasks = tasksQuery.data || [];
  const loading = queryEnabled ? tasksQuery.isFetching : false;
  const error = tasksQuery.error
    ? tasksQuery.error instanceof Error
      ? tasksQuery.error.message
      : String(tasksQuery.error)
    : null;
  const apiStatus = tasksQuery.isError
    ? 'offline'
    : tasksQuery.isSuccess
      ? 'online'
      : 'unknown';
  const updatedAt =
    tasksQuery.dataUpdatedAt > 0
      ? new Date(tasksQuery.dataUpdatedAt).toISOString()
      : null;

  // Group tasks by goalId and compute progress
  const goals = useMemo(() => {
    // Exclude tasks from non-authoritative roots (archive, inbox, staged)
    const activeTasks = tasks.filter((t) => {
      const p = (t.path || '').replace(/\\/g, '/');
      return (
        !p.startsWith('archive/') &&
        !p.startsWith('inbox/') &&
        !p.startsWith('_archive/')
      );
    });

    // Normalize tasks: status + effort score fallback
    const normalizedTasks = activeTasks.map((t) => {
      const rawStatus = (t.status || 'todo').toLowerCase();
      const status =
        rawStatus === 'in_progress'
          ? 'in-progress'
          : rawStatus === 'done'
            ? 'completed'
            : rawStatus;
      const effortScore =
        typeof t.effortScore === 'number' && t.effortScore > 0
          ? t.effortScore
          : typeof t.effort === 'number' && t.effort > 0
            ? t.effort
            : typeof t.estimatedTimeMin === 'number' && t.estimatedTimeMin > 0
              ? Math.max(1, Math.round(t.estimatedTimeMin / 15))
              : 1;
      return { ...t, status, effortScore };
    });

    // Sanitize a raw goalId/tag value: strip stray YAML quote artifacts
    // e.g. "'platform-foundation'" -> "platform-foundation"
    const sanitizeId = (raw) =>
      String(raw).trim().replace(/^['"]/, '').replace(/['"]$/, '');

    // Find unique goalIds from explicit field or goal:* tags
    const goalIdSet = new Set();
    normalizedTasks.forEach((t) => {
      if (t.goalId) goalIdSet.add(sanitizeId(t.goalId));
      (t.tags || [])
        .filter((tag) => String(tag).startsWith('goal:'))
        .forEach((tag) =>
          goalIdSet.add(sanitizeId(String(tag).replace(/^goal:/, '')))
        );
    });
    const goalIds = Array.from(goalIdSet);

    return goalIds
      .map((goalId) => {
        // Get all tasks for this goal
        const goalTasks = normalizedTasks.filter(
          (t) =>
            (t.goalId && sanitizeId(t.goalId) === goalId) ||
            (t.tags || []).some(
              (tag) =>
                String(tag).startsWith('goal:') &&
                sanitizeId(String(tag).replace(/^goal:/, '')) === goalId
            )
        );

        const completedTasks = goalTasks.filter(
          (t) => t.status === 'completed'
        );
        const blockedTasks = goalTasks.filter((t) => t.status === 'blocked');
        const inProgressTasks = goalTasks.filter(
          (t) => t.status === 'in-progress'
        );
        const todoTasks = goalTasks.filter((t) => t.status === 'todo');

        // Calculate progress by effort (more accurate)
        const totalEffort = goalTasks.reduce(
          (sum, t) => sum + (t.effortScore || 1),
          0
        );
        const completedEffort = completedTasks.reduce(
          (sum, t) => sum + (t.effortScore || 1),
          0
        );
        const progressByEffort =
          totalEffort > 0
            ? Math.min(100, Math.round((completedEffort / totalEffort) * 100))
            : 0;

        // Calculate progress by count
        const progressByCount =
          goalTasks.length > 0
            ? Math.round((completedTasks.length / goalTasks.length) * 100)
            : 0;

        // Use effort-based progress when available, otherwise fall back to count-based
        const progress =
          totalEffort > 0 ? progressByEffort : Math.min(100, progressByCount);

        // Extract goal metadata from tags (goal:rent-stability-pantin -> Rent Stability Pantin)
        const title = goalId
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        // Find priority from highest priority task in the goal
        const maxPriority = Math.max(...goalTasks.map((t) => t.priority || 0));

        // Find target date (could be extracted from goal notes in the future)
        // For now, look for tasks with due dates
        const dueDates = goalTasks
          .filter((t) => t.dueDate)
          .map((t) => new Date(t.dueDate));
        const targetDate =
          dueDates.length > 0 ? new Date(Math.min(...dueDates)) : null;

        // Calculate status
        const status = calculateGoalStatus(
          progress,
          targetDate,
          blockedTasks.length > 0
        );

        // Calculate ETA (simple linear projection)
        const remainingEffort = totalEffort - completedEffort;
        const avgEffortPerDay = completedEffort > 0 ? completedEffort / 7 : 5; // assume 7 days or 5 effort/day
        const daysRemaining =
          remainingEffort > 0
            ? Math.ceil(remainingEffort / avgEffortPerDay)
            : 0;
        const eta = new Date();
        eta.setDate(eta.getDate() + daysRemaining);

        return {
          id: goalId,
          title,
          priority: maxPriority,
          progress,
          progressByCount,
          status,
          targetDate: targetDate?.toISOString(),
          eta: progress < 100 ? eta.toISOString() : null,
          stats: {
            total: goalTasks.length,
            completed: completedTasks.length,
            inProgress: inProgressTasks.length,
            todo: todoTasks.length,
            blocked: blockedTasks.length,
            totalEffort,
            completedEffort,
            remainingEffort,
          },
          tasks: goalTasks.sort((a, b) => {
            // Sort: completed last, then by priority desc
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            return (b.priority || 0) - (a.priority || 0);
          }),
        };
      })
      .sort((a, b) => {
        // Sort goals: incomplete first by priority, then completed
        if (a.progress >= 100 && b.progress < 100) return 1;
        if (a.progress < 100 && b.progress >= 100) return -1;
        return b.priority - a.priority;
      });
  }, [tasks]);

  return {
    goals,
    loading,
    error,
    apiStatus,
    updatedAt,
    refresh: () => tasksQuery.refetch(),
  };
}

export default useGoals;
