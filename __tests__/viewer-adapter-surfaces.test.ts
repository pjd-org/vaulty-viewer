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
import {
  getInboxSurfaceQueryOptions,
  getActionsSurfaceQueryOptions,
  getActiveSessionQueryOptions,
  getRecentSessionsQueryOptions,
  getSessionDetailQueryOptions,
} from '../app/lib/viewer-adapter';

const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockApiFetch.mockReset();
});

// ---------------------------------------------------------------------------
// Inbox surface
// ---------------------------------------------------------------------------

describe('getInboxSurfaceQueryOptions — queryFn 401', () => {
  it('throws UnauthenticatedError when API returns 401', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 401 });
    const { queryFn } = getInboxSurfaceQueryOptions();
    await expect(queryFn()).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});

// ---------------------------------------------------------------------------
// Actions surface
// ---------------------------------------------------------------------------

describe('getActionsSurfaceQueryOptions — queryFn 401', () => {
  it('throws UnauthenticatedError when API returns 401', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 401 });
    const { queryFn } = getActionsSurfaceQueryOptions();
    await expect(queryFn()).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});

// ---------------------------------------------------------------------------
// Active session
// ---------------------------------------------------------------------------

describe('getActiveSessionQueryOptions — queryFn 401', () => {
  it('throws UnauthenticatedError when API returns 401', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 401 });
    const { queryFn } = getActiveSessionQueryOptions();
    await expect(queryFn()).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});

// ---------------------------------------------------------------------------
// Recent sessions
// ---------------------------------------------------------------------------

describe('getRecentSessionsQueryOptions — queryFn 401', () => {
  it('throws UnauthenticatedError when API returns 401', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 401 });
    const { queryFn } = getRecentSessionsQueryOptions();
    await expect(queryFn()).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});

// ---------------------------------------------------------------------------
// Session detail — 401 distinct from 404
// ---------------------------------------------------------------------------

describe('getSessionDetailQueryOptions — queryFn 401', () => {
  it('throws UnauthenticatedError when API returns 401', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 401 });
    const { queryFn } = getSessionDetailQueryOptions('session-abc');
    await expect(queryFn()).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('throws generic Error (not UnauthenticatedError) for 404', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 404 });
    const { queryFn } = getSessionDetailQueryOptions('session-abc');
    await expect(queryFn()).rejects.toSatisfy(
      (e: unknown) => e instanceof Error && !(e instanceof UnauthenticatedError)
    );
  });
});
