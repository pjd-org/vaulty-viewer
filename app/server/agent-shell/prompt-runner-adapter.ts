/**
 * server/agent-shell/prompt-runner-adapter.ts
 *
 * Lightweight SSE stream adapter for the prompt_runner mode.
 *
 * prompt_runner is the Tensura-owned orchestration prompt path — a lighter
 * invoke that goes through the same Tensura stream endpoint but with
 * mode: 'prompt' instead of 'repo+spec'. It does not expose subagent
 * hierarchy and does not support async specialists.
 *
 * Wire format is identical to deepagents-stream-adapter (Tensura SSE).
 * This adapter delegates stream parsing to readDeepAgentsStream and adjusts
 * the request body for the prompt path.
 */

import { apiFetch } from '../../../src/utils/api';
import { buildPrimaryAgentServerStreamPath } from '../../../src/lib/primary-agent-agent-server';
import { readDeepAgentsStream } from './deepagents-stream-adapter';
import type { ModeAdapter } from './run-dispatcher';
import type {
  AgentShellEvent,
  RunAgentRequest,
} from '../../lib/agent-shell/types';

function buildPromptRunnerBody(
  request: RunAgentRequest
): Record<string, unknown> {
  return {
    thread_id: request.threadId ?? '',
    mode: 'prompt',
    messages: [{ role: 'user', content: request.message }],
  };
}

async function* runPromptRunner(
  request: RunAgentRequest,
  signal?: AbortSignal
): AsyncGenerator<AgentShellEvent> {
  const threadId =
    request.threadId ??
    `pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!request.threadId) {
    yield { type: 'run.status', status: 'running', threadId };
  }

  const path = buildPrimaryAgentServerStreamPath(threadId);
  const body = buildPromptRunnerBody({ ...request, threadId });

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
    yield {
      type: 'run.error',
      message: `Prompt Runner fetch failed: ${message}`,
    };
    return;
  }

  if (!response.ok) {
    yield {
      type: 'run.error',
      message: `Prompt Runner server error (${response.status})`,
    };
    return;
  }

  if (!response.body) {
    yield {
      type: 'run.error',
      message: 'Prompt Runner response body is empty',
    };
    return;
  }

  yield* readDeepAgentsStream(response.body, threadId, signal);
}

export const promptRunnerAdapter: ModeAdapter = {
  run: runPromptRunner,
};
