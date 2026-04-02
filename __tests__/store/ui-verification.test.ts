import { describe, it, expect, beforeEach, vi } from 'vitest';

// Re-import store fresh for each test
let useUIStore: typeof import('../../src/store/ui').useUIStore;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../../src/store/ui');
  useUIStore = mod.useUIStore;
  // Reset store to initial state
  useUIStore.setState(useUIStore.getInitialState?.() ?? useUIStore.getState());
});

describe('verification slice — persistence contract', () => {
  it('stays visible and does not auto-dismiss after transitioning to resolved', async () => {
    vi.useFakeTimers();

    const store = useUIStore.getState();
    store.setVerificationPhase('pending', 'v1');

    expect(useUIStore.getState().verification.phase).toBe('pending');
    expect(useUIStore.getState().verification.visible).toBe(true);

    store.setVerificationPhase('resolved', 'v1');

    // Advance timers well past any setTimeout that might auto-dismiss
    vi.advanceTimersByTime(10_000);

    const { phase, visible } = useUIStore.getState().verification;
    expect(phase).toBe('resolved');
    expect(visible).toBe(true);

    vi.useRealTimers();
  });

  it('stays visible after transitioning to failed', async () => {
    vi.useFakeTimers();

    const store = useUIStore.getState();
    store.setVerificationPhase('failed', 'v2');

    vi.advanceTimersByTime(10_000);

    const { phase, visible } = useUIStore.getState().verification;
    expect(phase).toBe('failed');
    expect(visible).toBe(true);

    vi.useRealTimers();
  });

  it('setVerificationVisible(false) dismisses explicitly', () => {
    const store = useUIStore.getState();
    store.setVerificationPhase('resolved', 'v3');
    store.setVerificationVisible(false);

    expect(useUIStore.getState().verification.visible).toBe(false);
  });

  it('idle phase hides the rail', () => {
    const store = useUIStore.getState();
    store.setVerificationPhase('pending', 'v4');
    store.setVerificationPhase('idle');

    const { phase, visible } = useUIStore.getState().verification;
    expect(phase).toBe('idle');
    expect(visible).toBe(false);
  });
});
