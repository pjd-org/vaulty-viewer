/**
 * server/agent-shell/run-agent-runner.ts
 *
 * Agent Runner mode adapter.
 *
 * Executes a compiled agent config in the Tensura sandbox. The sandbox is
 * fail-closed: if the config is invalid, the sandbox is unavailable, or any
 * non-recoverable error occurs, the run terminates immediately with run.error.
 *
 * Endpoint:
 *   POST /tensura/v1/sandbox/runs
 *
 * Request body:
 *   {
 *     thread_id:  string,              // resolved or generated
 *     config_ref: string | undefined,  // compiled config ref; omit for default
 *     message:    string,
 *     attachments?: [{ name, mime_type, data }],
 *   }
 *
 * Response:
 *   Content-Type: application/x-ndjson
 *   Body: newline-delimited AgentShellEvent JSON
 *
 * Auth:
 *   apiFetch handles internal service token injection.
 *
 * Sandbox availability:
 *   The adapter checks SANDBOX_ENABLED env at startup. If false, all runs
 *   immediately return run.error — matches the fail-closed contract and the
 *   MODE_CONFIGS.agent_runner.requiresSandbox flag used to hide the mode in
 *   the UI when the sandbox is unavailable.
 */

import { apiFetch } from '../../../src/utils/api';
import {
  readSandboxStream,
  SANDBOX_NDJSON_CONTENT_TYPE,
} from './sandbox-stream-adapter';
import type { ModeAdapter } from './run-dispatcher';
import type {
  AgentShellEvent,
  RunAgentRequest,
} from '../../lib/agent-shell/types';

// ── Endpoint ──────────────────────────────────────────────────────────────────

const SANDBOX_RUN_PATH = '/tensura/v1/sandbox/runs';

// ── Sandbox availability ──────────────────────────────────────────────────────

function isSandboxEnabled(): boolean {
  if (typeof process === 'undefined') return false;
  const val = process.env?.SANDBOX_ENABLED?.trim().toLowerCase();
  // Opt-in: must be explicitly set to '1', 'true', or 'yes'
  return val === '1' || val === 'true' || val === 'yes';
}

// ── Request body ──────────────────────────────────────────────────────────────

type SandboxRunBody = {
  thread_id: string;
  config_ref?: string;
  message: string;
  attachments?: { name: string; mime_type: string; data: string }[];
};

function buildSandboxBody(
  request: RunAgentRequest,
  threadId: string
): SandboxRunBody {
  const body: SandboxRunBody = {
    thread_id: threadId,
    message: request.message,
  };

  if (request.files && request.files.length > 0) {
    body.attachments = request.files.map((f) => ({
      name: f.name,
      mime_type: f.mimeType,
      data: f.data,
    }));
  }

  return body;
}

// ── Adapter ───────────────────────────────────────────────────────────────────

async function* runAgentRunner(
  request: RunAgentRequest,
  signal?: AbortSignal
): AsyncGenerator<AgentShellEvent> {
  // Fail-closed: sandbox must be explicitly enabled
  if (!isSandboxEnabled()) {
    yield {
      type: 'run.error',
      message:
        'agent_runner requires sandbox mode. Set SANDBOX_ENABLED=true to enable.',
    };
    return;
  }

  const threadId =
    request.threadId ??
    `ar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  yield { type: 'run.status', status: 'running', threadId };

  const body = buildSandboxBody(request, threadId);

  let response: Response;
  try {
    response = await apiFetch(SANDBOX_RUN_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: SANDBOX_NDJSON_CONTENT_TYPE,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield { type: 'run.error', message: `sandbox fetch failed: ${message}` };
    return;
  }

  if (!response.ok) {
    // Fail-closed: any non-2xx is terminal
    const detail = await response.text().catch(() => '');
    yield {
      type: 'run.error',
      message: `sandbox error (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
    };
    return;
  }

  if (!response.body) {
    yield { type: 'run.error', message: 'sandbox response body is empty' };
    return;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('ndjson') && !contentType.includes('json')) {
    yield {
      type: 'run.error',
      message: `sandbox unexpected content-type: ${contentType}`,
    };
    return;
  }

  yield* readSandboxStream(response.body, signal);
}

export const agentRunnerAdapter: ModeAdapter = {
  run: runAgentRunner,
};
