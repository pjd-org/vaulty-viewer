/**
 * HueyWorkspace — chat UI built on @assistant-ui/react primitives.
 *
 * Reads thread state directly from AssistantRuntimeProvider context:
 *   - ThreadPrimitive.Viewport / Messages for message rendering + auto-scroll
 *   - ThreadPrimitive.ViewportFooter for scroll-aware composer placement
 *   - ComposerPrimitive.Root / Input / Send / Cancel for the composer
 *   - AuiIf for conditional rendering (replaces deprecated ThreadPrimitive.If / Empty)
 *
 * Must be rendered inside HueyAssistantProvider (AssistantRuntimeProvider).
 * Only external props are intent-level UI: activeIntent + intentTemplate.
 */
import React from 'react';
import { Link } from '@tanstack/react-router';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import {
  AuiIf,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useMessage,
} from '@assistant-ui/react';
import { SoftPanel } from '../layout';
import type { IntentTemplate, IntentType } from '../../../src/lib/huey-intents';

// ---------------------------------------------------------------------------
// Markdown renderer (assistant messages only)
// ---------------------------------------------------------------------------

function renderMarkdown(content: string): string {
  const raw = marked.parse(content, { async: false }) as string;
  return sanitizeHtml(raw, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'code',
      'pre',
      'kbd',
      'mark',
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      code: ['class'],
      pre: ['class'],
    },
  });
}

// ---------------------------------------------------------------------------
// Post-response quick-nav links
// ---------------------------------------------------------------------------

function PostResponseActions() {
  return (
    <div className="flex flex-wrap gap-3 mt-3">
      <Link to="/" search={{}} className="text-xs text-primary hover:underline">
        View next actions →
      </Link>
      <Link
        to="/"
        search={{}}
        className="text-xs text-primary hover:underline"
        onClick={() => {
          sessionStorage.setItem('huey-open-session', '1');
        }}
      >
        Start session →
      </Link>
      <Link to="/kanban" className="text-xs text-primary hover:underline">
        Open board →
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message components — rendered by Thread.Messages render-function children
// ---------------------------------------------------------------------------

function UserMessage() {
  const message = useMessage();
  const text = message.content
    .filter((p) => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('\n');

  return (
    <MessagePrimitive.Root>
      <div className="flex justify-end">
        <div className="genie-surface genie-surface--elevated genie-pill genie-layer-panel text-sm ml-auto max-w-[80%] text-right text-slate-800">
          {text}
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  const message = useMessage();
  const text = message.content
    .filter((p) => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('\n');

  return (
    <MessagePrimitive.Root>
      <div className="max-w-[85%]">
        <div className="genie-surface genie-card text-sm genie-surface--elevated genie-layer-panel">
          <div
            className="genie-content prose prose-sm max-w-none text-slate-800"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
          />
        </div>
        <PostResponseActions />
      </div>
    </MessagePrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HueyWorkspaceProps {
  activeIntent: IntentType | null;
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
    <SoftPanel variant="elevated" className="h-full flex flex-col !p-5">
      {/* Intent context banner */}
      {intentTemplate && (
        <div className="genie-surface genie-surface--utility rounded-2xl p-3 text-sm text-slate-700 mb-4 shrink-0">
          {intentTemplate.description}
        </div>
      )}

      {/* Context access summary — shown when intent is active and data is available */}
      {contextLine && (
        <div className="flex items-center gap-1.5 mb-3 shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Huey has access to:
          </span>
          <span className="text-[10px] text-slate-500">{contextLine}</span>
        </div>
      )}

      {/* Message list + scroll-aware composer footer */}
      <ThreadPrimitive.Viewport className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4">
        {/* Empty state — AuiIf replaces deprecated ThreadPrimitive.Empty */}
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <div className="flex flex-col justify-center h-full gap-5 py-10 px-2">
            {/* Identity + purpose */}
            <div>
              <p className="text-base font-semibold text-slate-800">Huey</p>
              <p className="text-sm text-slate-600 mt-0.5">
                Execution interface for the vault system. Ask about tasks,
                context, decisions, or anything else tracked here.
              </p>
            </div>

            {/* What you can do */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Try asking
              </p>
              {[
                'What should I work on next?',
                'Summarise the current state of the project.',
                'What decisions have we made about the API?',
                'Which tasks are blocked right now?',
              ].map((prompt) => (
                <p
                  key={prompt}
                  className="text-xs text-slate-500 pl-2 border-l border-slate-200"
                >
                  {prompt}
                </p>
              ))}
            </div>

            {/* Workflow hint */}
            <p className="text-xs text-slate-400">
              Select a workflow in the sidebar to pre-load context, or just type
              below.
            </p>
          </div>
        </AuiIf>

        {/* Messages — render-function children replace deprecated components prop */}
        <ThreadPrimitive.Messages>
          {({ message }) => {
            if (message.role === 'user') return <UserMessage />;
            return <AssistantMessage />;
          }}
        </ThreadPrimitive.Messages>

        {/* Streaming indicator — AuiIf replaces deprecated ThreadPrimitive.If */}
        <AuiIf condition={(s) => s.thread.isRunning}>
          <div className="max-w-[85%]">
            <div className="genie-surface genie-surface--elevated genie-card text-sm text-slate-600">
              Thinking…
            </div>
          </div>
        </AuiIf>

        {/* Composer inside ViewportFooter so auto-scroll accounts for its height */}
        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 pt-2">
          <ComposerPrimitive.Root className="genie-surface genie-surface--overlay genie-layer-overlay genie-composer flex items-center gap-3">
            <ComposerPrimitive.Input
              className="flex-1 resize-none text-sm outline-none border-none shadow-none ring-0 bg-transparent text-slate-800 placeholder:text-slate-500"
              rows={2}
              placeholder="Ask me anything…"
              submitMode="ctrlEnter"
            />

            {/* Cancel — only while running */}
            <AuiIf condition={(s) => s.thread.isRunning}>
              <ComposerPrimitive.Cancel asChild>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 border border-slate-200 hover:border-red-300 hover:text-red-500 transition-colors"
                >
                  Cancel
                </button>
              </ComposerPrimitive.Cancel>
            </AuiIf>

            <ComposerPrimitive.Send asChild>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                Send
              </button>
            </ComposerPrimitive.Send>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </SoftPanel>
  );
}
