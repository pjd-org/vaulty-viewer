import { beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'agent-shell:threads';
const PERSISTED_THREAD = {
  id: 'da-persisted',
  mode: 'deepagent' as const,
  title: 'Persisted thread',
  preview: 'Persisted preview',
  createdAt: '2026-04-23T10:00:00.000Z',
  updatedAt: '2026-04-23T10:01:00.000Z',
};

describe('thread registry hydration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('keeps initial state empty and hydrates only when requested', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([PERSISTED_THREAD]));
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    const { ThreadRegistry } = await import(
      '../../app/lib/agent-shell/thread-registry'
    );

    expect(getItemSpy).not.toHaveBeenCalled();
    expect(ThreadRegistry.list()).toEqual([]);

    ThreadRegistry.hydrateFromStorage();

    expect(getItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    expect(ThreadRegistry.list()).toEqual([PERSISTED_THREAD]);
  });

  it('hydrates before upsert so persisted history is not dropped', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([PERSISTED_THREAD]));

    const { ThreadRegistry } = await import(
      '../../app/lib/agent-shell/thread-registry'
    );

    ThreadRegistry.upsert({
      id: 'da-new',
      mode: 'deepagent',
      title: 'New thread',
      preview: 'New preview',
    });

    const ids = ThreadRegistry.list().map((entry) => entry.id);
    expect(ids).toContain('da-persisted');
    expect(ids).toContain('da-new');
  });

  it('uses the current Agent Shell default mode for new entries without a mode', async () => {
    const { ThreadRegistry } = await import(
      '../../app/lib/agent-shell/thread-registry'
    );

    ThreadRegistry.upsert({
      id: 'pr-new',
      title: 'New default thread',
    });

    expect(ThreadRegistry.get('pr-new')?.mode).toBe('prompt_runner');
  });
});
