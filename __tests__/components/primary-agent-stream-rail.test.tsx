import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { PrimaryAgentStreamRail } from '../../app/components/primary-agent/PrimaryAgentStreamRail';
import {
  publishPrimaryAgentStreamEvent,
  resetPrimaryAgentStreamThread,
} from '../../src/lib/primary-agent-stream-bus';

let threadRunning = true;

beforeAll(() => {
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  }
});

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

    expect(screen.getAllByText('Alpha Cabinet').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Scanning').length).toBeGreaterThan(0);
    expect(screen.getByText('25%')).toBeTruthy();
  });

  it('renders empty, quiet, and done states intentionally', async () => {
    threadRunning = true;
    const { rerender } = render(<PrimaryAgentStreamRail threadId="thread-1" />);

    expect(screen.getAllByText('Quiet connection').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0 active').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0 async').length).toBeGreaterThan(0);

    threadRunning = false;
    rerender(<PrimaryAgentStreamRail threadId="thread-1" />);

    expect(screen.getAllByText('No current stream yet').length).toBeGreaterThan(0);

    await act(async () => {
      publishPrimaryAgentStreamEvent('thread-1', {
        kind: 'summary',
        nodeId: 'huey',
        status: 'completed',
        summary: 'run complete',
        timestamp: '2026-04-21T10:00:00.000Z',
        sequence: 1,
      });
    });

    expect(screen.getAllByText('Run complete').length).toBeGreaterThan(0);
  });

  it('exposes command palette filters and node actions', async () => {
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
        kind: 'node_update',
        node: {
          id: 'alpha/beta',
          label: 'Beta Specialist',
          level: 'specialist',
          parentId: 'alpha',
          status: 'running',
          artifactRefs: ['artifact-1'],
        },
        timestamp: '2026-04-21T10:00:01.000Z',
        sequence: 2,
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /Actions/i }));
    expect(screen.getByText('Specialist only')).toBeTruthy();
    expect(screen.getByText('Copy refs for Beta Specialist')).toBeTruthy();

    fireEvent.click(screen.getByText('Specialist only'));

    expect(screen.queryByText('Alpha Cabinet')).toBeNull();
    expect(screen.getAllByText('Beta Specialist').length).toBeGreaterThan(0);
  });

  it('keeps the inspection table collapsed by default and opens on demand', async () => {
    threadRunning = false;
    render(<PrimaryAgentStreamRail threadId="thread-1" />);

    await act(async () => {
      publishPrimaryAgentStreamEvent('thread-1', {
        kind: 'summary',
        nodeId: 'huey',
        status: 'completed',
        summary: 'final summary',
        artifactRefs: ['artifact-1'],
        timestamp: '2026-04-21T10:00:00.000Z',
        sequence: 1,
      });
    });

    expect(screen.queryByText('Run')).toBeNull();
    expect(screen.getByText('Inspection table')).toBeTruthy();

    const trigger = screen.getByText('Inspection table').closest('button');
    expect(trigger).toBeTruthy();
    if (trigger) {
      fireEvent.click(trigger);
    }

    expect(screen.getByText('Run')).toBeTruthy();
    expect(screen.getByText('Artifact refs')).toBeTruthy();
    expect(screen.getAllByText('final summary').length).toBeGreaterThan(0);
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
