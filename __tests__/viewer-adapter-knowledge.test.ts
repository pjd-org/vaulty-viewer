import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock apiFetch and dependencies before importing adapter
vi.mock('../src/utils/api', () => ({
  apiFetch: vi.fn(),
}));
vi.mock('../src/lib/focus-logic', () => ({
  normalizeNextAction: (t: unknown) => t,
}));
vi.mock('../src/lib/inbox-logic', () => ({
  splitInboxNotes: () => ({ workbenchNotes: [], archiveNotes: [] }),
}));
vi.mock('../src/lib/projects-logic', () => ({}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  queryOptions: (o: unknown) => o,
}));

import { apiFetch } from '../src/utils/api';

describe('Knowledge surface adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports getKnowledgeSurfaceQueryOptions with correct key and staleTime', async () => {
    const { getKnowledgeSurfaceQueryOptions } =
      await import('../app/lib/viewer-adapter');

    expect(typeof getKnowledgeSurfaceQueryOptions).toBe('function');
    const opts = getKnowledgeSurfaceQueryOptions();
    expect(opts.queryKey).toEqual(['viewer-adapter', 'knowledge-surface']);
    expect(typeof opts.queryFn).toBe('function');
    expect(opts.staleTime).toBeGreaterThan(0);
  });

  it('queryFn returns a KnowledgeSurfacePayload with required fields', async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        structuredContent: { notes: [], graph: { nodes: [], edges: [] } },
      }),
    });

    const { getKnowledgeSurfaceQueryOptions } =
      await import('../app/lib/viewer-adapter');

    const result = await getKnowledgeSurfaceQueryOptions().queryFn();

    // Required fields from COD-VIEWER-ADAPTER-SPEC.md Knowledge surface
    expect(Array.isArray(result.selectedContext)).toBe(true);
    expect(Array.isArray(result.linkedEntities)).toBe(true);
    expect(Array.isArray(result.suggestedTemplates)).toBe(true);
    expect(Array.isArray(result.suggestedActions)).toBe(true);
  });

  it('exports useKnowledgeSurface hook', async () => {
    const { useKnowledgeSurface } = await import('../app/lib/viewer-adapter');
    expect(typeof useKnowledgeSurface).toBe('function');
  });
});
