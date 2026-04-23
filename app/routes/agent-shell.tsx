/**
 * routes/agent-shell.tsx
 *
 * Agent Shell — unified chat using TanStack AI.
 *
 * URL:   /agent-shell                   → new chat
 *        /agent-shell?threadId=xxx    → resume thread
 */

import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { AgentChat } from '../components/agent-shell/agent-chat';
import { ThreadHistory } from '../components/agent-shell/thread-history';
import { createAgentRunStore } from '../lib/agent-shell/run-store';
import type { ThreadEntry } from '../lib/agent-shell/thread-registry';

// ── Search schema ─────────────────────────────────────────────────────────────

const agentShellSearch = z.object({
  threadId: z.string().optional(),
});

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/agent-shell')({
  validateSearch: agentShellSearch,

  loader: async () => {
    const val = (process.env.SANDBOX_ENABLED ?? '').toLowerCase().trim();
    const sandboxAvailable = val === '1' || val === 'true' || val === 'yes';
    return { sandboxAvailable };
  },

  component: AgentShellRoute,
});

// ── Component ─────────────────────────────────────────────────────────────────

function AgentShellRoute() {
  const { threadId } = Route.useSearch();
  const { sandboxAvailable } = Route.useLoaderData();
  const navigate = useNavigate();

  const activeThreadId = React.useMemo(
    () => threadId ?? `da-${Date.now()}`,
    [threadId]
  );

  const store = React.useMemo(
    () => createAgentRunStore('deepagent'),
    [activeThreadId]
  );

  function handleSelectThread(entry: ThreadEntry) {
    navigate({ to: '/agent-shell', search: { threadId: entry.id } });
  }

  function handleNewThread() {
    navigate({ to: '/agent-shell', search: {} });
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 overflow-hidden">
      {/* Left: thread history */}
      <aside
        aria-label="Thread history"
        className="flex w-56 shrink-0 flex-col border-r border-white/10 min-h-0 overflow-hidden"
      >
        <div className="px-3 pt-3 shrink-0">
          <button
            type="button"
            onClick={handleNewThread}
            className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[--text-muted,theme(colors.zinc.400)] hover:bg-white/5 transition-colors"
          >
            + New chat
          </button>
        </div>

        <ThreadHistory
          activeThreadId={activeThreadId}
          onSelect={handleSelectThread}
          className="flex-1 min-h-0 overflow-hidden"
        />
      </aside>

      {/* Right: chat */}
      <main className="flex-1 min-w-0 min-h-0">
        <AgentChat
          key={activeThreadId}
          store={store}
          threadId={activeThreadId}
          sandboxAvailable={sandboxAvailable}
          onSelectThread={handleSelectThread}
          className="h-full"
        />
      </main>
    </div>
  );
}
