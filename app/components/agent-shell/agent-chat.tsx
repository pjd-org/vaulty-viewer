'use client';

/**
 * agent-shell/agent-chat.tsx
 *
 * Top-level assembly: mode switcher + messages + status bar + input.
 * Optional side panel shows todos, tool activity, subagents, artifacts.
 *
 * Usage:
 *   const store = useMemo(() => createAgentRunStore('deepagent'), []);
 *   <AgentChat store={store} threadId={threadId} />
 *
 * Props let the parent control layout; AgentChat fills its container.
 */

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { useAgentRun } from '../../lib/agent-shell/agent-client';
import type { AgentRunStore } from '../../lib/agent-shell/run-store';
import type { AgentExecutionMode } from '../../lib/agent-shell/types';
import { getModeConfig } from '../../lib/agent-shell/mode-config';
import { ThreadRegistry } from '../../lib/agent-shell/thread-registry';
import type { ThreadEntry } from '../../lib/agent-shell/thread-registry';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { RunStatusBar } from './run-status-bar';
import { ModeSwitcher } from './mode-switcher';
import { TodoPanel } from './todo-panel';
import { ToolActivityPanel } from './tool-activity-panel';
import { SubagentPanel } from './subagent-panel';
import { ArtifactPanel } from './artifact-panel';

export type AgentChatProps = {
  store: AgentRunStore;
  threadId?: string;
  sandboxAvailable?: boolean;
  /** Show the side panel (todos, tools, subagents, artifacts). Default: true */
  showSidePanel?: boolean;
  /** Called when the user selects a prior thread from history */
  onSelectThread?: (entry: ThreadEntry) => void;
  className?: string;
};

export function AgentChat({
  store,
  threadId,
  sandboxAvailable = true,
  showSidePanel = true,
  onSelectThread: _onSelectThread,
  className,
}: AgentChatProps) {
  const { state, send, cancel, isRunning } = useAgentRun({ store, threadId });
  const modeConfig = getModeConfig(state.mode);

  // ── ThreadRegistry upsert ─────────────────────────────────────────────────

  // When a run starts: register / update the thread with the first user message as title
  React.useEffect(() => {
    if (state.status !== 'running' || !state.threadId) return;
    const firstUser = state.messages.find((m) => m.role === 'user');
    ThreadRegistry.upsert({
      id: state.threadId,
      mode: state.mode,
      title: firstUser?.content ?? state.threadId,
    });
  }, [state.status, state.threadId, state.mode, state.messages]);

  // When a non-streaming assistant message lands: update the preview
  React.useEffect(() => {
    if (!state.threadId) return;
    const lastAssistant = [...state.messages]
      .reverse()
      .find((m) => m.role === 'assistant' && !m.streaming);
    if (!lastAssistant) return;
    ThreadRegistry.upsert({
      id: state.threadId,
      preview: lastAssistant.content,
    });
  }, [state.messages, state.threadId]);

  // Only show side panel if there's something to show
  const hasSidePanelContent =
    state.todos.length > 0 ||
    state.tools.length > 0 ||
    state.subagents.length > 0 ||
    state.artifacts.length > 0;

  const sidePanelVisible = showSidePanel && hasSidePanelContent;

  function handleModeChange(mode: AgentExecutionMode) {
    if (isRunning) return;
    store.setState((s) => ({ ...s, mode }));
  }

  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      {/* Header: mode switcher */}
      <div className="flex items-center px-4 py-2 border-b border-white/10 shrink-0">
        <ModeSwitcher
          value={state.mode}
          onChange={handleModeChange}
          sandboxAvailable={sandboxAvailable}
          disabled={isRunning}
        />
      </div>

      {/* Body: messages + optional side panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Messages — fills available space */}
        <ChatMessages
          messages={state.messages}
          status={state.status}
          className="flex-1 min-h-0"
        />

        {/* Side panel */}
        {sidePanelVisible && (
          <aside
            aria-label="Run details"
            className={cn(
              'w-72 shrink-0 flex flex-col gap-3 overflow-y-auto',
              'px-3 py-4 border-l border-white/10',
              'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10'
            )}
          >
            {state.subagents.length > 0 && (
              <SubagentPanel
                subagents={state.subagents}
                hasSubagentVisibility={modeConfig.hasSubagentVisibility}
              />
            )}
            {state.todos.length > 0 && <TodoPanel todos={state.todos} />}
            {state.tools.length > 0 && (
              <ToolActivityPanel tools={state.tools} />
            )}
            {state.artifacts.length > 0 && (
              <ArtifactPanel artifacts={state.artifacts} />
            )}
          </aside>
        )}
      </div>

      {/* Footer: status bar + input */}
      <div className="flex flex-col gap-2 px-4 py-3 border-t border-white/10 shrink-0">
        <RunStatusBar
          mode={state.mode}
          status={state.status}
          threadId={state.threadId}
          error={state.error}
        />
        <ChatInput status={state.status} onSend={send} onAbort={cancel} />
      </div>
    </div>
  );
}
