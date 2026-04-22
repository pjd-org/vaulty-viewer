/**
 * server/agent-shell/sandbox-stream-adapter.ts
 *
 * Stream adapter for the agent_runner (sandbox) mode.
 *
 * ── Sandbox API contract (to be wired when available) ────────────────────────
 *
 * Expected endpoint:
 *   POST /tensura/v1/sandbox/runs
 *   Body:
 *     {
 *       thread_id: string,
 *       config_id: string,          // compiled agent config ref
 *       message: string,
 *       attachments?: AttachmentPayload[],
 *     }
 *   Response: text/event-stream or application/x-ndjson
 *   Events: AgentShellEvent NDJSON or ViewerStreamEvent SSE
 *
 * Until the sandbox API is available, this adapter emits a single
 * run.error event explaining it is not yet connected.
 *
 * To wire in:
 *   1. Replace SANDBOX_API_PATH with the real endpoint
 *   2. Implement parseFrame() for the sandbox wire format
 *   3. Remove the SANDBOX_NOT_AVAILABLE guard at the top of runAgentRunner
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ModeAdapter } from './run-dispatcher';
import type {
  AgentShellEvent,
  RunAgentRequest,
} from '../../lib/agent-shell/types';

export const SANDBOX_API_PATH = '/tensura/v1/sandbox/runs';

async function* runAgentRunner(
  _request: RunAgentRequest,
  _signal?: AbortSignal
): AsyncGenerator<AgentShellEvent> {
  // ── SANDBOX NOT YET AVAILABLE ─────────────────────────────────────────────
  // Remove this block and implement the fetch + stream parse below when ready.
  yield {
    type: 'run.error',
    message:
      'agent_runner sandbox is not yet connected. Wire sandbox-stream-adapter.ts to enable this mode.',
  };
  return;
  // ─────────────────────────────────────────────────────────────────────────

  // Future implementation sketch:
  //
  // const { apiFetch } = await import('../../../src/utils/api');
  // const threadId = _request.threadId ?? `ar-${Date.now()}`;
  // yield { type: 'run.status', status: 'running', threadId };
  //
  // const response = await apiFetch(SANDBOX_API_PATH, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     thread_id: threadId,
  //     message: _request.message,
  //     attachments: _request.files,
  //   }),
  //   signal: _signal,
  // });
  //
  // if (!response.ok) {
  //   yield { type: 'run.error', message: `Sandbox error (${response.status})` };
  //   return;
  // }
  //
  // // Parse sandbox response stream → AgentShellEvents
  // yield* parseSandboxStream(response.body!, threadId, _signal);
  // yield { type: 'run.status', status: 'done' };
}

export const sandboxStreamAdapter: ModeAdapter = {
  run: runAgentRunner,
};
