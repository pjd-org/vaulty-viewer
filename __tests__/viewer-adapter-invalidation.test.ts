import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks before adapter import
vi.mock('../src/utils/api', () => ({ apiFetch: vi.fn() }));
vi.mock('../src/lib/focus-logic', () => ({
  normalizeNextAction: (t: unknown) => t,
}));
vi.mock('../src/lib/inbox-logic', () => ({
  splitInboxNotes: () => ({ workbenchNotes: [], archiveNotes: [] }),
}));
vi.mock('../src/lib/projects-logic', () => ({}));
vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn() }));

describe('invalidation helpers — per mutation domain', () => {
  let queryClient: { invalidateQueries: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.resetModules();
    queryClient = { invalidateQueries: vi.fn() };
  });

  it('exports invalidateQueriesForDomain', async () => {
    const { invalidateQueriesForDomain } =
      await import('../app/lib/viewer-adapter');
    expect(typeof invalidateQueriesForDomain).toBe('function');
  });

  it('automation domain invalidates automation + project + verification keys', async () => {
    const { invalidateQueriesForDomain } =
      await import('../app/lib/viewer-adapter');
    invalidateQueriesForDomain(queryClient as never, 'automation', {
      projectId: 'proj-1',
    });

    const calls = queryClient.invalidateQueries.mock.calls.map((c) => c[0]);
    expect(calls.some((k) => JSON.stringify(k).includes('automation'))).toBe(
      true
    );
    expect(calls.some((k) => JSON.stringify(k).includes('proj-1'))).toBe(true);
    expect(calls.some((k) => JSON.stringify(k).includes('verification'))).toBe(
      true
    );
  });

  it('work domain invalidates work + home surface', async () => {
    const { invalidateQueriesForDomain } =
      await import('../app/lib/viewer-adapter');
    invalidateQueriesForDomain(queryClient as never, 'work', {});

    const calls = queryClient.invalidateQueries.mock.calls.map((c) => c[0]);
    expect(calls.some((k) => JSON.stringify(k).includes('work'))).toBe(true);
    expect(calls.some((k) => JSON.stringify(k).includes('home'))).toBe(true);
  });

  it('knowledge domain invalidates knowledge-surface + note queries', async () => {
    const { invalidateQueriesForDomain } =
      await import('../app/lib/viewer-adapter');
    invalidateQueriesForDomain(queryClient as never, 'knowledge', {});

    const calls = queryClient.invalidateQueries.mock.calls.map((c) => c[0]);
    expect(calls.some((k) => JSON.stringify(k).includes('knowledge'))).toBe(
      true
    );
  });

  it('portfolio / bubble / health / timeline only invalidate their own lane', async () => {
    const { invalidateQueriesForDomain } =
      await import('../app/lib/viewer-adapter');

    for (const domain of [
      'portfolio',
      'bubble',
      'health',
      'timeline',
    ] as const) {
      queryClient.invalidateQueries.mockClear();
      invalidateQueriesForDomain(queryClient as never, domain, {});
      const calls = queryClient.invalidateQueries.mock.calls.map((c) => c[0]);
      expect(calls.some((k) => JSON.stringify(k).includes(domain))).toBe(true);
      // must NOT invalidate unrelated lanes
      const other = ['portfolio', 'bubble', 'health', 'timeline'].filter(
        (d) => d !== domain
      );
      for (const unrelated of other) {
        expect(calls.some((k) => JSON.stringify(k).includes(unrelated))).toBe(
          false
        );
      }
    }
  });
});
