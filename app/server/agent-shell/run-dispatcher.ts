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

// ── NDJSON encoding helper ────────────────────────────────────────────────────

const encoder = new TextEncoder();

export function encodeEvent(event: AgentShellEvent): Uint8Array {
  return encoder.encode(JSON.stringify(event) + '\n');
}

/**
 * Build a ReadableStream that emits a single run.error event.
 * Used for fail-fast paths (unknown mode, adapter unavailable, etc.).
 */
export function errorStream(message: string): ReadableStream<Uint8Array> {
  const event: AgentShellEvent = { type: 'run.error', message };
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encodeEvent(event));
      controller.close();
    },
  });
}

/**
 * Wrap an async generator of AgentShellEvents into a ReadableStream<Uint8Array>.
 * The stream closes when the generator finishes or the abort signal fires.
 */
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
    cancel() {
      // ReadableStream cancelled by the client — nothing to clean up here;
      // the async generator will be GC'd naturally.
    },
  });
}

// ── Mode adapter interface ────────────────────────────────────────────────────

export type ModeAdapter = {
  run(
    request: RunAgentRequest,
    signal?: AbortSignal
  ): AsyncGenerator<AgentShellEvent>;
};

// ── Adapter registry ──────────────────────────────────────────────────────────
// Adapters are registered lazily via registerModeAdapter().
// Phase 5 fills these in; Phase 2 ships with stubs.

const adapterRegistry = new Map<AgentExecutionMode, ModeAdapter>();

export function registerModeAdapter(
  mode: AgentExecutionMode,
  adapter: ModeAdapter
): void {
  adapterRegistry.set(mode, adapter);
}

export function getModeAdapter(mode: AgentExecutionMode): ModeAdapter | null {
  return adapterRegistry.get(mode) ?? null;
}

// ── Stub adapters (Phase 2 placeholder — replaced in Phase 5) ─────────────────

async function* stubAdapter(
  request: RunAgentRequest
): AsyncGenerator<AgentShellEvent> {
  yield { type: 'run.status', status: 'running' };
  yield {
    type: 'message.delta',
    nodeId: 'huey',
    delta: `[${request.mode} adapter not yet implemented]`,
  };
  yield {
    type: 'message.done',
    nodeId: 'huey',
    messageId: `stub-${Date.now()}`,
    content: `[${request.mode} adapter not yet implemented]`,
  };
  yield { type: 'run.status', status: 'done' };
}

// Register stubs at module load time — Phase 5 will override.
registerModeAdapter('deepagent', { run: stubAdapter });
registerModeAdapter('agent_runner', { run: stubAdapter });
registerModeAdapter('prompt_runner', { run: stubAdapter });

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
  req: Request
): Promise<RunAgentRequest | null> {
  try {
    const body = (await req.json()) as Partial<RunAgentRequest>;
    if (!body.mode || !body.message) return null;
    return {
      mode: body.mode,
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
