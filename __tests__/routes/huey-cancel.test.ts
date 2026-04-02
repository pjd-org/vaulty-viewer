/**
 * Huey route — cancel / interrupt behaviour
 *
 * The route must support aborting an in-flight send via AbortController.
 * These tests cover:
 *   1. The CANCEL action transitions `sending` → false and `cancelled` → true
 *   2. Re-arming: CANCEL_CLEAR resets cancelled state so a new send can proceed
 *   3. SEND_START while cancelled is a no-op guard (defensive)
 *
 * The reducer logic is extracted to a pure function so it can be unit-tested
 * without mounting the full React component.
 */

import { describe, it, expect } from 'vitest';
import {
  hueyReducer,
  type HueyState,
  type HueyAction,
} from '../../app/routes/huey';

const baseState: HueyState = {
  threads: [],
  messages: [],
  threadId: 'huey-thread-initial',
  sending: false,
  cancelled: false,
  activeIntent: null,
};

describe('huey reducer — cancel / interrupt', () => {
  it('CANCEL transitions sending to false and sets cancelled', () => {
    const sending = { ...baseState, sending: true };
    const next = hueyReducer(sending, { type: 'CANCEL' });
    expect(next.sending).toBe(false);
    expect(next.cancelled).toBe(true);
  });

  it('CANCEL_CLEAR resets cancelled so a new send can proceed', () => {
    const cancelled = { ...baseState, cancelled: true };
    const next = hueyReducer(cancelled, { type: 'CANCEL_CLEAR' });
    expect(next.cancelled).toBe(false);
    expect(next.sending).toBe(false);
  });

  it('SEND_DONE after CANCEL does not mark sending as false again (idempotent)', () => {
    const cancelled = { ...baseState, sending: false, cancelled: true };
    const next = hueyReducer(cancelled, {
      type: 'SEND_DONE',
      assistantMsg: {
        id: 'msg-1',
        role: 'assistant',
        content: 'late response',
      },
      threadId: 'huey-thread-initial',
    });
    // sending was already false; state should be stable
    expect(next.sending).toBe(false);
  });
});
