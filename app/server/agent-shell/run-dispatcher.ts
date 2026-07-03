/**
 * server/agent-shell/run-dispatcher.ts
 *
 * Server-side dispatcher for agent runs.
 *
 * Routes an incoming RunAgentRequest to the correct mode adapter and returns
 * a ReadableStream<Uint8Array> of NDJSON-encoded AgentShellEvents.
 *
 * Each mode adapter (Phase 5) lives in:
 *   run-deepagent.ts        → deepagent mode
 *   run-agent-runner.ts     → agent_runner mode
 *   run-prompt-runner.ts    → prompt_runner mode
 *
 * The TanStack Start API routes (app/routes/api/agent-shell.run.$mode.ts)
 * are thin wrappers that call dispatchAgentRun() and return the stream.
 *
 * Context ownership rule:
 *   Tensura owns context meaning.
 *   This dispatcher only validates and forwards — never mutates context.
 */

import type {
  AgentExecutionMode,
  AgentShellEvent,
  RunAgentRequest,
} from '../../lib/agent-shell/types';

export type ModeAdapter = {
  run: (
    request: RunAgentRequest,
    signal?: AbortSignal
  ) => AsyncGenerator<AgentShellEvent>;
};

// ── Real adapters ────────────────────────────────────────────────────────────
import { agentRunnerAdapter } from './run-agent-runner';
import { deepAgentAdapter } from './run-deepagent';
import { promptRunnerAdapter } from './run-prompt-runner';

// ── Mode adapter registry ─────────────────────────────────────────────────────────────

export function registerModeAdapter(
  mode: AgentExecutionMode,
  adapter: ModeAdapter
): void {
  adapterRegistry.set(mode, adapter);
}

export function getModeAdapter(mode: AgentExecutionMode): ModeAdapter | null {
  return adapterRegistry.get(mode) ?? null;
}

const adapterRegistry = new Map<AgentExecutionMode, ModeAdapter>();

// ── NDJSON encoding helper ────────────────────────────────────────────────────

const encoder = new TextEncoder();

export function encodeEvent(event: AgentShellEvent): Uint8Array {
  return encoder.encode(JSON.stringify(event) + '\n');
}

// ── Stream helpers ─────────────────────────────────────────────────────────────

export function errorStream(message: string): ReadableStream<Uint8Array> {
  const event: AgentShellEvent = { type: 'run.error', message };
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encodeEvent(event));
      controller.close();
    },
  });
}

export function eventsToStream(
  source: AsyncIterable<AgentShellEvent>,
  signal?: AbortSignal
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of source) {
          if (signal?.aborted) break;
          controller.enqueue(encodeEvent(event));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(encodeEvent({ type: 'run.error', message }));
      } finally {
        controller.close();
      }
    },
  });
}

// ── Main dispatcher ────────────────────────────────────────────────────────────

export type DispatchOptions = {
  signal?: AbortSignal;
};

/**
 * Dispatch an agent run request to the correct adapter.
 *
 * Returns a ReadableStream<Uint8Array> of NDJSON-encoded AgentShellEvents.
 * Always returns a valid stream — errors are emitted as run.error events.
 */
export function dispatchAgentRun(
  request: RunAgentRequest,
  opts: DispatchOptions = {}
): ReadableStream<Uint8Array> {
  const adapter = getModeAdapter(request.mode);
  if (!adapter) {
    return errorStream(`No adapter registered for mode: ${request.mode}`);
  }

  // Emit run.mode first so the client can update its store before any content
  const modeEvent: AgentShellEvent = { type: 'run.mode', mode: request.mode };
  const resolvedAdapter = adapter;

  async function* withModePrefix(): AsyncGenerator<AgentShellEvent> {
    yield modeEvent;
    yield* resolvedAdapter.run(request, opts.signal);
  }

  return eventsToStream(withModePrefix(), opts.signal);
}

// ── Request parsing helper for API route handlers ────────────────────────────

/**
 * Parse and validate a RunAgentRequest from a Request body.
 * Returns null and emits an error stream if the body is malformed.
 */
export async function parseRunRequest(
  req: Request,
  opts: { mode?: AgentExecutionMode } = {}
): Promise<RunAgentRequest | null> {
  try {
    const body = (await req.json()) as Partial<RunAgentRequest>;
    const resolvedMode = opts.mode ?? body.mode;
    if (!resolvedMode || !body.message) return null;
    return {
      mode: resolvedMode,
      message: body.message,
      threadId: body.threadId,
      files: body.files,
    };
  } catch {
    return null;
  }
}

/**
 * Build a streaming Response from a RunAgentRequest.
 * Convenience wrapper for API route handlers.
 */
export function agentRunResponse(
  request: RunAgentRequest,
  opts: DispatchOptions = {}
): Response {
  const stream = dispatchAgentRun(request, opts);
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
