import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, cleanup } from '@testing-library/react';
import { PrimaryAgentStreamRail } from '../../app/components/primary-agent/PrimaryAgentStreamRail';
import {
  publishPrimaryAgentStreamEvent,
  resetPrimaryAgentStreamThread,
} from '../../src/lib/primary-agent-stream-bus';

let threadRunning = true;

vi.mock('@assistant-ui/react', () => ({
  useThread: () => ({ isRunning: threadRunning }),
}));

afterEach(() => {
  cleanup();
  resetPrimaryAgentStreamThread('thread-1');
});

describe('PrimaryAgentStreamRail', () => {
  it('renders normalized viewer stream events', async () => {
    threadRunning = true;
    render(<PrimaryAgentStreamRail threadId="thread-1" />);

    await act(async () => {
      publishPrimaryAgentStreamEvent('thread-1', {
        kind: 'node_update',
        node: {
          id: 'alpha',
          label: 'Alpha Cabinet',
          level: 'cabinet',
          status: 'running',
        },
        timestamp: '2026-04-21T10:00:00.000Z',
        sequence: 1,
      });

      publishPrimaryAgentStreamEvent('thread-1', {
        kind: 'progress',
        nodeId: 'alpha/beta/run-1',
        status: 'running',
        message: 'Scanning',
        progress: 25,
        timestamp: '2026-04-21T10:00:01.000Z',
        sequence: 2,
      });
    });

    expect(await screen.findByText('Alpha Cabinet')).toBeTruthy();
    expect(screen.getByText('Scanning')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
  });

  it('clears stale rail state when a new run starts on the same thread', async () => {
    threadRunning = false;
    const { rerender } = render(
      <PrimaryAgentStreamRail threadId="thread-1" />
    );

    await act(async () => {
      publishPrimaryAgentStreamEvent('thread-1', {
        kind: 'summary',
        nodeId: 'huey',
        status: 'completed',
        summary: 'first run',
        timestamp: '2026-04-21T10:00:00.000Z',
        sequence: 1,
      });
    });

    expect(screen.getAllByText('first run')).toHaveLength(2);

    threadRunning = true;
    await act(async () => {
      rerender(<PrimaryAgentStreamRail threadId="thread-1" />);
    });

    expect(screen.queryAllByText('first run')).toHaveLength(0);
  });
});
