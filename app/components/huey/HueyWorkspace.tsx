/**
 * HueyWorkspace — wraps the assistant-ui Thread component.
 *
 * Renders an optional intent banner and context summary above the full
 * production-grade Thread UI from @/app/components/assistant-ui/thread.tsx.
 *
 * Must be rendered inside HueyAssistantProvider (AssistantRuntimeProvider).
 */
import React from 'react';
import { Thread } from '../assistant-ui/thread';
import type { IntentTemplate } from '../../../src/lib/huey-intents';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HueyWorkspaceProps {
  intentTemplate: IntentTemplate | null;
  /** Optional summary of what Huey has access to in the current context */
  contextSummary?: {
    taskCount: number;
    noteCount: number;
    inboxPending: number;
  };
}

export function HueyWorkspace({
  intentTemplate,
  contextSummary,
}: HueyWorkspaceProps) {
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
    <div className="h-full flex flex-col rounded-[28px] overflow-hidden bg-white/82 backdrop-blur-[14px] border border-white/70 shadow-[0_20px_44px_rgba(17,21,29,0.12)]">
      {/* Intent context banner */}
      {intentTemplate && (
        <div className="px-5 pt-4 pb-0 shrink-0">
          <div className="rounded-2xl bg-white/74 shadow-[0_12px_24px_rgba(17,21,29,0.08)] px-3 py-2.5 text-sm text-slate-700">
            {intentTemplate.description}
          </div>
        </div>
      )}

      {/* Context access summary */}
      {contextLine && (
        <div className="flex items-center gap-1.5 px-5 pt-3 pb-0 shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Huey has access to:
          </span>
          <span className="text-[10px] text-slate-500">{contextLine}</span>
        </div>
      )}

      {/* Full assistant-ui Thread */}
      <div className="flex-1 min-h-0">
        <Thread />
      </div>
    </div>
  );
}
