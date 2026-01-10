export const STATUS_COLUMNS = [
  { key: "todo", label: "To Do", sort: (a: NormalizedTask, b: NormalizedTask) => (b.priority || 0) - (a.priority || 0) },
  { key: "in-progress", label: "In Progress", sort: (a: NormalizedTask, b: NormalizedTask) => (b.priority || 0) - (a.priority || 0) },
  { key: "blocked", label: "Blocked", sort: (a: NormalizedTask, b: NormalizedTask) => (b.createdAt || 0) - (a.createdAt || 0) },
  { key: "completed", label: "Completed", sort: (a: NormalizedTask, b: NormalizedTask) => (b.completedAt || 0) - (a.completedAt || 0) },
];

export const RECENT_COMPLETED_DAYS = 7;

export type NormalizedTask = {
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
  cmsSlug?: string;
  link: string;
};

const toDate = (value: unknown) => {
  if (!value || typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const normalizeTask = (task: any = {}): NormalizedTask => {
  const slugPath = task.slug ? String(task.slug).replace(/^\//, "").replace(/\/$/, "") : "";
  const notePath = task.path ? String(task.path).replace(/\.md$/, "") : slugPath;
  const cmsSlug = notePath || slugPath;
  const link = notePath ? `/note?p=${encodeURIComponent(notePath)}` : "#";
  return {
    id: task.id || task.path || link,
    title: task.title || task.path || "Untitled",
    status: (task.status || "todo").toLowerCase(),
    priority: typeof task.priority === "number" ? task.priority : 0,
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
  tasks: NormalizedTask[],
  filterTag: string,
  filterProject: string,
  showCompleted: boolean
) => {
  const now = Date.now();
  const cutoff = now - RECENT_COMPLETED_DAYS * 24 * 60 * 60 * 1000;

  const filtered = tasks.filter((task) => {
    if (filterTag && !(task.tags || []).includes(filterTag)) return false;
    if (filterProject && task.projectId !== filterProject) return false;
    return true;
  });

  const visibleColumns = showCompleted
    ? STATUS_COLUMNS
    : STATUS_COLUMNS.filter((col) => col.key !== "completed");

  return visibleColumns.map((col) => {
    const items = filtered
      .filter((t) => {
        if (col.key === "completed" && t.completedAt && t.completedAt < cutoff) {
          return false;
        }
        return t.status === col.key;
      })
      .sort(col.sort);
    return { ...col, items };
  });
};
