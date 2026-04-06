import React, { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../src/utils/api';
import {
  useSessionDetail,
  invalidateQueriesForDomain,
} from '../lib/viewer-adapter';
import {
  elapsedMinutes,
  formatDuration,
  type SessionTask,
} from '../../src/lib/focus-logic';
import { WorkspaceScaffold } from '../components/layout/WorkspaceScaffold';

export const Route = createFileRoute('/session/$id')({
  component: SessionRoute,
});

// ---------------------------------------------------------------------------
// SessionTaskCard
// ---------------------------------------------------------------------------

function SessionTaskCard({
  task,
  onDone,
  onSkip,
  mutating,
  hero = false,
}: {
  task: SessionTask;
  onDone: () => void;
  onSkip: () => void;
  mutating: boolean;
  hero?: boolean;
}) {
  return (
    <article
      className={[
        'rounded-xl border p-4 transition',
        hero
          ? 'border-emerald-400/30 bg-emerald-400/8'
          : 'border-white/8 bg-white/4 hover:bg-white/6',
      ].join(' ')}
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={[
              'font-medium leading-snug',
              hero ? 'text-base text-slate-100' : 'text-sm text-slate-200',
            ].join(' ')}
          >
            {task.title}
          </p>
          {task.effortScore !== undefined && task.effortScore > 0 && (
            <span className="mt-1 inline-block rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-slate-400">
              effort {task.effortScore}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-40"
          onClick={onDone}
          disabled={mutating}
        >
          ✓ Done
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/8 disabled:opacity-40"
          onClick={onSkip}
          disabled={mutating}
        >
          Skip
        </button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

function SessionRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isLoading, error } = useSessionDetail(id);

  const [confirmAction, setConfirmAction] = useState<
    'completed' | 'aborted' | null
  >(null);

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskPath,
      status,
    }: {
      taskPath: string;
      status: string;
    }) => {
      const res = await apiFetch(
        `/api/v1/tasks/${encodeURIComponent(taskPath)}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok)
        throw new Error(`Failed to update task status: ${res.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sessions', 'detail', id],
      });
      invalidateQueriesForDomain(queryClient, 'work', {});
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async (status: 'completed' | 'aborted') => {
      const res = await apiFetch('/api/v1/cod/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session?.id ?? id, status }),
      });
      if (!res.ok) throw new Error(`Failed to end session: ${res.status}`);
    },
    onSuccess: () => {
      invalidateQueriesForDomain(queryClient, 'work', {});
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      navigate({ to: '/', search: {} });
    },
  });

  const handleUpdateTask = (task: SessionTask, status: string) => {
    if (!task.path) return;
    updateTaskMutation.mutate({ taskPath: task.path, status });
  };

  // --- Loading / error states ---

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading session…</p>
      </div>
    );
  }

  if (error || !session) {
    const is404 = !session || error?.message.includes('not found');
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-400" role="alert">
          {is404
            ? 'Session not found.'
            : `Failed to load session: ${error?.message}`}
        </p>
        <Link
          to="/"
          search={{}}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/8"
        >
          ← Back to Focus
        </Link>
      </div>
    );
  }

  // --- Data ---

  const pending = session.tasks?.filter((t) => t.status === 'pending') ?? [];
  const inProgress =
    session.tasks?.filter((t) => t.status === 'in_progress') ?? [];
  const done = session.tasks?.filter((t) => t.status === 'done') ?? [];
  const skipped = session.tasks?.filter((t) => t.status === 'skipped') ?? [];
  const elapsed = session.startedAt ? elapsedMinutes(session.startedAt) : null;

  const mutationError =
    updateTaskMutation.error?.message ?? endSessionMutation.error?.message;

  // --- Layout ---

  const primaryContent = (
    <div className="space-y-6">
      {mutationError && (
        <div
          className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {mutationError}
        </div>
      )}

      {inProgress.length === 0 && pending.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">
          No active tasks.
        </p>
      )}

      {inProgress.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
            In progress
          </p>
          {inProgress.map((t) => (
            <SessionTaskCard
              key={t.id}
              task={t}
              onDone={() => handleUpdateTask(t, 'done')}
              onSkip={() => handleUpdateTask(t, 'skipped')}
              mutating={
                updateTaskMutation.isPending &&
                updateTaskMutation.variables?.taskPath === t.path
              }
              hero
            />
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
            Queued
          </p>
          {pending.map((t) => (
            <SessionTaskCard
              key={t.id}
              task={t}
              onDone={() => handleUpdateTask(t, 'done')}
              onSkip={() => handleUpdateTask(t, 'skipped')}
              mutating={
                updateTaskMutation.isPending &&
                updateTaskMutation.variables?.taskPath === t.path
              }
            />
          ))}
        </div>
      )}
    </div>
  );

  const asideContent = (
    <div className="flex h-full flex-col gap-6">
      {/* Session controls */}
      <div className="space-y-2">
        {confirmAction ? (
          <>
            <p className="mb-3 text-sm text-slate-300">
              {confirmAction === 'completed'
                ? 'End session?'
                : 'Abort session?'}
            </p>
            <button
              type="button"
              className="w-full rounded-lg bg-emerald-500/20 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-40"
              onClick={() => {
                endSessionMutation.mutate(confirmAction);
                setConfirmAction(null);
              }}
              disabled={endSessionMutation.isPending}
            >
              Confirm
            </button>
            <button
              type="button"
              className="w-full rounded-lg border border-white/10 py-2 text-sm text-slate-400 transition hover:bg-white/8"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="w-full rounded-lg bg-emerald-500/20 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-40"
              onClick={() => setConfirmAction('completed')}
              disabled={endSessionMutation.isPending}
            >
              End Session
            </button>
            <button
              type="button"
              className="w-full rounded-lg border border-red-400/20 py-2 text-sm text-red-400 transition hover:bg-red-400/8 disabled:opacity-40"
              onClick={() => setConfirmAction('aborted')}
              disabled={endSessionMutation.isPending}
            >
              Abort
            </button>
          </>
        )}
      </div>

      {/* Done / skipped log */}
      {(done.length > 0 || skipped.length > 0) && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
            Done ({done.length}) · Skipped ({skipped.length})
          </p>
          <div className="space-y-1">
            {[...done, ...skipped].map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-slate-400">
                  {t.title}
                </span>
                <span
                  className={[
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px]',
                    t.status === 'done'
                      ? 'bg-emerald-400/15 text-emerald-300'
                      : 'bg-white/8 text-slate-500',
                  ].join(' ')}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <WorkspaceScaffold
      title={session.title ?? `Session ${id.slice(0, 8)}`}
      subtitle="Active session"
      actions={
        <Link
          to="/"
          search={{}}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/8"
        >
          ← Focus
        </Link>
      }
      summaryItems={[
        {
          label: 'Elapsed',
          value: elapsed !== null ? `${elapsed}m` : '—',
        },
        {
          label: 'Budget',
          value: formatDuration(session.budgetMin),
        },
        {
          label: 'Progress',
          value: `${done.length} / ${session.tasks?.length ?? 0}`,
        },
      ]}
      primaryTitle="Tasks"
      primary={primaryContent}
      asideTitle="Controls"
      aside={asideContent}
    />
  );
}
