import { apiFetch } from '../../../src/utils/api';
import { normalizeTask, type KanbanTask } from '../../../src/lib/kanban-logic';

export async function fetchAllTasks(): Promise<KanbanTask[]> {
  const res = await apiFetch('/api/v1/tasks?status=all&limit=1000');
  if (!res.ok) throw new Error('Failed to fetch tasks');
  const body = await res.json();
  const raw = body.structuredContent?.tasks ?? body.tasks ?? [];
  return raw.map((r: any) => normalizeTask(r));
}

export async function fetchNextActions(): Promise<
  Array<{ id: string; title: string; path: string }>
> {
  const res = await apiFetch('/api/v1/tasks/next-actions?max=50');
  if (!res.ok) throw new Error('Failed to fetch next actions');
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
  const res = await fetch(`/api/v1/tasks/${encoded}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error('Failed to update task status');
  }
  return res.ok;
}
