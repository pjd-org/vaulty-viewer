'use client';

/**
 * agent-shell/agent-chat.tsx
 *
 * Top-level assembly: mode switcher + messages + status bar + input.
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
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { RunStatusBar } from './run-status-bar';
import { ModeSwitcher } from './mode-switcher';

export type AgentChatProps = {
  store: AgentRunStore;
  threadId?: string;
  sandboxAvailable?: boolean;
  className?: string;
};

export function AgentChat({
  store,
  threadId,
  sandboxAvailable = true,
  className,
}: AgentChatProps) {
  const { state, send, cancel, isRunning } = useAgentRun({ store, threadId });

  function handleModeChange(mode: AgentExecutionMode) {
    // Mode changes are only allowed when idle
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

      {/* Messages — fills available space */}
      <ChatMessages
        messages={state.messages}
        status={state.status}
        className="flex-1 min-h-0"
      />

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
