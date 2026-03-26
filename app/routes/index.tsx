import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { apiFetch } from '../../src/utils/api';
import {
  normalizeNextAction,
  normalizeSessionSummary,
  formatSessionDuration,
  formatScore,
  elapsedMinutes,
  type NextAction,
  type ActiveSession,
  type SessionSummary,
} from '../../src/lib/focus-logic';
import { PageFrame, SectionHeader } from '../components/layout';
import { EmptyState, PrimaryButton, SecondaryButton } from '../components/ui';
import {
  BestMoveCard,
  TaskMiniCard,
  QuickRouteGrid,
  SessionPlannerCard,
} from '../components/home';

export const Route = createFileRoute('/')({
  component: FocusRoute,
});

// ---------------------------------------------------------------------------
// Data hook
// ---------------------------------------------------------------------------

function useFocusData() {
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null
  );
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [actionsRes, sessionsRes, recentRes] = await Promise.all([
        apiFetch('/api/v1/tasks/next-actions?max=10'),
        apiFetch('/api/v1/sessions?status=active&limit=1'),
        apiFetch('/api/v1/sessions?limit=3'),
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
        setActiveSession(sessions.find((s) => s.status === 'active') ?? null);
      }
      if (recentRes.ok) {
        const body = await recentRes.json();
        const raw: unknown[] =
          body.structuredContent?.sessions ?? body.sessions ?? [];
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

  return {
    nextActions,
    activeSession,
    recentSessions,
    loading,
    apiOnline,
    reload,
  };
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function RecentSessionsPanel({ sessions }: { sessions: SessionSummary[] }) {
  if (!sessions.length) return null;
  return (
    <div className="rounded-[28px] border border-neutral-200 bg-surface p-4 space-y-2">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
        Recent sessions
      </p>
      {sessions.map((s) => (
        <Link
          key={s.id}
          to={'/session/$id'}
          params={{ id: s.id }}
          className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-neutral-50 transition-colors"
        >
          <span className="text-sm font-medium text-neutral-900 truncate">
            {s.title ?? `Session ${s.id.slice(0, 6)}`}
          </span>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className="text-xs text-neutral-400">
              {formatSessionDuration(s.startedAt, s.endedAt)}
            </span>
            <span className="text-xs text-neutral-500 capitalize">{s.status}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ActiveSessionBanner({
  session,
  onResume,
  onEnd,
}: {
  session: ActiveSession;
  onResume: () => void;
  onEnd: () => void;
}) {
  const elapsed = session.startedAt ? elapsedMinutes(session.startedAt) : null;
  const tasksDone =
    session.tasks?.filter((t) => t.status === 'done').length ?? 0;
  const tasksTotal = session.tasks?.length ?? 0;

  return (
    <div className="rounded-[28px] bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
          Session active
        </span>
        {session.title && (
          <span className="text-sm font-medium text-neutral-900">{session.title}</span>
        )}
        <span className="text-xs text-neutral-500">
          {elapsed !== null && <>{elapsed}m elapsed{tasksTotal > 0 ? ' · ' : ''}</>}
          {tasksTotal > 0 && <>{tasksDone}/{tasksTotal} tasks</>}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <PrimaryButton onClick={onResume}>Resume</PrimaryButton>
        <SecondaryButton onClick={onEnd}>End</SecondaryButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

function FocusRoute() {
  const navigate = useNavigate();
  const {
    nextActions,
    activeSession,
    recentSessions,
    loading,
    reload,
  } = useFocusData();
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
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
      await apiFetch(`/api/v1/tasks/${encodeURIComponent(task.path)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in-progress' }),
      });
      reload();
    } finally {
      setMutatingId(null);
    }
  };

  const completeTask = async (task: NextAction) => {
    if (!task.path) return;
    setMutatingId(task.id);
    try {
      await apiFetch(`/api/v1/tasks/${encodeURIComponent(task.path)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      reload();
    } finally {
      setMutatingId(null);
    }
  };

  const skipTask = (task: NextAction) => {
    setSkipped((prev) => new Set([...prev, task.id]));
  };

  const startSession = async (taskIds: string[], budgetMin: number) => {
    try {
      const res = await apiFetch('/cod/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds, budgetMin }),
      });
      if (res.ok) {
        const body = await res.json();
        const id =
          body.structuredContent?.id ??
          body.id ??
          (body as Record<string, unknown>).sessionId;
        if (id) {
          await navigate({ to: `/session/${id}` });
          return;
        }
      }
    } catch {
      // fallback: reload focus view
    }
    reload();
  };

  const endSession = async () => {
    if (!activeSession) return;
    setEndingSession(true);
    try {
      await apiFetch('/cod/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          status: 'completed',
        }),
      });
      reload();
    } finally {
      setEndingSession(false);
    }
  };

  return (
    <main className="space-y-6">
      {activeSession && !endingSession && (
        <ActiveSessionBanner
          session={activeSession}
          onResume={() =>
            navigate({ to: '/session/$id', params: { id: activeSession.id } })
          }
          onEnd={endSession}
        />
      )}

      <PageFrame title="What now?">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-sm text-neutral-400">Loading…</span>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon="✅"
            title="Nothing ready to work on."
            description="Start by planning, picking tasks, or asking Huey what to do next."
            action={
              <div className="flex items-center gap-3">
                <Link to="/huey">
                  <PrimaryButton>Ask Huey →</PrimaryButton>
                </Link>
                <Link to="/projects">
                  <SecondaryButton>View Projects →</SecondaryButton>
                </Link>
              </div>
            }
          />
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Hero column */}
            <div className="col-span-12 lg:col-span-8">
              <SectionHeader title="Best move now" />
              {best && (
                <BestMoveCard
                  task={best}
                  onStart={startTask}
                  onSkip={skipTask}
                  onComplete={completeTask}
                  mutating={mutatingId === best.id}
                />
              )}

              {queue.length > 0 && (
                <>
                  <SectionHeader title="Up next" className="mt-6" />
                  <div className="space-y-3">
                    {queue.slice(0, 3).map((t) => (
                      <TaskMiniCard
                        key={t.id}
                        task={t}
                        onStart={startTask}
                        onComplete={completeTask}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Side column */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <SectionHeader title="Quick access" />
              <QuickRouteGrid />
              <SessionPlannerCard tasks={visible} onStart={startSession} />
              {recentSessions.length > 0 && (
                <RecentSessionsPanel sessions={recentSessions} />
              )}
            </div>
          </div>
        )}
      </PageFrame>

      <details className="rounded-[28px] border border-neutral-200 bg-surface p-4 text-sm">
        <summary className="text-xs text-neutral-400 cursor-pointer select-none">
          All tasks ({nextActions.length}) — debug
        </summary>
        <div className="mt-3 space-y-1">
          {nextActions.map((t) => (
            <Link
              key={t.id}
              to="/note"
              search={{ p: t.path }}
              className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <span className="text-sm text-neutral-700 truncate">{t.title}</span>
              <span className="text-xs text-neutral-400 shrink-0 ml-3">
                {formatScore(t.score)}
              </span>
            </Link>
          ))}
        </div>
      </details>
    </main>
  );
}
