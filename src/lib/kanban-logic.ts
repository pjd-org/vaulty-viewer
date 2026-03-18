export interface StatusColumn {
  key: string;
  label: string;
  sort: (a: KanbanTask, b: KanbanTask) => number;
}

export interface KanbanTask {
  id: string;
  title: string;
  status: string;
  priority: number;
  estimatedTimeMin?: number;
  tags: string[];
  goalId?: string;
  projectId?: string;
  completedAt: number | null;
  createdAt: number | null;
  path?: string;
  cmsSlug: string;
  link: string;
  slug?: string;
  created?: string;
}

export interface KanbanColumn extends StatusColumn {
  items: KanbanTask[];
}

export interface RawTask {
  id?: string;
  title?: string;
  status?: string;
  priority?: number;
  estimatedTimeMin?: number;
  tags?: string[];
  goalId?: string;
  projectId?: string;
  completedAt?: string;
  created?: string;
  path?: string;
  slug?: string;
}

export const STATUS_COLUMNS: StatusColumn[] = [
  { key: 'todo', label: 'To Do', sort: (a, b) => (b.priority || 0) - (a.priority || 0) },
  { key: 'in-progress', label: 'In Progress', sort: (a, b) => (b.priority || 0) - (a.priority || 0) },
  { key: 'blocked', label: 'Blocked', sort: (a, b) => (b.createdAt || 0) - (a.createdAt || 0) },
  { key: 'completed', label: 'Completed', sort: (a, b) => (b.completedAt || 0) - (a.completedAt || 0) },
];

export const RECENT_COMPLETED_DAYS = 7;

export const isRecurringTask = (task: KanbanTask): boolean => {
  const tags = task.tags || [];
  return tags.some((t) => t.toLowerCase().includes('recurring'));
};

const toDate = (value: string | undefined | null): Date | null => {
  if (!value || typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const normalizeTask = (task: RawTask = {}): KanbanTask => {
  const slugPath = task.slug ? String(task.slug).replace(/^\//, '').replace(/\/$/, '') : '';
  const notePath = task.path ? String(task.path).replace(/\.md$/, '') : slugPath;
  const cmsSlug = notePath || slugPath;
  const link = notePath ? `/note?p=${encodeURIComponent(notePath)}` : '#';
  return {
    id: task.id || task.path || link,
    title: task.title || task.path || 'Untitled',
    status: (task.status || 'todo').toLowerCase(),
    priority: typeof task.priority === 'number' ? task.priority : 0,
    estimatedTimeMin: task.estimatedTimeMin,
    tags: task.tags || [],
    goalId: task.goalId,
    projectId: task.projectId,
    completedAt: toDate(task.completedAt)?.getTime() || null,
    createdAt: toDate(task.created)?.getTime() || null,
    path: task.path,
    cmsSlug,
    link,
  };
};

export const buildColumns = (
  tasks: KanbanTask[],
  filterTag: string,
  filterProject: string,
  showCompleted: boolean,
  excludeRecurring = true
): KanbanColumn[] => {
  const now = Date.now();
  const cutoff = now - RECENT_COMPLETED_DAYS * 24 * 60 * 60 * 1000;

  const filtered = tasks.filter((task) => {
    if (filterTag && !(task.tags || []).includes(filterTag)) return false;
    if (filterProject && task.projectId !== filterProject) return false;
    if (excludeRecurring && isRecurringTask(task)) return false;
    return true;
  });

  const visibleColumns = showCompleted
    ? STATUS_COLUMNS
    : STATUS_COLUMNS.filter((col) => col.key !== 'completed');

  return visibleColumns.map((col) => {
    const items = filtered
      .filter((t) => {
        if (col.key === 'completed' && t.completedAt && t.completedAt < cutoff) {
          return false;
        }
        return t.status === col.key;
      })
      .sort(col.sort);
    return { ...col, items };
  });
};

export const filterBacklog = (
  tasks: KanbanTask[],
  filterTag: string,
  filterProject: string,
  excludeRecurring = true
): KanbanTask[] => {
  return tasks.filter((task) => {
    if (task.status !== 'backlog') return false;
    if (filterTag && !(task.tags || []).includes(filterTag)) return false;
    if (filterProject && task.projectId !== filterProject) return false;
    if (excludeRecurring && isRecurringTask(task)) return false;
    return true;
  });
};
