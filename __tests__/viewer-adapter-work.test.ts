import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must come before adapter import
// ---------------------------------------------------------------------------

vi.mock('../src/utils/api', () => ({
  apiFetch: vi.fn(),
  UnauthenticatedError: class UnauthenticatedError extends Error {
    readonly status = 401;
    constructor(message?: string) {
      super(message ?? 'Unauthenticated');
      this.name = 'UnauthenticatedError';
    }
  },
}));
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

import { apiFetch, UnauthenticatedError } from '../src/utils/api';
import { useQuery } from '@tanstack/react-query';
import {
  useWorkSurface,
  type WorkSurfacePayload,
} from '../app/lib/viewer-adapter';

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>;

function makeApiResponse(data: unknown) {
  return { ok: true, status: 200, json: async () => data };
}

const SAMPLE_TASKS = [
  {
    id: 'task-1',
    title: 'Fix the pipeline',
    path: 'notes/tasks/fix-pipeline.md',
    score: 8.5,
    priority: 9,
    effortScore: 5,
    focusCost: 4,
    estimatedTimeMin: 30,
    status: 'todo',
    tags: [],
  },
  {
    id: 'task-2',
    title: 'Write docs',
    path: 'notes/tasks/write-docs.md',
    score: 6.2,
    priority: 7,
    effortScore: 3,
    focusCost: 2,
    estimatedTimeMin: 60,
    status: 'todo',
    tags: ['docs'],
  },
];

const SAMPLE_RESPONSE = {
  structuredContent: {
    tasks: SAMPLE_TASKS,
    total: 2,
    mode: 'cod',
  },
  warnings: [],
};

function captureQueryFn(): (() => Promise<WorkSurfacePayload>) | undefined {
  mockUseQuery.mockReturnValue({
    isLoading: false,
    data: undefined,
    isError: false,
  });
  useWorkSurface();
  const args = mockUseQuery.mock.calls.at(-1)?.[0] as {
    queryFn?: () => Promise<WorkSurfacePayload>;
  };
  return args?.queryFn;
}

beforeEach(() => {
  mockApiFetch.mockReset();
  mockUseQuery.mockReset();
});

describe('useWorkSurface', () => {
  it('returns loading state initially', () => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    });
    const result = useWorkSurface();
    expect(result.isLoading).toBe(true);
  });

  it('queryFn calls /api/v1/tasks/next-actions', async () => {
    mockApiFetch.mockResolvedValueOnce(makeApiResponse(SAMPLE_RESPONSE));
    const queryFn = captureQueryFn();
    await queryFn!();
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/tasks/next-actions')
    );
  });

  it('queryFn returns normalized tasks', async () => {
    mockApiFetch.mockResolvedValueOnce(makeApiResponse(SAMPLE_RESPONSE));
    const queryFn = captureQueryFn();
    const payload = await queryFn!();
    expect(payload.tasks).toHaveLength(2);
    expect(payload.tasks[0]).toMatchObject({ id: 'task-1' });
  });

  it('returns correct total and mode', async () => {
    mockApiFetch.mockResolvedValueOnce(makeApiResponse(SAMPLE_RESPONSE));
    const queryFn = captureQueryFn();
    const payload = await queryFn!();
    expect(payload.total).toBe(2);
    expect(payload.mode).toBe('cod');
  });

  it('handles local_fallback mode', async () => {
    const fallbackResponse = {
      structuredContent: {
        tasks: SAMPLE_TASKS,
        total: 2,
        mode: 'local_fallback',
      },
      warnings: ['MCP unavailable'],
    };
    mockApiFetch.mockResolvedValueOnce(makeApiResponse(fallbackResponse));
    const queryFn = captureQueryFn();
    const payload = await queryFn!();
    expect(payload.mode).toBe('local_fallback');
    expect(payload.warnings).toContain('MCP unavailable');
  });

  it('uses query key [viewer-adapter, work-surface, 20]', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: false,
    });
    useWorkSurface();
    const args = mockUseQuery.mock.calls.at(-1)?.[0] as {
      queryKey?: unknown[];
    };
    expect(args?.queryKey).toEqual(['viewer-adapter', 'work-surface', 20]);
  });

  it('queryFn throws UnauthenticatedError on 401', async () => {
    mockApiFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const queryFn = captureQueryFn();
    await expect(queryFn!()).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
