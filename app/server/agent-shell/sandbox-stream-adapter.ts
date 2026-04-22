/**
 * server/agent-shell/sandbox-stream-adapter.ts
 *
 * Parses the agent_runner sandbox NDJSON stream → AgentShellEvent generator.
 *
 * Wire format:
 *   The sandbox executor emits newline-delimited JSON where each line is a
 *   serialized AgentShellEvent. This is distinct from the Tensura SSE path
 *   (ViewerStreamEvent) — the sandbox owns its own output contract and emits
 *   the normalized shell event protocol directly.
 *
 *   Content-Type: application/x-ndjson
 *   Frame: <JSON AgentShellEvent>\n
 *
 * Validation:
 *   Each parsed frame is validated against the AgentShellEvent discriminant
 *   (the `type` field). Unknown types are silently dropped — fail-safe, not
 *   fail-closed, at the parse layer. The executor itself is fail-closed.
 *
 * Timeout:
 *   SANDBOX_READ_TIMEOUT_MS controls the max wall-clock time for a sandbox
 *   run. Exceeding it emits run.error and aborts the reader.
 */

import type { AgentShellEvent } from '../../lib/agent-shell/types';

export const SANDBOX_NDJSON_CONTENT_TYPE = 'application/x-ndjson';

/**
 * Max wall-clock ms for a sandbox run before we force-abort.
 * Matches the fail-closed contract — no silent hangs.
 */
export const SANDBOX_READ_TIMEOUT_MS = 120_000;

// ── Event discriminant whitelist ──────────────────────────────────────────────

const KNOWN_EVENT_TYPES = new Set<string>([
  'run.mode',
  'run.status',
  'message.delta',
  'message.done',
  'todo.update',
  'tool.started',
  'tool.completed',
  'tool.error',
  'subagent.update',
  'artifact.upsert',
  'progress',
  'summary',
  'run.error',
]);

function isKnownEvent(raw: unknown): raw is AgentShellEvent {
  return (
    raw !== null &&
    typeof raw === 'object' &&
    'type' in raw &&
    typeof (raw as Record<string, unknown>).type === 'string' &&
    KNOWN_EVENT_TYPES.has((raw as Record<string, unknown>).type as string)
  );
}

function parseLine(line: string): AgentShellEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return isKnownEvent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ── Stream reader ─────────────────────────────────────────────────────────────

/**
 * Consume a sandbox NDJSON ReadableStream and yield AgentShellEvents.
 *
 * Timeout: aborts after SANDBOX_READ_TIMEOUT_MS and emits run.error.
 * The caller is responsible for also aborting the upstream fetch via signal.
 */
export async function* readSandboxStream(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): AsyncGenerator<AgentShellEvent> {
  const decoder = new TextDecoder();
  const reader = body.getReader();
  let buffer = '';

  const timeoutId = setTimeout(() => {
    reader.cancel('sandbox timeout').catch(() => {});
  }, SANDBOX_READ_TIMEOUT_MS);

  try {
    while (true) {
      if (signal?.aborted) {
        yield { type: 'run.error', message: 'agent_runner run aborted' };
        break;
      }

      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (err) {
        const timed =
          String(err).includes('timeout') ||
          String(err).includes('sandbox timeout');
        yield {
          type: 'run.error',
          message: timed
            ? `agent_runner timed out after ${SANDBOX_READ_TIMEOUT_MS / 1000}s`
            : `sandbox read error: ${err instanceof Error ? err.message : String(err)}`,
        };
        return;
      }

      if (chunk.done) break;

      buffer += decoder.decode(chunk.value, { stream: true });

      let newline = buffer.indexOf('\n');
      while (newline >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf('\n');

        const event = parseLine(line);
        if (event) yield event;
      }
    }

    // Flush any unterminated final line
    if (buffer.trim()) {
      const event = parseLine(buffer);
      if (event) yield event;
    }
  } finally {
    clearTimeout(timeoutId);
    reader.releaseLock();
  }
}
