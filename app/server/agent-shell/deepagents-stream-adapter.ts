/**
 * server/agent-shell/deepagents-stream-adapter.ts
 *
 * Parses Tensura SSE stream → AgentShellEvent async generator.
 *
 * Tensura stream contract:
 *   POST /tensura/v1/agent-server/threads/{threadId}/stream
 *   Response: text/event-stream
 *   Frame format:
 *     data: <JSON ViewerStreamEvent>\n\n
 *     data: [DONE]\n\n
 *
 * This adapter:
 *   1. Reads the SSE body
 *   2. Parses each frame as a ViewerStreamEvent
 *   3. Projects ViewerStreamEvent → AgentShellEvent (inverse of client projection)
 *   4. Yields AgentShellEvents for consumption by run-deepagent
 */

import type { ViewerStreamEvent } from '../../../src/lib/primary-agent-stream';
import type {
  AgentShellEvent,
  RunStatus,
  SubagentRun,
  ToolEvent,
} from '../../lib/agent-shell/types';

// ── ViewerStreamEvent → AgentShellEvent projection ───────────────────────────

let toolSeq = 0;

function projectEvent(
  event: ViewerStreamEvent,
  ts: string
): AgentShellEvent | null {
  switch (event.kind) {
    case 'token':
      return {
        type: 'message.delta',
        nodeId: event.nodeId,
        delta: event.content,
      };

    case 'tool_call': {
      const tool: ToolEvent = {
        id: `tool-${event.nodeId}-${event.toolName}-${++toolSeq}`,
        nodeId: event.nodeId,
        toolName: event.toolName,
        status: 'started',
        argsPreview: event.argsChunk,
        startedAt: event.timestamp ?? ts,
      };
      return { type: 'tool.started', tool };
    }

    case 'tool_result': {
      const tool: ToolEvent = {
        id: `tool-${event.nodeId}-${event.toolName}-${toolSeq}`,
        nodeId: event.nodeId,
        toolName: event.toolName,
        status: 'completed',
        resultPreview: event.preview,
        startedAt: ts,
        completedAt: event.timestamp ?? ts,
      };
      return { type: 'tool.completed', tool };
    }

    case 'node_update': {
      const viewerStatus = event.node.status;
      const runStatus: RunStatus =
        viewerStatus === 'idle'
          ? 'idle'
          : viewerStatus === 'running' || viewerStatus === 'queued'
            ? 'running'
            : viewerStatus === 'completed'
              ? 'done'
              : 'error';

      const subagent: SubagentRun = {
        nodeId: event.node.id,
        label: event.node.label,
        status: runStatus,
        startedAt: event.timestamp ?? ts,
      };
      return { type: 'subagent.update', subagent };
    }

    case 'progress':
      return {
        type: 'progress',
        nodeId: event.nodeId,
        message: event.message,
        progress: event.progress,
      };

    case 'summary':
      return {
        type: 'summary',
        nodeId: event.nodeId,
        status: event.status,
        summary: event.summary,
        artifactRefs: event.artifactRefs,
      };

    default:
      return null;
  }
}

// ── SSE frame parser ──────────────────────────────────────────────────────────

function parseFrame(block: string): ViewerStreamEvent | null {
  const lines = block
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter(Boolean);

  const data = lines
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).trimStart())
    .join('\n');

  if (!data || data === '[DONE]') return null;

  try {
    const parsed = JSON.parse(data) as unknown;
    if (!parsed || typeof parsed !== 'object' || !('kind' in parsed)) {
      return null;
    }
    return parsed as ViewerStreamEvent;
  } catch {
    return null;
  }
}

// ── Stream reader ─────────────────────────────────────────────────────────────

/**
 * Consume a Tensura SSE ReadableStream and yield AgentShellEvents.
 * Yields run.status running/done around the stream.
 */
export async function* readDeepAgentsStream(
  body: ReadableStream<Uint8Array>,
  threadId: string,
  signal?: AbortSignal
): AsyncGenerator<AgentShellEvent> {
  yield { type: 'run.status', status: 'running', threadId };

  const decoder = new TextDecoder();
  const reader = body.getReader();
  let buffer = '';
  // Reset tool sequence counter for each run
  toolSeq = 0;

  // Track last streaming message per nodeId so we can finalize it
  const streamingNodes = new Map<string, string>();

  try {
    while (true) {
      if (signal?.aborted) break;

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

      let boundary = buffer.indexOf('\n\n');
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf('\n\n');

        const viewerEvent = parseFrame(block);
        if (!viewerEvent) continue;

        const ts = new Date().toISOString();
        const shellEvent = projectEvent(viewerEvent, ts);
        if (!shellEvent) continue;

        // Track streaming message nodes
        if (shellEvent.type === 'message.delta') {
          streamingNodes.set(shellEvent.nodeId, shellEvent.nodeId);
        }

        yield shellEvent;
      }
    }

    // Flush any remaining buffer
    if (buffer.trim()) {
      const viewerEvent = parseFrame(buffer);
      if (viewerEvent) {
        const ts = new Date().toISOString();
        const shellEvent = projectEvent(viewerEvent, ts);
        if (shellEvent) yield shellEvent;
      }
    }

    // Finalize any still-streaming messages
    for (const nodeId of streamingNodes.keys()) {
      yield {
        type: 'message.done',
        nodeId,
        messageId: `done-${nodeId}-${Date.now()}`,
        content: '', // client already has accumulated content in store
      };
    }
  } finally {
    reader.releaseLock();
  }

  yield { type: 'run.status', status: 'done' };
}
