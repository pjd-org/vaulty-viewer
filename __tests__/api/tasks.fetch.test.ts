import { describe, it, expect, vi } from 'vitest';
import { fetchAllTasks, fetchNextActions, updateTaskStatus } from '../../../app/lib/api/tasks';

describe('tasks API client', () => {
  it('fetchAllTasks parses tasks', async () => {
    const fake = { tasks: [{ id: 't1', title: 'Do thing', status: 'todo', path: 'path/to' }] };
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(fake) } as any));
    const out = await fetchAllTasks();
    expect(out.length).toBe(1);
    expect(out[0].id).toBe('t1');
  });

  it('fetchNextActions returns list', async () => {
    const fake = { tasks: [{ id: 'n1', title: 'Next', path: 'p' }] };
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(fake) } as any));
    const out = await fetchNextActions();
    expect(out.length).toBe(1);
    expect(out[0].title).toBe('Next');
  });

  it('updateTaskStatus calls patch', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true } as any));
    const ok = await updateTaskStatus('path/to', 'done');
    expect(ok).toBe(true);
  });
});
