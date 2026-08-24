// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('../src/hooks/useHydrated', () => ({
  useHydrated: () => true,
}));

vi.mock('../src/utils/api', () => ({
  default: () => 'http://viewer.test',
  apiFetch: vi.fn(),
  ForbiddenError: class ForbiddenError extends Error {},
  UnauthenticatedError: class UnauthenticatedError extends Error {},
}));

describe('useInbox', () => {
  it('routes inbox/rejected notes into archiveNotes instead of workbenchNotes', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        notes: [
          {
            path: 'inbox/rejected/rejected-item.md',
            title: 'Rejected item',
            status: 'rejected',
          },
          {
            path: 'inbox/extracted/workbench-item.md',
            title: 'Workbench item',
            status: 'draft',
          },
        ],
        runs: [],
      },
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseMutation.mockReturnValue({ mutateAsync: vi.fn() });

    const { useInbox } = await import('../src/hooks/useInbox');
    const { result } = renderHook(() => useInbox());

    expect(result.current.archiveNotes.map((note) => note.path)).toEqual([
      'inbox/rejected/rejected-item.md',
    ]);
    expect(result.current.workbenchNotes.map((note) => note.path)).toEqual([
      'inbox/extracted/workbench-item.md',
    ]);
    expect(result.current.counts).toEqual({ signals: 0, queue: 0, workbench: 1, archive: 1 });
  });
});
