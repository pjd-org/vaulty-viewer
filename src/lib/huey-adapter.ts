/**
 * huey-adapter.ts — Real ChatModelAdapter for @assistant-ui/react LocalRuntime.
 *
 * Factory: createHueyModelAdapter({ getThreadId, onThreadIdResolved? })
 *
 * Adapter calls the Huey agent server via apiFetch. On 429 or 5xx it retries
 * once with model: 'gpt-4o-mini'. On network failure or non-recoverable HTTP
 * errors it throws so the runtime can surface the error to the user.
 */
import type {
  ChatModelAdapter,
  ChatModelRunOptions,
  ChatModelRunResult,
} from '@assistant-ui/react';
import { apiFetch } from '../utils/api';
import {
  buildHueyAgentServerRunPath,
  parseHueyAgentServerRunResponse,
} from './huey-agent-server';

type AgentServerRunPayload = {
  ok?: boolean;
  result?: string;
  threadId?: string;
  thread_id?: string;
  thread?: { id?: string };
  run?: {
    output?: {
      result?: string;
      next_action?: string | null;
      tool_results_degraded?: boolean;
    };
  };
  next_action?: string | null;
  tool_results_degraded?: boolean;
};

export type HueyAdapterOptions = {
  /** Returns the current threadId (read from a ref — stable, never stale). */
  getThreadId: () => string;
  /**
   * Called when the server returns a threadId that differs from the one sent.
   * Used to sync the resolved server-side threadId back to the parent route.
   */
  onThreadIdResolved?: (resolvedId: string) => void;
};

/**
 * Build the POST body sent to the agent server.
 */
function buildRequestBody(
  threadId: string,
  messages: ChatModelRunOptions['messages'],
  model?: string
): Record<string, unknown> {
  // The adapter sends the last user message as the prompt. The assistant-ui
  // runtime tracks the full thread; we only need to forward the latest user
  // turn to the server which maintains its own thread state.
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const prompt =
    lastUserMsg?.content
      .filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; text: string }).text)
      .join('\n') ?? '';

  const body: Record<string, unknown> = {
    thread_id: threadId,
    mode: 'repo+spec',
    messages: [{ role: 'user', content: prompt }],
  };
  if (model) {
    body.model = model;
  }
  return body;
}

/**
 * Post to the agent server. Returns [response, payload].
 * Does not throw on non-ok responses — callers decide how to handle.
 */
async function postToAgentServer(
  threadId: string,
  body: Record<string, unknown>,
  abortSignal: AbortSignal
): Promise<[Response, AgentServerRunPayload | null]> {
  const path = buildHueyAgentServerRunPath(threadId);
  const response = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: abortSignal,
  });
  const payload = (await response
    .json()
    .catch(() => null)) as AgentServerRunPayload | null;
  return [response, payload];
}

export function createHueyModelAdapter(
  opts: HueyAdapterOptions
): ChatModelAdapter {
  return {
    async run({
      messages,
      abortSignal,
    }: ChatModelRunOptions): Promise<ChatModelRunResult> {
      const threadId = opts.getThreadId();
      const requestBody = buildRequestBody(threadId, messages);

      let [response, payload] = await postToAgentServer(
        threadId,
        requestBody,
        abortSignal
      );

      // 429 or 5xx → retry once with gpt-4o-mini fallback
      if (!response.ok && (response.status === 429 || response.status >= 500)) {
        try {
          const fallbackBody = buildRequestBody(
            threadId,
            messages,
            'gpt-4o-mini'
          );
          const [fallbackResp, fallbackPayload] = await postToAgentServer(
            threadId,
            fallbackBody,
            abortSignal
          );
          if (fallbackResp.ok) {
            response = fallbackResp;
            payload = {
              ...(fallbackPayload || {}),
              threadId:
                fallbackPayload?.threadId ||
                fallbackPayload?.thread_id ||
                fallbackPayload?.thread?.id ||
                threadId,
            };
          }
        } catch {
          // ignore fallback errors — fall through to primary error handling
        }
      }

      if (!response.ok && !payload) {
        throw new Error(`Huey request failed (${response.status})`);
      }

      const parsed = parseHueyAgentServerRunResponse(payload, threadId);

      // Notify parent if server resolved to a different threadId
      if (parsed.threadId !== threadId && opts.onThreadIdResolved) {
        opts.onThreadIdResolved(parsed.threadId);
      }

      return {
        content: [{ type: 'text', text: parsed.assistantText }],
      };
    },
  };
}
