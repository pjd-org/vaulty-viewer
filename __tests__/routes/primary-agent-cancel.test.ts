/**
 * PrimaryAgent route — reducer behaviour (Phase 8)
 *
 * messages/sending/cancelled are now managed by the @assistant-ui/react
 * LocalRuntime. The primary-agentReducer is responsible only for:
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
  primaryAgentReducer,
  type PrimaryAgentState,
  type PrimaryAgentAction,
} from '../../app/routes/primary-agent';

const baseState: PrimaryAgentState = {
  threads: [],
  threadId: 'primary-agent-thread-initial',
  activeIntent: null,
};

describe('primary-agent reducer', () => {
  it('NEW_THREAD sets a new threadId and clears activeIntent', () => {
    const withIntent: PrimaryAgentState = {
      ...baseState,
      activeIntent: 'plan_next_step',
    };
    const next = primaryAgentReducer(withIntent, {
      type: 'NEW_THREAD',
      threadId: 'primary-agent-thread-1234',
    });
    expect(next.threadId).toBe('primary-agent-thread-1234');
    expect(next.activeIntent).toBeNull();
  });

  it('SWITCH_THREAD changes threadId and clears activeIntent', () => {
    const withIntent: PrimaryAgentState = {
      ...baseState,
      threadId: 'primary-agent-thread-aaa',
      activeIntent: 'debug_blocker',
    };
    const next = primaryAgentReducer(withIntent, {
      type: 'SWITCH_THREAD',
      threadId: 'primary-agent-thread-bbb',
    });
    expect(next.threadId).toBe('primary-agent-thread-bbb');
    expect(next.activeIntent).toBeNull();
  });

  it('SET_INTENT updates activeIntent', () => {
    const next = primaryAgentReducer(baseState, {
      type: 'SET_INTENT',
      intent: 'generate_code',
    });
    expect(next.activeIntent).toBe('generate_code');
  });

  it('SET_INTENT to null clears activeIntent', () => {
    const withIntent: PrimaryAgentState = {
      ...baseState,
      activeIntent: 'summarize_state',
    };
    const next = primaryAgentReducer(withIntent, { type: 'SET_INTENT', intent: null });
    expect(next.activeIntent).toBeNull();
  });

  it('THREADS_REFRESHED replaces threads without touching threadId or activeIntent', () => {
    const threads = [
      {
        id: 'primary-agent-thread-x',
        title: 'Test thread',
        intent: null,
        emoji: '💬',
        timestamp: Date.now(),
      },
    ];
    const withIntent: PrimaryAgentState = {
      ...baseState,
      threadId: 'primary-agent-thread-current',
      activeIntent: 'review_spec',
    };
    const action: PrimaryAgentAction = { type: 'THREADS_REFRESHED', threads };
    const next = primaryAgentReducer(withIntent, action);
    expect(next.threads).toBe(threads);
    expect(next.threadId).toBe('primary-agent-thread-current');
    expect(next.activeIntent).toBe('review_spec');
  });
});
