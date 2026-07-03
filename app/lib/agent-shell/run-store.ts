/**
 * agent-shell/run-store.ts
 *
 * TanStack Store holding AgentRunState for the active agent run.
 * One store per shell instance — consumers subscribe via useSyncExternalStore
 * or @tanstack/store React bindings.
 */

import { Store } from '@tanstack/store';
import type {
  AgentExecutionMode,
  AgentRunState,
  AgentShellEvent,
  Artifact,
  ChatMessage,
  SubagentRun,
  TodoItem,
  ToolEvent,
} from './types';

// ── Initial state factory ─────────────────────────────────────────────────────

export function createAgentRunState(mode: AgentExecutionMode): AgentRunState {
  return {
    mode,
    status: 'idle',
    threadId: null,
    messages: [],
    streamingTextByNode: {},
    todos: [],
    tools: [],
    subagents: [],
    artifacts: [],
    error: null,
  };
}

// ── Store factory ─────────────────────────────────────────────────────────────

/**
 * Create a scoped Store<AgentRunState> for one agent shell instance.
 */
export function createAgentRunStore(mode: AgentExecutionMode) {
  return new Store<AgentRunState>(createAgentRunState(mode));
}

export type AgentRunStore = ReturnType<typeof createAgentRunStore>;

// ── Reducer ───────────────────────────────────────────────────────────────────

/**
 * Apply one AgentShellEvent to the current AgentRunState.
 * Pure function — returns a new state object (or the same reference if no-op).
 */
export function reduceAgentShellEvent(
  state: AgentRunState,
  event: AgentShellEvent
): AgentRunState {
  switch (event.type) {
    case 'run.mode':
      if (state.mode === event.mode) return state;
      return { ...state, mode: event.mode };

    case 'run.status': {
      const next: AgentRunState = { ...state, status: event.status };
      if (event.threadId && event.threadId !== state.threadId) {
        next.threadId = event.threadId;
      }
      return next;
    }

    case 'message.delta': {
      const prev = state.streamingTextByNode[event.nodeId] ?? '';
      const next = prev + event.delta;

      // Update or create the streaming assistant message for this node
      const messages = upsertStreamingMessage(
        state.messages,
        event.nodeId,
        next
      );
      return {
        ...state,
        streamingTextByNode: {
          ...state.streamingTextByNode,
          [event.nodeId]: next,
        },
        messages,
      };
    }

    case 'message.done': {
      // Finalize the streaming message: clear streaming flag, set final content
      const messages = finalizeMessage(
        state.messages,
        event.messageId,
        event.nodeId,
        event.content
      );
      const streamingTextByNode = { ...state.streamingTextByNode };
      delete streamingTextByNode[event.nodeId];
      return { ...state, messages, streamingTextByNode };
    }

    case 'todo.update': {
      const todos = upsertById(state.todos, event.todo as TodoItem);
      return { ...state, todos };
    }

    case 'tool.started':
    case 'tool.completed':
    case 'tool.error': {
      const tools = upsertById(state.tools, event.tool as ToolEvent);
      return { ...state, tools };
    }

    case 'subagent.update': {
      const subagents = upsertByNodeId(
        state.subagents,
        event.subagent as SubagentRun
      );
      return { ...state, subagents };
    }

    case 'artifact.upsert': {
      const artifacts = upsertById(state.artifacts, event.artifact as Artifact);
      return { ...state, artifacts };
    }

    case 'progress':
      // Progress is handled by the viewer stream rail via ViewerStreamEvent.
      // No direct AgentRunState mutation needed.
      return state;

    case 'summary':
      // Summary is handled by the viewer stream rail.
      return state;

    case 'run.error':
      return { ...state, status: 'error', error: event.message };

    default:
      return state;
  }
}

/**
 * Dispatch an AgentShellEvent into an AgentRunStore.
 */
export function dispatchAgentShellEvent(
  store: AgentRunStore,
  event: AgentShellEvent
): void {
  store.setState((current) => reduceAgentShellEvent(current, event));
}

/**
 * Reset the store to a fresh idle state for a new run (optionally same mode).
 */
export function resetAgentRunStore(
  store: AgentRunStore,
  mode?: AgentExecutionMode
): void {
  store.setState((current) => createAgentRunState(mode ?? current.mode));
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function upsertById<T extends { id: string }>(arr: T[], item: T): T[] {
  const idx = arr.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...arr, item];
  const next = [...arr];
  next[idx] = item;
  return next;
}

function upsertByNodeId<T extends { nodeId: string }>(arr: T[], item: T): T[] {
  const idx = arr.findIndex((x) => x.nodeId === item.nodeId);
  if (idx === -1) return [...arr, item];
  const next = [...arr];
  next[idx] = item;
  return next;
}

function upsertStreamingMessage(
  messages: ChatMessage[],
  nodeId: string,
  content: string
): ChatMessage[] {
  // Find the last assistant message for this node that is still streaming
  const idx = findLastIndex(
    messages,
    (m) => m.nodeId === nodeId && m.role === 'assistant' && m.streaming === true
  );
  if (idx !== -1) {
    const next = [...messages];
    next[idx] = { ...next[idx], content };
    return next;
  }
  // Create a new streaming message
  const msg: ChatMessage = {
    id: `stream-${nodeId}-${Date.now()}`,
    role: 'assistant',
    nodeId,
    content,
    createdAt: new Date().toISOString(),
    streaming: true,
  };
  return [...messages, msg];
}

function finalizeMessage(
  messages: ChatMessage[],
  messageId: string,
  nodeId: string,
  content: string
): ChatMessage[] {
  // First try to find by messageId
  let idx = messages.findIndex((m) => m.id === messageId);
  if (idx === -1) {
    // Fall back to the last streaming assistant message for this node
    idx = findLastIndex(
      messages,
      (m) =>
        m.nodeId === nodeId && m.role === 'assistant' && m.streaming === true
    );
  }
  if (idx === -1) {
    // Create a finalized message if nothing was streaming (e.g. non-streaming path)
    const msg: ChatMessage = {
      id: messageId,
      role: 'assistant',
      nodeId,
      content,
      createdAt: new Date().toISOString(),
      streaming: false,
    };
    return [...messages, msg];
  }
  const next = [...messages];
  next[idx] = { ...next[idx], id: messageId, content, streaming: false };
  return next;
}

function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}
