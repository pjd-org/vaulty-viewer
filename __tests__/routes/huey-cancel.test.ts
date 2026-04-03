/**
 * Huey route — reducer behaviour (Phase 8)
 *
 * messages/sending/cancelled are now managed by the @assistant-ui/react
 * LocalRuntime. The hueyReducer is responsible only for:
 *   - threads sidebar state
 *   - active threadId
 *   - activeIntent
 *
 * Tests cover:
 *   1. NEW_THREAD resets threadId and clears activeIntent
 *   2. SWITCH_THREAD changes threadId and clears activeIntent
 *   3. SET_INTENT updates activeIntent (and toggles to null)
 *   4. THREADS_REFRESHED replaces threads list without touching threadId/intent
 */

import { describe, it, expect } from 'vitest';
import {
  hueyReducer,
  type HueyState,
  type HueyAction,
} from '../../app/routes/huey';

const baseState: HueyState = {
  threads: [],
  threadId: 'huey-thread-initial',
  activeIntent: null,
};

describe('huey reducer', () => {
  it('NEW_THREAD sets a new threadId and clears activeIntent', () => {
    const withIntent: HueyState = {
      ...baseState,
      activeIntent: 'plan_next_step',
    };
    const next = hueyReducer(withIntent, {
      type: 'NEW_THREAD',
      threadId: 'huey-thread-1234',
    });
    expect(next.threadId).toBe('huey-thread-1234');
    expect(next.activeIntent).toBeNull();
  });

  it('SWITCH_THREAD changes threadId and clears activeIntent', () => {
    const withIntent: HueyState = {
      ...baseState,
      threadId: 'huey-thread-aaa',
      activeIntent: 'debug_blocker',
    };
    const next = hueyReducer(withIntent, {
      type: 'SWITCH_THREAD',
      threadId: 'huey-thread-bbb',
    });
    expect(next.threadId).toBe('huey-thread-bbb');
    expect(next.activeIntent).toBeNull();
  });

  it('SET_INTENT updates activeIntent', () => {
    const next = hueyReducer(baseState, {
      type: 'SET_INTENT',
      intent: 'generate_code',
    });
    expect(next.activeIntent).toBe('generate_code');
  });

  it('SET_INTENT to null clears activeIntent', () => {
    const withIntent: HueyState = {
      ...baseState,
      activeIntent: 'summarize_state',
    };
    const next = hueyReducer(withIntent, { type: 'SET_INTENT', intent: null });
    expect(next.activeIntent).toBeNull();
  });

  it('THREADS_REFRESHED replaces threads without touching threadId or activeIntent', () => {
    const threads = [
      {
        id: 'huey-thread-x',
        title: 'Test thread',
        intent: null,
        emoji: '💬',
        timestamp: Date.now(),
      },
    ];
    const withIntent: HueyState = {
      ...baseState,
      threadId: 'huey-thread-current',
      activeIntent: 'review_spec',
    };
    const action: HueyAction = { type: 'THREADS_REFRESHED', threads };
    const next = hueyReducer(withIntent, action);
    expect(next.threads).toBe(threads);
    expect(next.threadId).toBe('huey-thread-current');
    expect(next.activeIntent).toBe('review_spec');
  });
});
