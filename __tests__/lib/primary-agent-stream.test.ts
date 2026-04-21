import { describe, expect, it } from 'vitest';
import {
  createPrimaryAgentStreamState,
  reduceViewerStreamEvent,
  type ViewerStreamEvent,
} from '../../src/lib/primary-agent-stream';

function reduceAll(
  events: ViewerStreamEvent[]
): ReturnType<typeof createPrimaryAgentStreamState> {
  return events.reduce(
    (state, event) => reduceViewerStreamEvent(state, event),
    createPrimaryAgentStreamState()
  );
}

describe('primary-agent stream reducer', () => {
  it('replays the same normalized event sequence into the same final state', () => {
    const events: ViewerStreamEvent[] = [
      {
        kind: 'node_update',
        node: {
          id: 'alpha',
          label: 'Alpha Cabinet',
          level: 'cabinet',
          status: 'running',
        },
        timestamp: '2026-04-21T10:00:00.000Z',
        sequence: 1,
      },
      {
        kind: 'progress',
        nodeId: 'alpha/beta/run-1',
        status: 'running',
        message: 'Scanning',
        progress: 25,
        timestamp: '2026-04-21T10:00:01.000Z',
        sequence: 2,
      },
      {
        kind: 'token',
        nodeId: 'alpha/beta/run-1',
        content: 'done',
        timestamp: '2026-04-21T10:00:02.000Z',
        sequence: 3,
      },
      {
        kind: 'summary',
        nodeId: 'alpha/beta/run-1',
        status: 'completed',
        summary: 'done',
        artifactRefs: ['artifact-1'],
        timestamp: '2026-04-21T10:00:03.000Z',
        sequence: 4,
      },
    ];

    const first = reduceAll(events);
    const second = reduceAll(events);

    expect(second).toEqual(first);
  });

  it('treats repeated lifecycle and progress payloads as no-ops', () => {
    const base = createPrimaryAgentStreamState();
    const event: ViewerStreamEvent = {
      kind: 'progress',
      nodeId: 'alpha/beta/run-1',
      status: 'running',
      message: 'Scanning',
      progress: 25,
      timestamp: '2026-04-21T10:00:01.000Z',
      sequence: 2,
    };

    const next = reduceViewerStreamEvent(base, event);
    const duplicate = reduceViewerStreamEvent(next, event);

    expect(duplicate).toBe(next);
  });

  it('dedupes tokens only on the full tuple', () => {
    const base = createPrimaryAgentStreamState();
    const event: ViewerStreamEvent = {
      kind: 'token',
      nodeId: 'alpha/beta/run-1',
      content: 'done',
      timestamp: '2026-04-21T10:00:02.000Z',
      sequence: 3,
    };

    const next = reduceViewerStreamEvent(base, event);
    const duplicate = reduceViewerStreamEvent(next, event);

    expect(duplicate).toBe(next);
    expect(duplicate.messageBuffers['alpha/beta/run-1']).toBe('done');
  });

  it('dedupes tool activity only on the full tuple', () => {
    const base = createPrimaryAgentStreamState();
    const event: ViewerStreamEvent = {
      kind: 'tool_result',
      nodeId: 'alpha/beta/run-1',
      toolName: 'semantic_search',
      preview: 'match-1',
      timestamp: '2026-04-21T10:00:02.000Z',
      sequence: 3,
    };

    const next = reduceViewerStreamEvent(base, event);
    const duplicate = reduceViewerStreamEvent(next, event);

    expect(duplicate).toBe(next);
    expect(duplicate.toolActivity['alpha/beta/run-1']).toHaveLength(1);
  });

  it('orders Huey, cabinet, specialists, and async run nodes deterministically', () => {
    const state = reduceAll([
      {
        kind: 'node_update',
        node: {
          id: 'alpha',
          label: 'Alpha Cabinet',
          level: 'cabinet',
          status: 'running',
        },
        timestamp: '2026-04-21T10:00:00.000Z',
        sequence: 1,
      },
      {
        kind: 'node_update',
        node: {
          id: 'alpha/beta',
          label: 'Beta Specialist',
          level: 'specialist',
          parentId: 'alpha',
          status: 'running',
        },
        timestamp: '2026-04-21T10:00:01.000Z',
        sequence: 2,
      },
      {
        kind: 'node_update',
        node: {
          id: 'alpha/beta/run-1',
          label: 'Beta Run',
          level: 'specialist',
          parentId: 'alpha/beta',
          status: 'running',
        },
        timestamp: '2026-04-21T10:00:02.000Z',
        sequence: 3,
      },
      {
        kind: 'node_update',
        node: {
          id: 'zeta',
          label: 'Zeta Cabinet',
          level: 'cabinet',
          status: 'running',
        },
        timestamp: '2026-04-21T10:00:03.000Z',
        sequence: 4,
      },
    ]);

    expect(state.orderedNodeIds).toEqual([
      'alpha',
      'alpha/beta',
      'alpha/beta/run-1',
      'zeta',
    ]);
  });
});
