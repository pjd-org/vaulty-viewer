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
  useAutomationSurface,
  type AutomationSurfacePayload,
} from '../app/lib/viewer-adapter';

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>;

function makeApiResponse(data: unknown) {
  return { ok: true, status: 200, json: async () => data };
}

const PIPELINES_RESPONSE = { pipelines: ['daily-digest', 'inbox-triage'] };
const SCHEDULER_RESPONSE = {
  enabled: true,
  mode: 'auto',
  tz: 'America/New_York',
  allowlist: [],
  jobs: [
    {
      id: 'job-1',
      pipeline: 'daily-digest',
      cron: '0 9 * * *',
      mode: 'auto',
      source: 'file',
      lastRun: null,
    },
  ],
};

function captureQueryFn():
  | (() => Promise<AutomationSurfacePayload>)
  | undefined {
  mockUseQuery.mockReturnValue({
    isLoading: false,
    data: undefined,
    isError: false,
  });
  useAutomationSurface();
  const args = mockUseQuery.mock.calls.at(-1)?.[0] as {
    queryFn?: () => Promise<AutomationSurfacePayload>;
  };
  return args?.queryFn;
}

beforeEach(() => {
  mockApiFetch.mockReset();
  mockUseQuery.mockReset();
});

describe('useAutomationSurface', () => {
  it('returns loading state initially', () => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    });
    const result = useAutomationSurface();
    expect(result.isLoading).toBe(true);
  });

  it('queryFn calls both /api/v1/pipelines and /api/v1/scheduler/status', async () => {
    mockApiFetch
      .mockResolvedValueOnce(makeApiResponse(PIPELINES_RESPONSE))
      .mockResolvedValueOnce(makeApiResponse(SCHEDULER_RESPONSE));
    const queryFn = captureQueryFn();
    await queryFn!();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/pipelines');
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/scheduler/status');
  });

  it('queryFn returns normalized pipelines', async () => {
    mockApiFetch
      .mockResolvedValueOnce(makeApiResponse(PIPELINES_RESPONSE))
      .mockResolvedValueOnce(makeApiResponse(SCHEDULER_RESPONSE));
    const queryFn = captureQueryFn();
    const payload = await queryFn!();
    expect(payload.pipelines).toHaveLength(2);
    expect(payload.pipelines[0]?.name).toBe('daily-digest');
    expect(payload.pipelines[1]?.name).toBe('inbox-triage');
  });

  it('queryFn returns normalized scheduler', async () => {
    mockApiFetch
      .mockResolvedValueOnce(makeApiResponse(PIPELINES_RESPONSE))
      .mockResolvedValueOnce(makeApiResponse(SCHEDULER_RESPONSE));
    const queryFn = captureQueryFn();
    const payload = await queryFn!();
    expect(payload.scheduler.enabled).toBe(true);
    expect(payload.scheduler.mode).toBe('auto');
    expect(payload.scheduler.tz).toBe('America/New_York');
    expect(payload.scheduler.jobs).toHaveLength(1);
    expect(payload.scheduler.jobs[0]?.id).toBe('job-1');
  });

  it('handles empty pipelines list', async () => {
    mockApiFetch
      .mockResolvedValueOnce(makeApiResponse({ pipelines: [] }))
      .mockResolvedValueOnce(makeApiResponse(SCHEDULER_RESPONSE));
    const queryFn = captureQueryFn();
    const payload = await queryFn!();
    expect(payload.pipelines).toHaveLength(0);
  });

  it('uses query key [viewer-adapter, automation-surface]', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: false,
    });
    useAutomationSurface();
    const args = mockUseQuery.mock.calls.at(-1)?.[0] as {
      queryKey?: unknown[];
    };
    expect(args?.queryKey).toEqual(['viewer-adapter', 'automation-surface']);
  });

  it('queryFn throws UnauthenticatedError when pipelines returns 401', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce(makeApiResponse(SCHEDULER_RESPONSE));
    const queryFn = captureQueryFn();
    await expect(queryFn!()).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('queryFn throws UnauthenticatedError when scheduler returns 401', async () => {
    mockApiFetch
      .mockResolvedValueOnce(makeApiResponse(PIPELINES_RESPONSE))
      .mockResolvedValueOnce({ ok: false, status: 401 });
    const queryFn = captureQueryFn();
    await expect(queryFn!()).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
