/**
 * agent-shell/types.ts
 *
 * Canonical type definitions for the agent chat shell.
 * Re-exports viewer stream event types — do not duplicate.
 */

// ── Re-exports from the existing normalized stream contract ──────────────────
export type {
  ViewerAgentStatus,
  ViewerStreamEvent,
  ViewerStreamNode,
  ViewerStreamState,
} from '../../../src/lib/primary-agent-stream';

// ── Execution mode ───────────────────────────────────────────────────────────
export type AgentExecutionMode =
  | 'deepagent' // direct Tensura/DeepAgents orchestration
  | 'agent_runner' // sandboxed compiled-config execution
  | 'prompt_runner'; // Tensura-owned orchestration prompt path

// ── Run lifecycle ────────────────────────────────────────────────────────────
export type RunStatus = 'idle' | 'running' | 'done' | 'error';

// ── Chat messages ────────────────────────────────────────────────────────────
export type ChatMessageRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  /** nodeId that produced this message; 'huey' for the main agent turn */
  nodeId: string;
  content: string;
  /** ISO timestamp */
  createdAt: string;
  /** True while the stream is still appending content */
  streaming?: boolean;
};

// ── Attached files ───────────────────────────────────────────────────────────
export type AttachedFile = {
  name: string;
  mimeType: string;
  /** Base64-encoded content or URL */
  data: string;
};

// ── Todo items ───────────────────────────────────────────────────────────────
export type TodoStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';

export type TodoItem = {
  id: string;
  nodeId: string;
  text: string;
  status: TodoStatus;
  updatedAt: string;
};

// ── Tool events ───────────────────────────────────────────────────────────────
export type ToolEventStatus = 'started' | 'completed' | 'error';

export type ToolEvent = {
  id: string;
  nodeId: string;
  toolName: string;
  status: ToolEventStatus;
  argsPreview?: string;
  resultPreview?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
};

// ── Subagent runs ─────────────────────────────────────────────────────────────
export type SubagentRun = {
  /** Stable node ID: cabinet, cabinet/specialist, or cabinet/specialist/runId */
  nodeId: string;
  label: string;
  status: RunStatus;
  summary?: string;
  startedAt: string;
  completedAt?: string;
};

// ── Artifacts ─────────────────────────────────────────────────────────────────
export type ArtifactKind =
  | 'document'
  | 'code'
  | 'data'
  | 'image'
  | 'reference'
  | 'unknown';

export type Artifact = {
  id: string;
  nodeId: string;
  kind: ArtifactKind;
  title: string;
  content?: string;
  url?: string;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
};

// ── Top-level run state ───────────────────────────────────────────────────────
export type AgentRunState = {
  mode: AgentExecutionMode;
  status: RunStatus;
  threadId: string | null;
  messages: ChatMessage[];
  /** Per-node streaming text buffers (nodeId → accumulated string) */
  streamingTextByNode: Record<string, string>;
  todos: TodoItem[];
  tools: ToolEvent[];
  subagents: SubagentRun[];
  artifacts: Artifact[];
  error: string | null;
};

// ── Request / NDJSON event envelope ──────────────────────────────────────────
export type RunAgentRequest = {
  mode: AgentExecutionMode;
  threadId?: string;
  message: string;
  files?: AttachedFile[];
};

/**
 * Normalized NDJSON events emitted by the server adapters and consumed by
 * the client-side reducer.
 */
export type AgentShellEvent =
  | { type: 'run.mode'; mode: AgentExecutionMode }
  | { type: 'run.status'; status: RunStatus; threadId?: string }
  | { type: 'message.delta'; nodeId: string; delta: string }
  | { type: 'message.done'; nodeId: string; messageId: string; content: string }
  | { type: 'todo.update'; todo: TodoItem }
  | { type: 'tool.started'; tool: ToolEvent }
  | { type: 'tool.completed'; tool: ToolEvent }
  | { type: 'tool.error'; tool: ToolEvent }
  | { type: 'subagent.update'; subagent: SubagentRun }
  | { type: 'artifact.upsert'; artifact: Artifact }
  | { type: 'progress'; nodeId: string; message?: string; progress?: number }
  | {
      type: 'summary';
      nodeId: string;
      status: 'completed' | 'failed' | 'cancelled';
      summary: string;
      artifactRefs?: string[];
    }
  | { type: 'run.error'; message: string };
