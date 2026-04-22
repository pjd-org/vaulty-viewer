/**
 * routes/agent-shell.tsx
 *
 * Agent Shell route — full agent chat with mode switching and thread history.
 *
 * URL:   /agent-shell                   → new chat (generates a fresh threadId)
 *        /agent-shell?threadId=da-xxx   → resume a prior thread
 *
 * Layout:
 *   ┌──────────────┬────────────────────────────────────┐
 *   │ Thread list  │         AgentChat                  │
 *   │   (256px)    │  (mode switcher + messages + input)│
 *   └──────────────┴────────────────────────────────────┘
 *
 * Loader reads SANDBOX_ENABLED server-side so the client never needs to touch
 * process.env. Falls through to sandboxAvailable=false if not set.
 */

import * as React from 'react';
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

  /**
   * Stable thread ID for this session.
   * - If a threadId is in the URL, use it (resume mode).
   * - Otherwise generate a fresh `da-` ID (new chat).
   *
   * Keyed on `threadId` so that switching threads via history
   * produces a new ID, remounts AgentChat, and resets the store.
   */
  const activeThreadId = React.useMemo(
    () => threadId ?? `da-${Date.now()}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threadId]
  );

  /**
   * One store per thread — recreated when activeThreadId changes.
   * The Tensura server owns actual thread state; the store is in-session only.
   */
  const store = React.useMemo(
    () => createAgentRunStore('deepagent'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeThreadId]
  );

  function handleSelectThread(entry: ThreadEntry) {
    navigate({ to: '/agent-shell', search: { threadId: entry.id } });
  }

  function handleNewThread() {
    // Navigate to /agent-shell without threadId — generates a fresh ID on mount
    navigate({ to: '/agent-shell', search: {} });
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 overflow-hidden">
      {/* ── Left: thread history ─────────────────────────────────────────── */}
      <aside
        aria-label="Thread history"
        className="flex w-56 shrink-0 flex-col border-r border-white/10 min-h-0 overflow-hidden"
      >
        {/* New chat button */}
        <div className="px-3 pt-3 shrink-0">
          <button
            type="button"
            onClick={handleNewThread}
            className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[--text-muted,theme(colors.zinc.400)] hover:bg-white/5 transition-colors"
          >
            + New chat
          </button>
        </div>

        {/* Thread list — fills remaining space */}
        <ThreadHistory
          activeThreadId={activeThreadId}
          onSelect={handleSelectThread}
          className="flex-1 min-h-0 overflow-hidden"
        />
      </aside>

      {/* ── Right: chat ──────────────────────────────────────────────────── */}
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
