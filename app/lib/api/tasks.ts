import {
  apiFetch,
  ForbiddenError,
  UnauthenticatedError,
} from '../../../src/utils/api';
import { normalizeTask, type KanbanTask } from '../../../src/lib/kanban-logic';

export async function fetchAllTasks(): Promise<KanbanTask[]> {
  const res = await apiFetch('/api/v1/tasks?status=all&limit=1000');
  if (res.status === 401) {
    throw new UnauthenticatedError('Failed to fetch tasks: 401');
  }
  if (res.status === 403) {
    throw new ForbiddenError('Failed to fetch tasks: 403');
  }
  if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
  const body = await res.json();
  const raw = body.structuredContent?.tasks ?? body.tasks ?? [];
  return raw.map((r: any) => normalizeTask(r));
}

export async function fetchNextActions(): Promise<
  Array<{ id: string; title: string; path: string }>
> {
  const res = await apiFetch('/api/v1/tasks/next-actions?max=50');
  if (res.status === 401) {
    throw new UnauthenticatedError('Failed to fetch next actions: 401');
  }
  if (res.status === 403) {
    throw new ForbiddenError('Failed to fetch next actions: 403');
  }
  if (!res.ok) throw new Error(`Failed to fetch next actions: ${res.status}`);
  const body = await res.json();
  const raw = body.structuredContent?.tasks ?? body.tasks ?? [];
  return raw.map((r: any) => ({
    id: r.id ?? r.path,
    title: r.title ?? r.summary ?? '',
    path: r.path ?? r.id,
  }));
}

export async function updateTaskStatus(path: string, status: string) {
  const encoded = encodeURIComponent(path);
  const res = await apiFetch(`/api/v1/tasks/${encoded}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update task status: ${res.status}`);
  }
  return res.ok;
}

export interface TaskMetrics {
  path: string;
  title: string;
  status: string;
  priority: number;
  effortScore: number;
  focusCost: number;
  estimatedTimeMin: number;
  milestone?: number;
  rewardPotential?: number;
  blockerCount?: number;
  checklistProgress?: string;
}

export async function fetchTaskMetrics(path: string): Promise<TaskMetrics> {
  const encoded = encodeURIComponent(path);
  const res = await apiFetch(`/api/v1/tasks/${encoded}`);
  if (res.status === 401) {
    throw new UnauthenticatedError('Failed to fetch task metrics: 401');
  }
  if (res.status === 403) {
    throw new ForbiddenError('Failed to fetch task metrics: 403');
  }
  if (!res.ok) throw new Error(`Failed to fetch task metrics: ${res.status}`);
  const body = await res.json();
  const task = body.structuredContent?.task ?? body.task ?? body;
  return {
    path: task.path ?? path,
    title: task.title ?? '',
    status: task.status ?? 'unknown',
    priority: task.priority ?? 0,
    effortScore: task.effortScore ?? task.effort_score ?? 0,
    focusCost: task.focusCost ?? task.focus_cost ?? 0,
    estimatedTimeMin: task.estimatedTimeMin ?? task.estimated_time_min ?? 0,
    milestone: task.milestone,
    rewardPotential: task.rewardPotential ?? task.reward_potential,
    blockerCount: task.blockerCount ?? task.blocker_count ?? 0,
    checklistProgress: task.checklistProgress ?? task.checklist_progress,
  };
}
