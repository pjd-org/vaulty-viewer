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

import { apiFetch } from '../src/utils/api';
import { getHomeSurfaceQueryOptions } from '../app/lib/viewer-adapter';
import { UnauthenticatedError } from '../src/utils/api';

const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockApiFetch.mockReset();
});

describe('getHomeSurfaceQueryOptions — queryFn', () => {
  it('throws UnauthenticatedError when API returns 401', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 401 });
    const { queryFn } = getHomeSurfaceQueryOptions();
    await expect(queryFn()).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('UnauthenticatedError has descriptive message', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 401 });
    const { queryFn } = getHomeSurfaceQueryOptions();
    await expect(queryFn()).rejects.toThrow('401');
  });

  it('throws generic Error (not UnauthenticatedError) on other non-ok status', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 403 });
    const { queryFn } = getHomeSurfaceQueryOptions();
    await expect(queryFn()).rejects.toSatisfy(
      (e: unknown) => e instanceof Error && !(e instanceof UnauthenticatedError)
    );
  });

  it('returns parsed payload on success', async () => {
    const payload = {
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
    mockApiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ structuredContent: payload }),
    });
    const { queryFn } = getHomeSurfaceQueryOptions();
    const result = await queryFn();
    expect(result.pressureBand).toEqual([]);
  });
});
