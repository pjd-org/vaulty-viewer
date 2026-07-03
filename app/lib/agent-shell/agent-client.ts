/**
 * agent-shell/agent-client.ts
 *
 * Client-side runner for the agent shell.
 *
 * runAgent():
 *   - Adds the user message to the store
 *   - Fetches the mode's NDJSON endpoint via apiFetch
 *   - Streams AgentShellEvents → dispatches to AgentRunStore
 *   - Simultaneously publishes ViewerStreamEvents to the stream bus
 *     (for PrimaryAgentStreamRail consumers)
 *   - Returns a cancel handle
 *
 * useAgentRun():
 *   - React hook wrapping runAgent with stable refs and cleanup
 */

import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '@tanstack/react-store';
import { apiFetch } from '../../../src/utils/api';
import { streamAgentShellEvents } from './event-normalizer';
import {
  dispatchAgentShellEvent,
  resetAgentRunStore,
  type AgentRunStore,
} from './run-store';
import { getModeConfig } from './mode-config';
import type {
  AgentRunState,
  AgentShellEvent,
  ChatMessage,
  RunAgentRequest,
} from './types';
import type { ViewerStreamEvent } from '../../../src/lib/primary-agent-stream';
import {
  publishPrimaryAgentStreamEvent,
  resetPrimaryAgentStreamThread,
} from '../../../src/lib/primary-agent-stream-bus';

// ── Projection: AgentShellEvent → ViewerStreamEvent ──────────────────────────

/**
 * Project an AgentShellEvent into a ViewerStreamEvent for the stream rail.
 * Returns null for events that have no stream rail representation.
 */
function toViewerStreamEvent(
  event: AgentShellEvent,
  sequence: number
): ViewerStreamEvent | null {
  const ts = new Date().toISOString();

  switch (event.type) {
    case 'subagent.update':
      return {
        kind: 'node_update',
        node: {
          id: event.subagent.nodeId,
          label: event.subagent.label,
          level:
            event.subagent.nodeId === 'huey'
              ? 'main'
              : event.subagent.nodeId.includes('/')
                ? 'specialist'
                : 'cabinet',
          status:
            event.subagent.status === 'idle' ||
            event.subagent.status === 'running'
              ? event.subagent.status
              : event.subagent.status === 'done'
                ? 'completed'
                : 'failed',
        },
        timestamp: event.subagent.startedAt ?? ts,
        sequence,
      };

    case 'message.delta':
      return {
        kind: 'token',
        nodeId: event.nodeId,
        content: event.delta,
        timestamp: ts,
        sequence,
      };

    case 'tool.started':
      return {
        kind: 'tool_call',
        nodeId: event.tool.nodeId,
        toolName: event.tool.toolName,
        argsChunk: event.tool.argsPreview,
        timestamp: event.tool.startedAt,
        sequence,
      };

    case 'tool.completed':
      return {
        kind: 'tool_result',
        nodeId: event.tool.nodeId,
        toolName: event.tool.toolName,
        preview: event.tool.resultPreview ?? '',
        timestamp: event.tool.completedAt ?? ts,
        sequence,
      };

    case 'progress':
      return {
        kind: 'progress',
        nodeId: event.nodeId,
        status: 'running',
        message: event.message,
        progress: event.progress,
        timestamp: ts,
        sequence,
      };

    case 'summary':
      return {
        kind: 'summary',
        nodeId: event.nodeId,
        status: event.status,
        summary: event.summary,
        artifactRefs: event.artifactRefs,
        timestamp: ts,
        sequence,
      };

    default:
      return null;
  }
}

// ── runAgent ──────────────────────────────────────────────────────────────────

export type RunAgentOptions = {
  /** AbortController signal — cancel by aborting the controller */
  signal?: AbortSignal;
  /** If provided, stream events are also published to the stream rail bus */
  threadId?: string;
};

export type RunAgentHandle = {
  /** Resolves when the run completes (done or error). */
  completed: Promise<void>;
  /** Abort the ongoing run. */
  cancel: () => void;
};

