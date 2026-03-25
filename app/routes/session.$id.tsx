import React, { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { apiFetch } from "../../src/utils/api";
import {
  elapsedMinutes,
  formatDuration,
  type ActiveSession,
  type SessionTask,
} from "../../src/lib/focus-logic";

export const Route = createFileRoute("/session/$id")({
  component: SessionRoute,
});

function SessionRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/sessions/${encodeURIComponent(id)}`);
      if (res.ok) {
        const body = await res.json();
        setSession(body.structuredContent?.session ?? body.session ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateTaskStatus = async (task: SessionTask, status: string) => {
    if (!task.path) return;
    setMutatingId(task.id);
    try {
      await apiFetch(
        `/api/v1/tasks/${encodeURIComponent(task.path)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      reload();
    } finally {
      setMutatingId(null);
    }
  };

  const endSession = async (status: "completed" | "aborted") => {
    if (!session) return;
    setEnding(true);
    try {
      await apiFetch("/cod/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, status }),
      });
      await navigate({ to: "/" });
    } finally {
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <main className="page focus-page">
        <div className="focus-loading">Loading session…</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="page focus-page">
        <div className="focus-empty">
          <p>Session not found.</p>
          <Link to="/" className="pill pill--soft">← Back to Focus</Link>
        </div>
      </main>
    );
  }

  const pending = session.tasks?.filter((t) => t.status === "pending") ?? [];
  const inProgress = session.tasks?.filter((t) => t.status === "in_progress") ?? [];
  const done = session.tasks?.filter((t) => t.status === "done") ?? [];
  const skipped = session.tasks?.filter((t) => t.status === "skipped") ?? [];
  const elapsed = session.startedAt ? elapsedMinutes(session.startedAt) : null;

  return (
    <main className="page focus-page">
      <header className="focus-header">
        <div>
          <p className="eyebrow">Session</p>
          <h1>{session.title ?? `Session ${id.slice(0, 8)}`}</h1>
        </div>
        <div className="focus-header__nav">
          <Link to="/" className="pill pill--ghost">← Focus</Link>
        </div>
      </header>

      <div className="session-meta">
        {elapsed !== null && (
          <span className="chip">{elapsed}m elapsed</span>
        )}
        <span className="chip">{formatDuration(session.budgetMin)} budget</span>
        <span className="chip">{done.length}/{session.tasks?.length ?? 0} done</span>
      </div>

      {inProgress.length > 0 && (
        <section className="focus-hero">
          <p className="focus-section-label">In progress</p>
          {inProgress.map((t) => (
            <SessionTaskCard
              key={t.id}
              task={t}
              onDone={() => updateTaskStatus(t, "completed")}
              onSkip={() => updateTaskStatus(t, "skipped")}
              mutating={mutatingId === t.id}
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
                onDone={() => updateTaskStatus(t, "completed")}
                onSkip={() => updateTaskStatus(t, "skipped")}
                mutating={mutatingId === t.id}
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
                <span className={`chip chip--${t.status === "done" ? "score" : "tag"}`}>
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
          onClick={() => endSession("completed")}
          disabled={ending}
        >
          End Session
        </button>
        <button
          className="na-card__btn na-card__btn--skip"
          onClick={() => endSession("aborted")}
          disabled={ending}
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
    <article className={`na-card${hero ? " na-card--hero" : ""}`}>
      <div className="na-card__main">
        <span className={`na-card__title${hero ? " na-card__title--hero" : ""}`}>
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
