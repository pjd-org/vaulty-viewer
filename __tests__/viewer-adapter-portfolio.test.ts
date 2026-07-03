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
  usePortfolioSurface,
  type PortfolioSurfacePayload,
  type HomeSurfacePayload,
} from '../app/lib/viewer-adapter';

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

function captureQueryOptions():
  | {
      queryKey?: unknown[];
      select?: (data: HomeSurfacePayload) => PortfolioSurfacePayload;
    }
  | undefined {
  mockUseQuery.mockReturnValue({
    isLoading: false,
    data: undefined,
    isError: false,
  });
  usePortfolioSurface();
  return mockUseQuery.mock.calls.at(-1)?.[0] as
    | {
        queryKey?: unknown[];
        select?: (data: HomeSurfacePayload) => PortfolioSurfacePayload;
      }
    | undefined;
}

beforeEach(() => {
  mockUseQuery.mockReset();
});

const SIGNAL = (id: string, projectId?: string) =>
  ({
    id,
    kind: 'portfolio' as const,
    title: `Signal ${id}`,
    summary: 'summary',
    severity: 'medium' as const,
    surfacedBy: 'cod' as const,
    sourceType: 'task' as const,
    sourceId: id,
    surfacedAt: '2026-04-04T00:00:00Z',
    whySurfaced: 'test',
    allowedActions: [],
    projectId,
  }) as import('../app/lib/viewer-adapter').PressureSignal;

const HOME_PAYLOAD_WITH_ITEMS: HomeSurfacePayload = {
  pressureBand: [],
  decisionQueue: [],
  immediateActions: [],
  verificationRail: [],
  snapshots: {
    automation: [],
    knowledge: [],
    portfolio: [SIGNAL('p1', 'proj-a'), SIGNAL('p2', 'proj-b')],
    bubble: [],
    health: [],
  },
  contextTail: [],
  tasks: [],
};

const HOME_PAYLOAD_EMPTY: HomeSurfacePayload = {
  pressureBand: [],
  decisionQueue: [],
  immediateActions: [],
  verificationRail: [],
  snapshots: {
    automation: [],
    knowledge: [],
    portfolio: [],
    bubble: [],
    health: [],
  },
  contextTail: [],
  tasks: [],
};

describe('usePortfolioSurface', () => {
  it('returns loading state initially', () => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    });
    const result = usePortfolioSurface();
    expect(result.isLoading).toBe(true);
  });

  it('uses query key [viewer-adapter, home-surface] (shared cache)', () => {
    const opts = captureQueryOptions();
    expect(opts?.queryKey).toEqual(['viewer-adapter', 'home-surface']);
  });

  it('select extracts items from snapshots.portfolio', () => {
    const opts = captureQueryOptions();
    const result = opts!.select!(HOME_PAYLOAD_WITH_ITEMS);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.id).toBe('p1');
    expect(result.items[1]?.id).toBe('p2');
  });

  it('select computes total correctly', () => {
    const opts = captureQueryOptions();
    const result = opts!.select!(HOME_PAYLOAD_WITH_ITEMS);
    expect(result.total).toBe(2);
  });

  it('select returns empty payload when no portfolio items', () => {
    const opts = captureQueryOptions();
    const result = opts!.select!(HOME_PAYLOAD_EMPTY);
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('select preserves projectId on each item', () => {
    const opts = captureQueryOptions();
    const result = opts!.select!(HOME_PAYLOAD_WITH_ITEMS);
    expect(result.items[0]?.projectId).toBe('proj-a');
    expect(result.items[1]?.projectId).toBe('proj-b');
  });

  it('select handles absent snapshots gracefully (null guard)', () => {
    const opts = captureQueryOptions();
    // Simulate malformed/absent snapshots
    const malformed = {
      ...HOME_PAYLOAD_WITH_ITEMS,
      snapshots: undefined,
    } as unknown as import('../app/lib/viewer-adapter').HomeSurfacePayload;
    const result = opts!.select!(malformed);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
