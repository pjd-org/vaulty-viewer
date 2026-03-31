import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAllTasks, fetchNextActions, updateTaskStatus } from '../../app/lib/api/tasks';

const originalEnv = { ...process.env };
const originalWindow = globalThis.window;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  process.env = { ...originalEnv };
  delete globalThis.window;
});

afterEach(() => {
  process.env = { ...originalEnv };
  globalThis.window = originalWindow;
  globalThis.fetch = originalFetch;
});

describe('tasks API client', () => {
  it('fetchAllTasks parses tasks', async () => {
    const fake = { tasks: [{ id: 't1', title: 'Do thing', status: 'todo', path: 'path/to' }] };
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(fake) } as any));
    const out = await fetchAllTasks();
    expect(out.length).toBe(1);
    expect(out[0].id).toBe('t1');
  });

  it('uses the configured server API base for SSR task fetches', async () => {
    delete process.env.VAULT_API_URL;
    process.env.API_PROXY_URL = 'http://127.0.0.1:4300';

    const mockFetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ tasks: [] }) } as any)
    );
    global.fetch = mockFetch as typeof fetch;

    await fetchAllTasks();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0]?.[0]).toBe(
      'http://127.0.0.1:4300/api/v1/tasks?status=all&limit=1000'
    );
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
