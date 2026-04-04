import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must come before adapter import
// ---------------------------------------------------------------------------

vi.mock('../src/utils/api', () => ({ apiFetch: vi.fn() }));
vi.mock('../src/lib/focus-logic', () => ({
  normalizeNextAction: (t: unknown) => t,
}));
vi.mock('../src/lib/inbox-logic', () => ({
  splitInboxNotes: () => ({ workbenchNotes: [], archiveNotes: [] }),
}));
vi.mock('../src/lib/projects-logic', () => ({}));
vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn() }));

// ---------------------------------------------------------------------------
// System under test
// ---------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';
import {
  useArchiveSurface,
  type ArchiveSurfacePayload,
} from '../app/lib/viewer-adapter';

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

function captureQueryOptions():
  | { queryKey?: unknown[]; select?: (data: unknown) => ArchiveSurfacePayload }
  | undefined {
  mockUseQuery.mockReturnValue({
    isLoading: false,
    data: undefined,
    isError: false,
  });
  useArchiveSurface();
  return mockUseQuery.mock.calls.at(-1)?.[0] as
    | {
        queryKey?: unknown[];
        select?: (data: unknown) => ArchiveSurfacePayload;
      }
    | undefined;
}

beforeEach(() => {
  mockUseQuery.mockReset();
});

const INBOX_ITEMS = [
  { id: 'a', title: 'A', inboxBucket: 'rejected_user' },
  { id: 'b', title: 'B', inboxBucket: 'rejected_automated' },
  { id: 'c', title: 'C', inboxBucket: 'rejected_automated' },
  { id: 'd', title: 'D', inboxBucket: 'deferred' },
  { id: 'e', title: 'E', inboxBucket: 'needs_action' }, // active — excluded
  { id: 'f', title: 'F', inboxBucket: 'stale' }, // active — excluded
];

describe('useArchiveSurface', () => {
  it('returns loading state initially', () => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    });
    const result = useArchiveSurface();
    expect(result.isLoading).toBe(true);
  });

  it('uses query key [viewer-adapter, inbox-surface] (shared cache)', () => {
    const opts = captureQueryOptions();
    expect(opts?.queryKey).toEqual(['viewer-adapter', 'inbox-surface']);
  });

  it('select filters out active inbox buckets', () => {
    const opts = captureQueryOptions();
    const result = opts!.select!(INBOX_ITEMS);
    expect(result.total).toBe(4);
  });

  it('select groups rejectedUser correctly', () => {
    const opts = captureQueryOptions();
    const result = opts!.select!(INBOX_ITEMS);
    expect(result.rejectedUser).toHaveLength(1);
    expect(result.rejectedUser[0]?.id).toBe('a');
  });

  it('select groups rejectedAutomated correctly', () => {
    const opts = captureQueryOptions();
    const result = opts!.select!(INBOX_ITEMS);
    expect(result.rejectedAutomated).toHaveLength(2);
    expect(result.rejectedAutomated.map((x) => x.id)).toEqual(['b', 'c']);
  });

  it('select groups deferred correctly', () => {
    const opts = captureQueryOptions();
    const result = opts!.select!(INBOX_ITEMS);
    expect(result.deferred).toHaveLength(1);
    expect(result.deferred[0]?.id).toBe('d');
  });
});
