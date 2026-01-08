import { useState, useEffect, useMemo } from 'react';

/**
 * Get API URL from window config or default to relative path
 */
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.TASKER_API_URL) {
    return window.TASKER_API_URL;
  }
  return '';
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
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = getApiUrl();

      // Fetch all tasks (both todo and completed for progress calculation)
      const tasksRes = await fetch(`${apiUrl}/api/v1/tasks?status=all`);
      if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
      const tasksData = await tasksRes.json();

      const taskList = tasksData.structuredContent?.tasks || [];
      setTasks(taskList);
    } catch (err) {
      console.error('[useGoals] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group tasks by goalId and compute progress
  const goals = useMemo(() => {
    // Find unique goalIds
    const goalIds = [
      ...new Set(tasks.filter((t) => t.goalId).map((t) => t.goalId)),
    ];

    return goalIds
      .map((goalId) => {
        // Get all tasks for this goal (exclude archived)
        const goalTasks = tasks.filter(
          (t) => t.goalId === goalId && !t.path?.includes('/archive/')
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
            ? Math.round((completedEffort / totalEffort) * 100)
            : 0;

        // Calculate progress by count
        const progressByCount =
          goalTasks.length > 0
            ? Math.round((completedTasks.length / goalTasks.length) * 100)
            : 0;

        // Use effort-based progress as primary
        const progress = progressByEffort;

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
    refresh: fetchData,
  };
}

export default useGoals;
