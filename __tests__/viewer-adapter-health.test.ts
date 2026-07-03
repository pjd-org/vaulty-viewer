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
  useHealthSurface,
  type HealthSurfacePayload,
} from '../app/lib/viewer-adapter';

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>;

function makeApiResponse(data: unknown) {
  return { ok: true, status: 200, json: async () => data };
}

// Helper: call useHealthSurface() and extract the queryFn from useQuery's call args
function captureQueryFn(): (() => Promise<HealthSurfacePayload>) | undefined {
  mockUseQuery.mockReturnValue({
    isLoading: false,
    data: undefined,
    isError: false,
  });
  useHealthSurface();
  const args = mockUseQuery.mock.calls.at(-1)?.[0] as {
    queryFn?: () => Promise<HealthSurfacePayload>;
  };
  return args?.queryFn;
}

const SAMPLE_RESPONSE = {
  status: 'ok' as const,
  service: 'vault-api',
  timestamp: '2026-04-04T00:00:00.000Z',
  uptime: 1234.5,
  memory: {
    rss: 50000000,
    heapUsed: 30000000,
    heapTotal: 40000000,
    external: 0,
    arrayBuffers: 0,
  },
  version: '1.0.0',
  node: 'v20.0.0',
  dependencies: {
    mcp: {
      status: 'ok' as const,
      url: 'http://localhost:9100',
      timeoutMs: 5000,
      latencyMs: 42,
      toolCount: 37,
    },
  },
};

beforeEach(() => {
  mockApiFetch.mockReset();
  mockUseQuery.mockReset();
});

describe('useHealthSurface', () => {
  it('returns loading state initially', () => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    });
    const result = useHealthSurface();
    expect(result.isLoading).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('queryFn calls /api/v1/health/detailed', async () => {
    mockApiFetch.mockResolvedValueOnce(makeApiResponse(SAMPLE_RESPONSE));
    const queryFn = captureQueryFn();
    expect(queryFn).toBeDefined();
    await queryFn!();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/health/detailed');
  });

  it('queryFn returns health payload with overall ok', async () => {
    mockApiFetch.mockResolvedValueOnce(makeApiResponse(SAMPLE_RESPONSE));
    const queryFn = captureQueryFn();
    const payload = await queryFn!();
    expect(payload.overall).toBe('ok');
    expect(payload.services).toHaveLength(2);
    expect(payload.timestamp).toBe('2026-04-04T00:00:00.000Z');
  });

  it('maps API service into services list', async () => {
    mockApiFetch.mockResolvedValueOnce(makeApiResponse(SAMPLE_RESPONSE));
    const queryFn = captureQueryFn();
    const payload = await queryFn!();
    const api = payload.services.find((s) => s.id === 'vault-api');
    expect(api).toBeDefined();
    expect(api!.status).toBe('ok');
    expect(api!.version).toBe('1.0.0');
    expect(api!.uptime).toBe(1234.5);
  });

  it('maps MCP dependency into services list', async () => {
    mockApiFetch.mockResolvedValueOnce(makeApiResponse(SAMPLE_RESPONSE));
    const queryFn = captureQueryFn();
    const payload = await queryFn!();
    const mcp = payload.services.find((s) => s.id === 'mcp');
    expect(mcp).toBeDefined();
    expect(mcp!.status).toBe('ok');
    expect(mcp!.latencyMs).toBe(42);
    expect(mcp!.toolCount).toBe(37);
  });

  it('sets overall to "degraded" when API status is degraded', async () => {
    const degraded = {
      ...SAMPLE_RESPONSE,
      status: 'degraded' as const,
      dependencies: {
        mcp: { ...SAMPLE_RESPONSE.dependencies.mcp, status: 'error' as const },
      },
    };
    mockApiFetch.mockResolvedValueOnce(makeApiResponse(degraded));
    const queryFn = captureQueryFn();
    const payload = await queryFn!();
    expect(payload.overall).toBe('degraded');
    const mcp = payload.services.find((s) => s.id === 'mcp');
    expect(mcp!.status).toBe('error');
  });

  it('queryFn throws UnauthenticatedError on 401', async () => {
    mockApiFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    const queryFn = captureQueryFn();
    await expect(queryFn!()).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
