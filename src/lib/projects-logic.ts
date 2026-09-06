import type { KanbanTask } from './kanban-logic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProjectStatus = 'active' | 'at-risk' | 'blocked' | 'completed';

export interface ProjectTaskCounts {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  todo: number;
}

const PROJECT_STATUSES: readonly ProjectStatus[] = ['active', 'at-risk', 'blocked', 'completed'];

const isProjectStatus = (value: string): value is ProjectStatus =>
  (PROJECT_STATUSES as readonly string[]).includes(value);

/** A project note loaded directly from the vault (type: project). */
export interface ProjectNote {
  path: string;
  id: string;
  title: string;
  status: string;
  priority: number;
  horizon?: string;
  domain?: string;
  portfolioLane?: string;
  tags?: string[];
  created?: string;
  updated?: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  status: ProjectStatus;
  progress: number;
  priority: number;
  taskCounts: ProjectTaskCounts;
  /** Present when backed by a real vault project note */
  notePath?: string;
  /** Vault horizon field */
  horizon?: string;
  domain?: string;
  eta?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: string;
  priority: number;
  effortScore?: number;
  focusCost?: number;
  score?: number;
  path?: string;
  tags: string[];
  blockers: string[];
  estimatedTimeMin?: number;
}

// ---------------------------------------------------------------------------
// Normalise a raw project note from /api/v1/projects
// ---------------------------------------------------------------------------

export function normalizeProjectNote(raw: Record<string, unknown>): ProjectNote {
  return {
    path: String(raw.path ?? ''),
    id: String(raw.id ?? raw.path ?? ''),
    title: String(raw.title ?? raw.path ?? 'Untitled'),
    status: String(raw.status ?? 'active'),
    priority: typeof raw.priority === 'number' ? raw.priority : 5,
    horizon: raw.horizon != null ? String(raw.horizon) : undefined,
    domain: raw.domain != null ? String(raw.domain) : undefined,
    portfolioLane: raw.portfolio_lane != null ? String(raw.portfolio_lane) : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    created: raw.created != null ? String(raw.created) : undefined,
    updated: raw.updated != null ? String(raw.updated) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Derivation from tasks
// ---------------------------------------------------------------------------

function toTitleCase(id: string): string {
  return id
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function computeStatus(counts: ProjectTaskCounts, tasks: KanbanTask[]): ProjectStatus {
  if (counts.total > 0 && counts.done === counts.total) return 'completed';
  if (counts.blocked > 0) return 'blocked';
  if (counts.total > 0 && counts.done / counts.total > 0.7) return 'active';
  if (tasks.some((t) => t.status === 'at-risk')) return 'at-risk';
  return 'active';
}

function computeProgress(counts: ProjectTaskCounts): number {
  if (counts.total === 0) return 0;
  return Math.round((counts.done / counts.total) * 100);
}

export function deriveProjects(tasks: KanbanTask[]): ProjectSummary[] {
  const map = new Map<string, KanbanTask[]>();

  for (const task of tasks) {
    // Prefer explicit project/goal ID; fall back to domain as grouping key
    const raw = task as unknown as Record<string, unknown>;
    const key =
      task.projectId ||
      task.goalId ||
      (raw.project_id as string | undefined) ||
      (raw.goal_id as string | undefined) ||
      (raw.domain as string | undefined);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }

  const projects: ProjectSummary[] = [];

  for (const [id, group] of map.entries()) {
    const counts: ProjectTaskCounts = {
      total: group.length,
      done: group.filter((t) => t.status === 'completed').length,
      inProgress: group.filter((t) => t.status === 'in-progress').length,
      blocked: group.filter((t) => t.status === 'blocked').length,
      todo: group.filter((t) => t.status === 'todo' || t.status === 'backlog').length,
    };

    const maxPriority = Math.max(...group.map((t) => t.priority || 0), 0);

    projects.push({
      id,
      title: toTitleCase(id),
      status: computeStatus(counts, group),
      progress: computeProgress(counts),
      priority: maxPriority,
      taskCounts: counts,
    });
  }

  return projects;
}

/**
 * Merge real project notes with task-derived project summaries.
 * Project notes take precedence for title, priority, horizon, domain.
 * Task counts are always derived from tasks.
 */
export function mergeProjectsWithNotes(
  derived: ProjectSummary[],
  notes: ProjectNote[]
): ProjectSummary[] {
  const noteMap = new Map<string, ProjectNote>();
  for (const note of notes) {
    noteMap.set(note.id, note);
    // Also index by domain in case derived projects use domain as key
    if (note.domain) noteMap.set(note.domain, note);
  }

  // Add note-backed projects that have no tasks yet
  const derivedIds = new Set(derived.map((p) => p.id));
  const result: ProjectSummary[] = derived.map((p) => {
    const note = noteMap.get(p.id);
    if (!note) return p;
    return {
      ...p,
      title: note.title,
      priority: note.priority,
      notePath: note.path,
      horizon: note.horizon,
      domain: note.domain,
      // Note status wins when explicit; fall back to task-derived status.
      status: isProjectStatus(note.status) ? note.status : p.status,
    };
  });

  // Append note-only projects (no tasks yet)
  for (const note of notes) {
    if (derivedIds.has(note.id)) continue;
    const noteStatus = isProjectStatus(note.status) ? note.status : 'active';
    result.push({
      id: note.id,
      title: note.title,
      status: noteStatus,
      progress: 0,
      priority: note.priority,
      taskCounts: { total: 0, done: 0, inProgress: 0, blocked: 0, todo: 0 },
      notePath: note.path,
      horizon: note.horizon,
      domain: note.domain,
    });
  }

  return result;
}

export function filterProjects(
  projects: ProjectSummary[],
  filter: string
): ProjectSummary[] {
  switch (filter) {
    case 'active':
      return projects.filter((p) => p.status === 'active' || p.status === 'at-risk');
    case 'at-risk':
      return projects.filter((p) => p.status === 'at-risk');
    case 'blocked':
      return projects.filter((p) => p.status === 'blocked');
    case 'completed':
      return projects.filter((p) => p.status === 'completed');
    default:
      return projects.filter((p) => p.status !== 'completed');
  }
}

export function sortProjects(
  projects: ProjectSummary[],
  sortBy: string
): ProjectSummary[] {
  const sorted = [...projects];
  switch (sortBy) {
    case 'progress':
      return sorted.sort((a, b) => b.progress - a.progress);
    case 'tasks':
      return sorted.sort((a, b) => b.taskCounts.total - a.taskCounts.total);
    default:
      return sorted.sort((a, b) => b.priority - a.priority);
  }
}

export function getProjectTasks(
  tasks: KanbanTask[],
  projectId: string
): KanbanTask[] {
  return tasks.filter(
    (t) => t.projectId === projectId || t.goalId === projectId
  );
}

export function normalizeProjectTask(task: KanbanTask): ProjectTask {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    path: task.path,
    tags: task.tags ?? [],
    blockers: [],
    estimatedTimeMin: task.estimatedTimeMin,
  };
}

export function projectStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'blocked': return 'Blocked';
    case 'at-risk': return 'At Risk';
    default: return 'Active';
  }
}

export function computeProjectCounts(projects: ProjectSummary[]): {
  all: number;
  active: number;
  blocked: number;
  completed: number;
} {
  return {
    all: projects.length,
    active: projects.filter((p) => p.status === 'active' || p.status === 'at-risk').length,
    blocked: projects.filter((p) => p.status === 'blocked').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  };
}
