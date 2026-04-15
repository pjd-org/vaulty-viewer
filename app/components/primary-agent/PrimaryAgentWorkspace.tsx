/**
 * PrimaryAgentWorkspace — wraps the assistant-ui Thread component.
 *
 * Renders an optional intent banner and context summary above the full
 * production-grade Thread UI from @/app/components/assistant-ui/thread.tsx.
 *
 * Must be rendered inside PrimaryAgentAssistantProvider (AssistantRuntimeProvider).
 */
import React from 'react';
import { ChatShell, ChatThread } from '../chat-kit';
import type { IntentTemplate } from '../../../src/lib/primary-agent-intents';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PrimaryAgentWorkspaceProps {
  intentTemplate: IntentTemplate | null;
  /** Optional summary of what the Primary Agent has access to in the current context */
  contextSummary?: {
    taskCount: number;
    noteCount: number;
    inboxPending: number;
  };
}

export function PrimaryAgentWorkspace({
  intentTemplate,
  contextSummary,
}: PrimaryAgentWorkspaceProps) {
  const contextLine = contextSummary
    ? [
        contextSummary.taskCount > 0
          ? `${contextSummary.taskCount} task${contextSummary.taskCount !== 1 ? 's' : ''}`
          : null,
        contextSummary.noteCount > 0
          ? `${contextSummary.noteCount} note${contextSummary.noteCount !== 1 ? 's' : ''}`
          : null,
        contextSummary.inboxPending > 0
          ? `${contextSummary.inboxPending} inbox item${contextSummary.inboxPending !== 1 ? 's' : ''}`
          : null,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <ChatShell
      header={
        <div className="flex flex-col gap-3">
          {intentTemplate && (
            <div className="genie-surface genie-surface--hero rounded-[24px] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-none">
              {intentTemplate.description}
            </div>
          )}
          {contextLine && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Primary Agent has access to:
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">
                {contextLine}
              </span>
            </div>
          )}
        </div>
      }
    >
      <div className="min-h-0 flex-1">
        <ChatThread />
      </div>
    </ChatShell>
  );
}
