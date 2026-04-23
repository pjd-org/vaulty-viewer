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
import { ChatShell } from '../components/chat-kit/ChatShell';
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

  React.useEffect(() => {
    if (threadId) return;
    navigate({
      to: '/agent-shell',
      search: { threadId: `da-${Date.now()}` },
      replace: true,
    });
  }, [threadId, navigate]);

  if (!threadId) {
    return (
      <div className="h-[calc(100vh-3.5rem)] min-h-0 px-4 pb-4">
        <ChatShell
          title="Agent Shell"
          subtitle="Run codex workflows with thread history, live tools, and execution state."
          className="h-full rounded-[30px]"
        >
          <div className="flex h-full items-center justify-center text-sm text-[--text-muted,theme(colors.zinc.400)]">
            Preparing chat thread...
          </div>
        </ChatShell>
      </div>
    );
  }

  const activeThreadId = threadId;

  const store = React.useMemo(
    () => createAgentRunStore('deepagent'),
    [activeThreadId]
  );

  function handleSelectThread(entry: ThreadEntry) {
    navigate({ to: '/agent-shell', search: { threadId: entry.id } });
  }

  function handleNewThread() {
    navigate({ to: '/agent-shell', search: { threadId: `da-${Date.now()}` } });
  }

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
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
    </div>
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] min-h-0 px-4 pb-4">
      <ChatShell
        title="Agent Shell"
        subtitle="Run codex workflows with thread history, live tools, and execution state."
        sidebar={sidebar}
        className="h-full rounded-[30px]"
      >
        <AgentChat
          key={activeThreadId}
          store={store}
          threadId={activeThreadId}
          sandboxAvailable={sandboxAvailable}
          onSelectThread={handleSelectThread}
          className="h-full"
        />
      </ChatShell>
    </div>
  );
}
