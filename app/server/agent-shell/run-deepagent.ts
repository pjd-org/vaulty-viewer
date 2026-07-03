/**
 * server/agent-shell/run-deepagent.ts
 *
 * DeepAgent mode adapter.
 *
 * Calls the Tensura SSE stream endpoint for the active thread and pipes
 * ViewerStreamEvents → AgentShellEvents via deepagents-stream-adapter.
 *
 * Thread lifecycle:
 *   - If request.threadId is provided, it is forwarded as-is.
 *   - If absent, the adapter generates a new UUID and emits run.status
 *     with the resolved threadId so the client can persist it.
 *
 * Auth:
 *   apiFetch handles internal service token injection automatically.
 */

import { apiFetch } from '../../../src/utils/api';
import { buildPrimaryAgentServerStreamPath } from '../../../src/lib/primary-agent-agent-server';
import { readDeepAgentsStream } from './deepagents-stream-adapter';
import type { ModeAdapter } from './run-dispatcher';
import type {
  AgentShellEvent,
  AttachedFile,
  RunAgentRequest,
} from '../../lib/agent-shell/types';

// ── Request body builder ──────────────────────────────────────────────────────

function buildDeepAgentRequestBody(
  request: RunAgentRequest
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    thread_id: request.threadId ?? '',
    mode: 'repo+spec',
    messages: [{ role: 'user', content: request.message }],
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

function normalizeFiles(files: RunAgentRequest['files']): AttachedFile[] {
  return (files ?? []).map((file) => file);
}

// ── Adapter ───────────────────────────────────────────────────────────────────

async function* runDeepAgent(
  request: RunAgentRequest,
  signal?: AbortSignal
): AsyncGenerator<AgentShellEvent> {
  // Resolve or create threadId
  const threadId =
    request.threadId ??
    `da-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Emit resolved threadId immediately so the client can bind it
  if (!request.threadId) {
    yield { type: 'run.status', status: 'running', threadId };
  }

  const path = buildPrimaryAgentServerStreamPath(threadId);
  const body = buildDeepAgentRequestBody({
    ...request,
    threadId,
    files: normalizeFiles(request.files),
  });

  let response: Response;
  try {
    response = await apiFetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield { type: 'run.error', message: `DeepAgent fetch failed: ${message}` };
    return;
  }

  if (!response.ok) {
    yield {
      type: 'run.error',
      message: `DeepAgent server error (${response.status})`,
    };
    return;
  }

  if (!response.body) {
    yield { type: 'run.error', message: 'DeepAgent response body is empty' };
    return;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isSSE = /text\/event-stream/i.test(contentType);

  if (isSSE) {
    yield* readDeepAgentsStream(response.body, threadId, signal);
  } else {
    // Fallback: treat body as NDJSON AgentShellEvents (future proofing)
    yield {
      type: 'run.error',
      message: `DeepAgent unexpected content-type: ${contentType}`,
    };
  }
}

export const deepAgentAdapter: ModeAdapter = {
  run: runDeepAgent,
};
