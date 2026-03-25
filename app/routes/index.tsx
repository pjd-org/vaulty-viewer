import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { apiFetch } from "../../src/utils/api";
import {
  normalizeNextAction,
  normalizeSessionSummary,
  formatSessionDuration,
  isBlocked,
  dueDays,
  formatScore,
  formatDuration,
  elapsedMinutes,
  type NextAction,
  type ActiveSession,
  type SessionSummary,
} from "../../src/lib/focus-logic";
import {
  mergeHomepageApiStatus,
  homepageApiBadgeText,
} from "../../src/lib/homepage-logic";

export const Route = createFileRoute("/")({
  component: FocusRoute,
});

// ---------------------------------------------------------------------------
// Data hook
// ---------------------------------------------------------------------------

function useFocusData() {
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [actionsRes, sessionsRes, recentRes] = await Promise.all([
        apiFetch("/api/v1/tasks/next-actions?max=10"),
        apiFetch("/api/v1/sessions?status=active&limit=1"),
        apiFetch("/api/v1/sessions?limit=3"),
      ]);
      if (actionsRes.ok) {
        const body = await actionsRes.json();
        const raw: Record<string, unknown>[] =
          body.structuredContent?.tasks ?? body.tasks ?? [];
        setNextActions(raw.map(normalizeNextAction));
        setApiOnline(true);
      } else {
        setApiOnline(false);
      }
      if (sessionsRes.ok) {
        const body = await sessionsRes.json();
        const sessions: ActiveSession[] =
          body.structuredContent?.sessions ?? body.sessions ?? [];
        setActiveSession(
          sessions.find((s) => s.status === "active") ?? null
        );
      }
      if (recentRes.ok) {
        const body = await recentRes.json();
        const raw: unknown[] = body.structuredContent?.sessions ?? body.sessions ?? [];
        setRecentSessions(raw.map(normalizeSessionSummary));
      }
    } catch {
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { nextActions, activeSession, recentSessions, loading, apiOnline, reload };
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function StatusChip({ online }: { online: boolean }) {
  const status = mergeHomepageApiStatus([online ? 'ready' : 'offline']);
  const text = homepageApiBadgeText(status);
  return (
    <span className={`status-chip status-chip--${status}`} aria-label={text}>
      <span className="status-chip__dot" />
      {text}
    </span>
  );
}

function CommandBar({ apiOnline }: { apiOnline: boolean }) {
  return (
    <nav className="cmd-bar" aria-label="Quick navigation">
      <div className="cmd-bar__links">
        <Link to="/kanban" className="cmd-bar__link">Board</Link>
        <Link to="/huey" className="cmd-bar__link">Huey</Link>
        <Link to="/cod-status" className="cmd-bar__link">COD</Link>
        <Link to="/goals" className="cmd-bar__link">Goals</Link>
        <Link to="/avatar" className="cmd-bar__link">Avatar</Link>
      </div>
      <StatusChip online={apiOnline} />
    </nav>
  );
}

function RecentSessionsPanel({ sessions }: { sessions: SessionSummary[] }) {
  if (!sessions.length) return null;
  return (
    <section className="recent-sessions">
      <p className="focus-section-label">Recent sessions</p>
      <div className="recent-sessions__list">
        {sessions.map((s) => (
          <Link key={s.id} to={`/session/${s.id}`} className="recent-sessions__item">
            <span className="recent-sessions__title">
              {s.title ?? `Session ${s.id.slice(0, 6)}`}
            </span>
            <span className={`chip chip--${s.status}`}>{s.status}</span>
            <span className="recent-sessions__duration">
              {formatSessionDuration(s.startedAt, s.endedAt)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function GettingStartedCard() {
  return (
    <div className="focus-empty-card">
      <p className="focus-empty-card__title">Nothing ready to work on.</p>
      <p className="focus-empty-card__desc">Start by planning, picking tasks, or asking Huey what to do next.</p>
      <div className="focus-empty-card__actions">
        <Link to="/huey" className="pill pill--soft">Ask Huey →</Link>
        <Link to="/kanban" className="pill pill--soft">Open Board →</Link>
        <Link to="/goals" className="pill pill--ghost">View Goals →</Link>
      </div>
    </div>
  );
}


  session,
  onResume,
  onEnd,
}: {
  session: ActiveSession;
  onResume: () => void;
  onEnd: () => void;
}) {
  const elapsed = session.startedAt ? elapsedMinutes(session.startedAt) : null;
  const tasksDone = session.tasks?.filter((t) => t.status === "done").length ?? 0;
  const tasksTotal = session.tasks?.length ?? 0;

  return (
    <div className="session-banner">
      <div className="session-banner__info">
        <span className="session-banner__label">Session active</span>
        {session.title && (
          <span className="session-banner__title">{session.title}</span>
        )}
        <span className="session-banner__meta">
          {elapsed !== null && <>{elapsed}m elapsed · </>}
          {tasksTotal > 0 && (
            <>
              {tasksDone}/{tasksTotal} tasks
            </>
          )}
        </span>
      </div>
      <div className="session-banner__actions">
        <button className="session-banner__btn" onClick={onResume}>
          Resume
        </button>
        <button className="session-banner__btn session-banner__btn--end" onClick={onEnd}>
          End
        </button>
      </div>
    </div>
  );
}

function TaskChips({ task }: { task: NextAction }) {
  const days = dueDays(task);
  const blocked = isBlocked(task);
  return (
    <div className="na-card__chips">
      <span className="chip chip--score">◆ {formatScore(task.score)}</span>
      {task.effortScore > 0 && (
        <span className="chip chip--effort">e{task.effortScore}</span>
      )}
      {task.focusCost > 0 && (
        <span className="chip chip--focus">f{task.focusCost}</span>
      )}
      {task.estimatedTimeMin > 0 && (
        <span className="chip chip--time">{formatDuration(task.estimatedTimeMin)}</span>
      )}
      {days !== null && days <= 7 && (
        <span className={`chip chip--due${days <= 2 ? " chip--urgent" : ""}`}>
          {days <= 0 ? "due today" : `due ${days}d`}
        </span>
      )}
      {blocked && <span className="chip chip--blocked">⚑ blocked</span>}
      {task.tags
        .filter((t) => t !== "task")
        .slice(0, 2)
        .map((t) => (
          <span key={t} className="chip chip--tag">#{t}</span>
        ))}
    </div>
  );
}

function BestMoveCard({
  task,
  onStart,
  onSkip,
  onComplete,
  mutating,
}: {
  task: NextAction;
  onStart: (t: NextAction) => void;
  onSkip: (t: NextAction) => void;
  onComplete: (t: NextAction) => void;
  mutating: boolean;
}) {
  return (
    <article className={`na-card na-card--hero${isBlocked(task) ? " na-card--blocked" : ""}`}>
      <div className="na-card__main">
        <Link
          to={`/note/${encodeURIComponent(task.path)}`}
          className="na-card__title na-card__title--hero"
        >
          {task.title}
        </Link>
        {task.description && (
          <p className="na-card__desc">{task.description}</p>
        )}
        <TaskChips task={task} />
      </div>
      <div className="na-card__actions">
        <button
          className="na-card__btn na-card__btn--start"
          onClick={() => onStart(task)}
          disabled={mutating}
        >
          Start
        </button>
        <button
          className="na-card__btn na-card__btn--done"
          onClick={() => onComplete(task)}
          disabled={mutating}
          title="Mark done"
        >
          ✓
        </button>
        <button
          className="na-card__btn na-card__btn--skip"
          onClick={() => onSkip(task)}
          title="Skip"
        >
          ×
        </button>
      </div>
    </article>
  );
}

function NextActionCard({
  task,
  onStart,
  onSkip,
  onComplete,
  mutating,
}: {
  task: NextAction;
  onStart: (t: NextAction) => void;
  onSkip: (t: NextAction) => void;
  onComplete: (t: NextAction) => void;
  mutating: boolean;
}) {
  return (
    <article className={`na-card${isBlocked(task) ? " na-card--blocked" : ""}`}>
      <div className="na-card__main">
        <Link
          to={`/note/${encodeURIComponent(task.path)}`}
          className="na-card__title"
        >
          {task.title}
        </Link>
        <TaskChips task={task} />
      </div>
      <div className="na-card__actions">
        <button
          className="na-card__btn na-card__btn--start"
          onClick={() => onStart(task)}
          disabled={mutating}
        >
          Start
        </button>
        <button
          className="na-card__btn na-card__btn--done"
          onClick={() => onComplete(task)}
          disabled={mutating}
          title="Mark done"
        >
          ✓
        </button>
        <button
          className="na-card__btn na-card__btn--skip"
          onClick={() => onSkip(task)}
          title="Skip"
        >
          ×
        </button>
      </div>
    </article>
  );
}

function StartSessionPanel({
  tasks,
  budgetMin,
  onBudgetChange,
  onStart,
  onCancel,
}: {
  tasks: NextAction[];
  budgetMin: number;
  onBudgetChange: (min: number) => void;
  onStart: (taskIds: string[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(tasks.slice(0, 5).map((t) => t.id))
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="session-plan">
      <div className="session-plan__header">
        <span className="session-plan__title">Plan a session</span>
        <button className="session-plan__close" onClick={onCancel}>×</button>
      </div>
      <div className="session-plan__budget">
        <label className="session-plan__label">Duration</label>
        <div className="session-plan__budget-options">
          {[30, 60, 90, 120].map((m) => (
            <button
              key={m}
              className={`session-plan__budget-btn${budgetMin === m ? " session-plan__budget-btn--active" : ""}`}
              onClick={() => onBudgetChange(m)}
            >
              {formatDuration(m)}
            </button>
          ))}
        </div>
      </div>
      <div className="session-plan__tasks">
        <label className="session-plan__label">Tasks</label>
        {tasks.map((t) => (
          <label key={t.id} className="session-plan__task-row">
            <input
              type="checkbox"
              checked={selected.has(t.id)}
              onChange={() => toggle(t.id)}
            />
            <span className="session-plan__task-title">{t.title}</span>
            <span className="chip chip--score">◆ {formatScore(t.score)}</span>
          </label>
        ))}
      </div>
      <div className="session-plan__footer">
        <button
          className="na-card__btn na-card__btn--start"
          disabled={selected.size === 0}
          onClick={() => onStart(Array.from(selected))}
        >
          Start Session ({selected.size} task{selected.size !== 1 ? "s" : ""})
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

function FocusRoute() {
  const navigate = useNavigate();
  const { nextActions, activeSession, recentSessions, loading, apiOnline, reload } = useFocusData();
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false);
  const [budgetMin, setBudgetMin] = useState(60);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [endingSession, setEndingSession] = useState(false);

  const visible = useMemo(
    () => nextActions.filter((t) => !skipped.has(t.id)),
    [nextActions, skipped]
  );
  const best = visible[0] ?? null;
  const queue = visible.slice(1, 5);

  const startTask = async (task: NextAction) => {
    if (!task.path) return;
    setMutatingId(task.id);
    try {
      await apiFetch(
        `/api/v1/tasks/${encodeURIComponent(task.path)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in-progress" }),
        }
      );
      reload();
    } finally {
      setMutatingId(null);
    }
  };

  const completeTask = async (task: NextAction) => {
    if (!task.path) return;
    setMutatingId(task.id);
    try {
      await apiFetch(
        `/api/v1/tasks/${encodeURIComponent(task.path)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        }
      );
      reload();
    } finally {
      setMutatingId(null);
    }
  };

  const skipTask = (task: NextAction) => {
    setSkipped((prev) => new Set([...prev, task.id]));
  };

  const startSession = async (taskIds: string[]) => {
    try {
      const res = await apiFetch("/cod/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds, budgetMin }),
      });
      if (res.ok) {
        const body = await res.json();
        const id =
          body.structuredContent?.id ?? body.id ?? (body as Record<string, unknown>).sessionId;
        if (id) {
          await navigate({ to: `/session/${id}` });
          return;
        }
      }
    } catch {
      // fallback: reload focus view
    }
    setSessionPanelOpen(false);
    reload();
  };

  const endSession = async () => {
    if (!activeSession) return;
    setEndingSession(true);
    try {
      await apiFetch("/cod/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSession.id, status: "completed" }),
      });
      reload();
    } finally {
      setEndingSession(false);
    }
  };

  return (
    <main className="page focus-page">
      {activeSession && !endingSession && (
        <ActiveSessionBanner
          session={activeSession}
          onResume={() => navigate({ to: `/session/${activeSession.id}` })}
          onEnd={endSession}
        />
      )}

      <header className="focus-header">
        <div>
          <p className="eyebrow">Focus</p>
          <h1>What now?</h1>
        </div>
      </header>

      <CommandBar apiOnline={apiOnline} />

      {loading ? (
        <div className="focus-loading">Loading…</div>
      ) : visible.length === 0 ? (
        <GettingStartedCard />
      ) : (
        <>
          <section className="focus-hero">
            <p className="focus-section-label">Best move now</p>
            {best && (
              <BestMoveCard
                task={best}
                onStart={startTask}
                onSkip={skipTask}
                onComplete={completeTask}
                mutating={mutatingId === best.id}
              />
            )}
          </section>

          {queue.length > 0 && (
            <section className="focus-queue">
              <p className="focus-section-label">Up next</p>
              <div className="focus-queue__list">
                {queue.map((t) => (
                  <NextActionCard
                    key={t.id}
                    task={t}
                    onStart={startTask}
                    onSkip={skipTask}
                    onComplete={completeTask}
                    mutating={mutatingId === t.id}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="focus-session">
            {!sessionPanelOpen ? (
              <button
                className="focus-session-trigger"
                onClick={() => setSessionPanelOpen(true)}
              >
                + Plan a session
              </button>
            ) : (
              <StartSessionPanel
                tasks={visible.slice(0, 8)}
                budgetMin={budgetMin}
                onBudgetChange={setBudgetMin}
                onStart={startSession}
                onCancel={() => setSessionPanelOpen(false)}
              />
            )}
          </section>

          <RecentSessionsPanel sessions={recentSessions} />

          <details className="focus-backlog">
            <summary className="focus-backlog__summary">
              All tasks ({nextActions.length})
            </summary>
            <div className="focus-backlog__list">
              {nextActions.map((t) => (
                <Link
                  key={t.id}
                  to={`/note/${encodeURIComponent(t.path)}`}
                  className="focus-backlog__item"
                >
                  <span className="focus-backlog__title">{t.title}</span>
                  <span className="chip chip--score">◆ {formatScore(t.score)}</span>
                </Link>
              ))}
            </div>
          </details>
        </>
      )}
    </main>
  );
}
