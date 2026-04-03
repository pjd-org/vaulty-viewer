import React from 'react';
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

export const Route = createFileRoute('/session/$id')({
  component: SessionRoute,
});

function SessionRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isLoading, error } = useSessionDetail(id);

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

  if (isLoading) {
    return (
      <main className="page focus-page">
        <div className="focus-loading">Loading session…</div>
      </main>
    );
  }

  if (error) {
    const is404 = error.message.includes('not found');
    return (
      <main className="page focus-page">
        <div className="focus-empty" role="alert">
          <p>
            {is404
              ? 'Session not found.'
              : `Failed to load session: ${error.message}`}
          </p>
          <Link to="/" search={{}} className="pill pill--soft">
            ← Back to Focus
          </Link>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="page focus-page">
        <div className="focus-empty">
          <p>Session not found.</p>
          <Link to="/" search={{}} className="pill pill--soft">
            ← Back to Focus
          </Link>
        </div>
      </main>
    );
  }

  const pending = session.tasks?.filter((t) => t.status === 'pending') ?? [];
  const inProgress =
    session.tasks?.filter((t) => t.status === 'in_progress') ?? [];
  const done = session.tasks?.filter((t) => t.status === 'done') ?? [];
  const skipped = session.tasks?.filter((t) => t.status === 'skipped') ?? [];
  const elapsed = session.startedAt ? elapsedMinutes(session.startedAt) : null;

  const handleUpdateTask = (task: SessionTask, status: string) => {
    if (!task.path) return;
    updateTaskMutation.mutate({ taskPath: task.path, status });
  };

  return (
    <main className="page focus-page">
      <header className="focus-header">
        <div>
          <p className="eyebrow">Session</p>
          <h1>{session.title ?? `Session ${id.slice(0, 8)}`}</h1>
        </div>
        <div className="focus-header__nav">
          <Link to="/" search={{}} className="pill pill--ghost">
            ← Focus
          </Link>
        </div>
      </header>

      {(updateTaskMutation.error || endSessionMutation.error) && (
        <div className="session-error" role="alert">
          <p>
            {updateTaskMutation.error?.message ??
              endSessionMutation.error?.message}
          </p>
        </div>
      )}

      <div className="session-meta">
        {elapsed !== null && <span className="chip">{elapsed}m elapsed</span>}
        <span className="chip">{formatDuration(session.budgetMin)} budget</span>
        <span className="chip">
          {done.length}/{session.tasks?.length ?? 0} done
        </span>
      </div>

      {inProgress.length > 0 && (
        <section className="focus-hero">
          <p className="focus-section-label">In progress</p>
          {inProgress.map((t) => (
            <SessionTaskCard
              key={t.id}
              task={t}
              onDone={() => handleUpdateTask(t, 'completed')}
              onSkip={() => handleUpdateTask(t, 'skipped')}
              mutating={
                updateTaskMutation.isPending &&
                updateTaskMutation.variables?.taskPath === t.path
              }
              hero
            />
          ))}
        </section>
      )}

      {pending.length > 0 && (
        <section className="focus-queue">
          <p className="focus-section-label">Queued</p>
          <div className="focus-queue__list">
            {pending.map((t) => (
              <SessionTaskCard
                key={t.id}
                task={t}
                onDone={() => handleUpdateTask(t, 'completed')}
                onSkip={() => handleUpdateTask(t, 'skipped')}
                mutating={
                  updateTaskMutation.isPending &&
                  updateTaskMutation.variables?.taskPath === t.path
                }
              />
            ))}
          </div>
        </section>
      )}

      {(done.length > 0 || skipped.length > 0) && (
        <details className="focus-backlog">
          <summary className="focus-backlog__summary">
            Done ({done.length}) · Skipped ({skipped.length})
          </summary>
          <div className="focus-backlog__list">
            {[...done, ...skipped].map((t) => (
              <div key={t.id} className="focus-backlog__item">
                <span className="focus-backlog__title">{t.title}</span>
                <span
                  className={`chip chip--${t.status === 'done' ? 'score' : 'tag'}`}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="session-footer">
        <button
          className="na-card__btn na-card__btn--done"
          onClick={() => endSessionMutation.mutate('completed')}
          disabled={endSessionMutation.isPending}
        >
          End Session
        </button>
        <button
          className="na-card__btn na-card__btn--skip"
          onClick={() => endSessionMutation.mutate('aborted')}
          disabled={endSessionMutation.isPending}
        >
          Abort
        </button>
      </div>
    </main>
  );
}

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
    <article className={`na-card${hero ? ' na-card--hero' : ''}`}>
      <div className="na-card__main">
        <span
          className={`na-card__title${hero ? ' na-card__title--hero' : ''}`}
        >
          {task.title}
        </span>
        {task.effortScore !== undefined && task.effortScore > 0 && (
          <div className="na-card__chips">
            <span className="chip chip--effort">effort {task.effortScore}</span>
          </div>
        )}
      </div>
      <div className="na-card__actions">
        <button
          className="na-card__btn na-card__btn--done"
          onClick={onDone}
          disabled={mutating}
        >
          ✓ Done
        </button>
        <button
          className="na-card__btn na-card__btn--skip"
          onClick={onSkip}
          disabled={mutating}
        >
          Skip
        </button>
      </div>
    </article>
  );
}
