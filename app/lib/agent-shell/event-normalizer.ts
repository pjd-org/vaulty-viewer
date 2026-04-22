/**
 * agent-shell/event-normalizer.ts
 *
 * Parses raw NDJSON lines from the server stream into AgentShellEvents.
 * Also re-exports the viewer stream reducer for use by stream rail consumers.
 */

import type {
  AgentExecutionMode,
  AgentShellEvent,
  Artifact,
  RunStatus,
  SubagentRun,
  TodoItem,
  ToolEvent,
} from './types';

// Re-export so consumers of agent-shell don't need to reach into src/lib directly
export {
  reduceViewerStreamEvent,
  createPrimaryAgentStreamState,
} from '../../../src/lib/primary-agent-stream';

// ── NDJSON line parser ────────────────────────────────────────────────────────

/**
 * Parse one NDJSON line into an AgentShellEvent.
 * Returns null for blank lines or lines that fail schema validation.
 */
export function parseAgentShellLine(line: string): AgentShellEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(trimmed);
  } catch {
    return null;
  }

  if (!isObject(raw) || typeof raw.type !== 'string') return null;

  return validateAgentShellEvent(raw);
}

/**
 * Parse a complete NDJSON response body into an array of AgentShellEvents.
 * Skips unparseable lines silently (normalize once, never throw to caller).
 */
export function parseAgentShellBody(body: string): AgentShellEvent[] {
  return body
    .split('\n')
    .map(parseAgentShellLine)
    .filter((e): e is AgentShellEvent => e !== null);
}

/**
 * Async generator that consumes a ReadableStream<Uint8Array> and yields
 * AgentShellEvents as NDJSON lines arrive.
 */
export async function* streamAgentShellEvents(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<AgentShellEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const event = parseAgentShellLine(line);
        if (event) yield event;
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      const event = parseAgentShellLine(buffer);
      if (event) yield event;
    }
  } finally {
    reader.releaseLock();
  }
}

// ── Internal validation helpers ───────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function optStr(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function optNum(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

/**
 * Validate a parsed JSON object against the AgentShellEvent discriminated union.
 * Returns null for unknown or malformed event types.
 */
function validateAgentShellEvent(
  raw: Record<string, unknown>
): AgentShellEvent | null {
  switch (raw.type) {
    case 'run.mode':
      return { type: 'run.mode', mode: raw.mode as AgentExecutionMode };

    case 'run.status':
      return {
        type: 'run.status',
        status: raw.status as RunStatus,
        threadId: optStr(raw.threadId),
      };

    case 'message.delta':
      return {
        type: 'message.delta',
        nodeId: str(raw.nodeId),
        delta: str(raw.delta),
      };

    case 'message.done':
      return {
        type: 'message.done',
        nodeId: str(raw.nodeId),
        messageId: str(raw.messageId),
        content: str(raw.content),
      };

    case 'todo.update':
      if (!isObject(raw.todo)) return null;
      return { type: 'todo.update', todo: raw.todo as TodoItem };

    case 'tool.started':
      if (!isObject(raw.tool)) return null;
      return { type: 'tool.started', tool: raw.tool as ToolEvent };

    case 'tool.completed':
      if (!isObject(raw.tool)) return null;
      return { type: 'tool.completed', tool: raw.tool as ToolEvent };

    case 'tool.error':
      if (!isObject(raw.tool)) return null;
      return { type: 'tool.error', tool: raw.tool as ToolEvent };

    case 'subagent.update':
      if (!isObject(raw.subagent)) return null;
      return { type: 'subagent.update', subagent: raw.subagent as SubagentRun };

    case 'artifact.upsert':
      if (!isObject(raw.artifact)) return null;
      return { type: 'artifact.upsert', artifact: raw.artifact as Artifact };

    case 'progress':
      return {
        type: 'progress',
        nodeId: str(raw.nodeId),
        message: optStr(raw.message),
        progress: optNum(raw.progress),
      };

    case 'summary':
      return {
        type: 'summary',
        nodeId: str(raw.nodeId),
        status: raw.status as 'completed' | 'failed' | 'cancelled',
        summary: str(raw.summary),
        artifactRefs: Array.isArray(raw.artifactRefs)
          ? (raw.artifactRefs as string[])
          : undefined,
      };

    case 'run.error':
      return { type: 'run.error', message: str(raw.message) };

    default:
      return null;
  }
}
