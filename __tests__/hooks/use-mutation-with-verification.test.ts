import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mocks before hook import
vi.mock('../src/utils/api', () => ({ apiFetch: vi.fn() }));
vi.mock('../src/lib/focus-logic', () => ({
  normalizeNextAction: (t: unknown) => t,
}));
vi.mock('../src/lib/inbox-logic', () => ({
  splitInboxNotes: () => ({ workbenchNotes: [], archiveNotes: [] }),
}));
vi.mock('../src/lib/projects-logic', () => ({}));

const mockInvalidateQueries = vi.fn();
const mockUseMutation = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: (opts: unknown) => mockUseMutation(opts),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

describe('useMutationWithVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('is exported from the adapter', async () => {
    const { useMutationWithVerification } =
      await import('../../app/hooks/use-mutation-with-verification');
    expect(typeof useMutationWithVerification).toBe('function');
  });

  it('calls onMutate to write provisional verification', async () => {
    const { useMutationWithVerification } =
      await import('../../app/hooks/use-mutation-with-verification');

    const mutationFn = vi.fn().mockResolvedValue({ ok: true });

    renderHook(() =>
      useMutationWithVerification({
        mutationFn,
        domain: 'work',
        actionId: 'action-1',
      })
    );

    // onMutate should be wired into useMutation options
    const capturedOpts = mockUseMutation.mock.calls[0]?.[0];
    expect(typeof capturedOpts?.onMutate).toBe('function');
  });

  it('onMutate pushes a pending verification item into the store', async () => {
    const { useMutationWithVerification } =
      await import('../../app/hooks/use-mutation-with-verification');
    const { useUIStore } = await import('../../src/store/ui');

    const mutationFn = vi.fn().mockResolvedValue({ ok: true });

    renderHook(() =>
      useMutationWithVerification({
        mutationFn,
        domain: 'work',
        actionId: 'action-2',
      })
    );

    const capturedOpts = mockUseMutation.mock.calls[0]?.[0];

    await act(async () => {
      await capturedOpts.onMutate();
    });

    const { phase, visible } = useUIStore.getState().verification;
    expect(phase).toBe('pending');
    expect(visible).toBe(true);
  });

  it('onSuccess resolves verification and invalidates domain queries', async () => {
    const { useMutationWithVerification } =
      await import('../../app/hooks/use-mutation-with-verification');
    const { useUIStore } = await import('../../src/store/ui');

    const mutationFn = vi.fn().mockResolvedValue({ ok: true });

    renderHook(() =>
      useMutationWithVerification({
        mutationFn,
        domain: 'work',
        actionId: 'action-3',
      })
    );

    const capturedOpts = mockUseMutation.mock.calls[0]?.[0];

    await act(async () => {
      await capturedOpts.onMutate?.();
      await capturedOpts.onSuccess?.({ ok: true });
    });

    expect(useUIStore.getState().verification.phase).toBe('resolved');
    expect(mockInvalidateQueries).toHaveBeenCalled();
  });

  it('onError sets verification to failed', async () => {
    const { useMutationWithVerification } =
      await import('../../app/hooks/use-mutation-with-verification');
    const { useUIStore } = await import('../../src/store/ui');

    const mutationFn = vi.fn().mockRejectedValue(new Error('fail'));

    renderHook(() =>
      useMutationWithVerification({
        mutationFn,
        domain: 'knowledge',
        actionId: 'action-4',
      })
    );

    const capturedOpts = mockUseMutation.mock.calls[0]?.[0];

    await act(async () => {
      await capturedOpts.onMutate?.();
      await capturedOpts.onError?.(new Error('fail'));
    });

    expect(useUIStore.getState().verification.phase).toBe('failed');
  });
});
