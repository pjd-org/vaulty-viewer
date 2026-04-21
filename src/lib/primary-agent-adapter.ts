/**
 * primary-agent-adapter.ts — Real ChatModelAdapter for @assistant-ui/react LocalRuntime.
 *
 * Factory: createPrimaryAgentModelAdapter({ getThreadId, onThreadIdResolved? })
 *
 * Adapter calls the Primary Agent server via apiFetch. On 429 or 5xx it retries
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
  buildPrimaryAgentServerRunPath,
  buildPrimaryAgentServerStreamPath,
  parsePrimaryAgentServerRunResponse,
} from './primary-agent-agent-server';
import {
  publishPrimaryAgentStreamEvent,
  resetPrimaryAgentStreamThread,
} from './primary-agent-stream-bus';
import type { ViewerStreamEvent } from './primary-agent-stream';

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

export type PrimaryAgentContext = {
  tasks?: unknown[];
  notes?: unknown[];
  inbox?: unknown[];
};

export type PrimaryAgentAdapterOptions = {
  /** Returns the current threadId (read from a ref — stable, never stale). */
  getThreadId: () => string;
  /**
   * Called when the server returns a threadId that differs from the one sent.
   * Used to sync the resolved server-side threadId back to the parent route.
   */
  onThreadIdResolved?: (resolvedId: string) => void;
  /** Returns the active intent id (read from a ref — stable, never stale). */
  getIntent?: () => string | null;
  /** Returns the current vault context payload (read from a ref — stable, never stale). */
  getContext?: () => PrimaryAgentContext | null;
};

/**
 * Build the POST body sent to the agent server.
 */
export function buildPrimaryAgentRequestBody(
  threadId: string,
  messages: ChatModelRunOptions['messages'],
  intent?: string | null,
  context?: PrimaryAgentContext | null,
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
  if (intent) {
    body.intent = intent;
  }
  if (
    context &&
    Object.values(context).some((v) => v && (v as unknown[]).length > 0)
  ) {
    body.context = context;
  }
  if (model) {
    body.model = model;
  }
  return body;
}

function isEventStreamResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type') ?? '';
  return /text\/event-stream/i.test(contentType);
}

async function readStreamResponse(
  response: Response,
  threadId: string
): Promise<{
  assistantText: string;
  events: ViewerStreamEvent[];
  sawSummary: boolean;
}> {
  const reader = response.body?.getReader();
  if (!reader) {
    return { assistantText: '', events: [], sawSummary: false };
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let assistantText = '';
  let mainTokenBuffer = '';
  let sawSummary = false;
  const events: ViewerStreamEvent[] = [];

  const consume = (block: string) => {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter(Boolean);
    const data = lines
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (!data || data === '[DONE]') return;
    try {
      const parsed = JSON.parse(data) as unknown;
      if (!parsed || typeof parsed !== 'object' || !('kind' in parsed)) {
        return;
      }
      const event = parsed as ViewerStreamEvent;
      events.push(event);
      publishPrimaryAgentStreamEvent(threadId, event);
      if (event.kind === 'token' && event.nodeId === 'huey') {
        mainTokenBuffer += event.content;
      }
      if (event.kind === 'summary') {
        assistantText = event.summary;
        sawSummary = true;
      }
    } catch {
      // Ignore malformed stream frames and continue draining the response.
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
    let boundary = buffer.indexOf('\n\n');
    while (boundary >= 0) {
      consume(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim()) {
    consume(buffer);
  }

  if (!assistantText && mainTokenBuffer.trim()) {
    assistantText = mainTokenBuffer.trim();
  }

  return { assistantText, events, sawSummary };
}

async function postToPrimaryAgentStreamServer(
  threadId: string,
  body: Record<string, unknown>,
  abortSignal: AbortSignal
): Promise<Response> {
  const path = buildPrimaryAgentServerStreamPath(threadId);
  return apiFetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal: abortSignal,
  });
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
  const path = buildPrimaryAgentServerRunPath(threadId);
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

export function createPrimaryAgentModelAdapter(
  opts: PrimaryAgentAdapterOptions
): ChatModelAdapter {
  return {
    async run({
      messages,
      abortSignal,
    }: ChatModelRunOptions): Promise<ChatModelRunResult> {
      const threadId = opts.getThreadId();
      const intent = opts.getIntent?.() ?? null;
      const context = opts.getContext?.() ?? null;

      resetPrimaryAgentStreamThread(threadId);

      const requestBody = buildPrimaryAgentRequestBody(
        threadId,
        messages,
        intent,
        context
      );

      let response = await postToPrimaryAgentStreamServer(
        threadId,
        requestBody,
        abortSignal
      );

      if (response.ok && isEventStreamResponse(response)) {
        const { assistantText, sawSummary } = await readStreamResponse(
          response,
          threadId
        );
        const finalText = assistantText.trim() || '(No response)';
        if (!sawSummary && finalText !== '(No response)') {
          publishPrimaryAgentStreamEvent(threadId, {
            kind: 'summary',
            nodeId: 'huey',
            status: 'completed',
            summary: finalText,
            timestamp: new Date().toISOString(),
            sequence: 0,
          });
        }
        return {
          content: [{ type: 'text', text: finalText }],
        };
      } else if (response.ok) {
        const payload = (await response
          .json()
          .catch(() => null)) as AgentServerRunPayload | null;
        const parsed = parsePrimaryAgentServerRunResponse(payload, threadId);

        if (parsed.threadId !== threadId && opts.onThreadIdResolved) {
          opts.onThreadIdResolved(parsed.threadId);
        }
        if (parsed.isError) {
          throw new Error(
            parsed.errorDetail ?? 'Primary Agent encountered an error.'
          );
        }

        publishPrimaryAgentStreamEvent(threadId, {
          kind: 'summary',
          nodeId: 'huey',
          status: 'completed',
          summary: parsed.assistantText,
          timestamp: new Date().toISOString(),
          sequence: 0,
        });

        return {
          content: [{ type: 'text', text: parsed.assistantText }],
        };
      }

      // 429 or 5xx → retry once with gpt-4o-mini fallback on the legacy JSON
      // path so existing callers still degrade gracefully.
      if (response.status === 429 || response.status >= 500) {
        try {
          const fallbackBody = buildPrimaryAgentRequestBody(
            threadId,
            messages,
            intent,
            context,
            'gpt-4o-mini'
          );
          const [fallbackResp, fallbackPayload] = await postToAgentServer(
            threadId,
            fallbackBody,
            abortSignal
          );
          if (fallbackResp.ok) {
            const parsed = parsePrimaryAgentServerRunResponse(
              fallbackPayload,
              threadId
            );
            if (parsed.threadId !== threadId && opts.onThreadIdResolved) {
              opts.onThreadIdResolved(parsed.threadId);
            }
            if (parsed.isError) {
              throw new Error(
                parsed.errorDetail ?? 'Primary Agent encountered an error.'
              );
            }
            publishPrimaryAgentStreamEvent(threadId, {
              kind: 'summary',
              nodeId: 'huey',
              status: 'completed',
              summary: parsed.assistantText,
              timestamp: new Date().toISOString(),
              sequence: 0,
            });
            return {
              content: [{ type: 'text', text: parsed.assistantText }],
            };
          }
          response = fallbackResp;
        } catch {
          // ignore fallback errors — fall through to primary error handling
        }
      }

      if (!response.ok) {
        throw new Error(`Primary Agent request failed (${response.status})`);
      }

      return {
        content: [{ type: 'text', text: '(No response)' }],
      };
    },
  };
}
