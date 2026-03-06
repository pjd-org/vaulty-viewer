export const computeCounts = (goals) => ({
  all: goals.length,
  active: goals.filter((g) => g.status !== 'completed').length,
  atRisk: goals.filter((g) => ['at-risk', 'behind', 'blocked'].includes(g.status)).length,
  completed: goals.filter((g) => g.status === 'completed').length,
});

export const filterGoals = (goals, filter) => {
  switch (filter) {
    case 'active':
      return goals.filter((g) => g.status !== 'completed');
    case 'at-risk':
      return goals.filter((g) => ['at-risk', 'behind', 'blocked'].includes(g.status));
    case 'completed':
      return goals.filter((g) => g.status === 'completed');
    default:
      return goals;
  }
};

export const sortGoals = (goals, sortBy) => {
  const sorted = [...goals];
  switch (sortBy) {
    case 'progress':
      return sorted.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    case 'eta':
      return sorted.sort((a, b) => {
        if (!a.eta && !b.eta) return 0;
        if (!a.eta) return 1;
        if (!b.eta) return -1;
        return new Date(a.eta).getTime() - new Date(b.eta).getTime();
      });
    default:
      return sorted.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
};

export const computeSummary = (goals) => {
  const totalTasks = goals.reduce((sum, g) => sum + (g.stats?.total || 0), 0);
  const completedTasks = goals.reduce((sum, g) => sum + (g.stats?.completed || 0), 0);
  const totalEffort = goals.reduce((sum, g) => sum + (g.stats?.totalEffort || 0), 0);
  const completedEffort = goals.reduce((sum, g) => sum + (g.stats?.completedEffort || 0), 0);
  const overallProgress = totalEffort > 0 ? Math.round((completedEffort / totalEffort) * 100) : 0;

  return { totalTasks, completedTasks, totalEffort, completedEffort, overallProgress };
};