/**
 * Execute one agent turn.
 *
 * Side effects:
 *   - Appends the user message to store.messages
 *   - Sets store.status = 'running', then 'done' or 'error'
 *   - Dispatches all AgentShellEvents into the store
 *   - Publishes ViewerStreamEvents to the stream bus (if threadId provided)
 */
export function runAgent(
  request: RunAgentRequest,
  store: AgentRunStore,
  opts: RunAgentOptions = {}
): RunAgentHandle {
  const controller = new AbortController();
  const signal = opts.signal
    ? anySignal([opts.signal, controller.signal])
    : controller.signal;

  const cancel = () => controller.abort();

  // Append user message
  const userMessage: ChatMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    nodeId: 'user',
    content: request.message,
    createdAt: new Date().toISOString(),
  };
  store.setState((s) => ({
    ...s,
    status: 'running',
    error: null,
    messages: [...s.messages, userMessage],
  }));

  // Reset stream rail if threadId provided
  if (opts.threadId) {
    resetPrimaryAgentStreamThread(opts.threadId);
  }

  const config = getModeConfig(request.mode);
  let sequence = 0;

  const completed = (async () => {
    try {
      const response = await apiFetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Agent run failed (${response.status})`);
      }

      if (!response.body) {
        throw new Error('Agent run response has no body');
      }

      for await (const event of streamAgentShellEvents(response.body)) {
        if (signal.aborted) break;

        // Dispatch into run store
        dispatchAgentShellEvent(store, event);

        // Project to viewer stream event if applicable
        if (opts.threadId) {
          const vsEvent = toViewerStreamEvent(event, sequence++);
          if (vsEvent) {
            publishPrimaryAgentStreamEvent(opts.threadId, vsEvent);
          }
        }
      }

      store.setState((s) => ({
        ...s,
        status: signal.aborted ? s.status : 'done',
      }));
    } catch (err) {
      if (signal.aborted) return;
      const message = err instanceof Error ? err.message : String(err);
      dispatchAgentShellEvent(store, { type: 'run.error', message });
    }
  })();

  return { completed, cancel };
}

// ── React hook ────────────────────────────────────────────────────────────────

export type UseAgentRunOptions = {
  store: AgentRunStore;
  threadId?: string;
};

export type UseAgentRunReturn = {
  state: AgentRunState;
  send: (message: string, files?: import('./types').AttachedFile[]) => void;
  cancel: () => void;
  reset: () => void;
  isRunning: boolean;
};

/**
 * React hook for one agent shell instance.
 *
 * Provides stable `send` / `cancel` / `reset` callbacks and subscribes
 * to the store for re-renders.
 */
export function useAgentRun({
  store,
  threadId,
}: UseAgentRunOptions): UseAgentRunReturn {
  const state = useStore(store);
  const handleRef = useRef<RunAgentHandle | null>(null);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      handleRef.current?.cancel();
    };
  }, []);

  const send = useCallback(
    (message: string, files?: import('./types').AttachedFile[]) => {
      // Cancel any in-flight run
      handleRef.current?.cancel();

      const request: RunAgentRequest = {
        mode: store.state.mode,
        // Prefer store-bound threadId, then route-bound threadId for resumed chats.
        threadId: store.state.threadId ?? threadId ?? undefined,
        message,
        files,
      };

      handleRef.current = runAgent(request, store, { threadId });
    },
    [store, threadId]
  );

  const cancel = useCallback(() => {
    handleRef.current?.cancel();
    handleRef.current = null;
  }, []);

  const reset = useCallback(() => {
    handleRef.current?.cancel();
    handleRef.current = null;
    resetAgentRunStore(store);
  }, [store]);

  return {
    state,
    send,
    cancel,
    reset,
    isRunning: state.status === 'running',
  };
}

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Combine multiple AbortSignals: aborts when any one fires.
 * Minimal polyfill for environments without AbortSignal.any().
 */
function anySignal(signals: AbortSignal[]): AbortSignal {
  if (
    typeof AbortSignal !== 'undefined' &&
    typeof (AbortSignal as { any?: unknown }).any === 'function'
  ) {
    return (AbortSignal as { any: (s: AbortSignal[]) => AbortSignal }).any(
      signals
    );
  }
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
}
