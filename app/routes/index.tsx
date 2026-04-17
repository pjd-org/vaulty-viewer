import React, { useCallback, useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { homeSearchParams } from '../../src/lib/routes/search-params';
import { apiFetch, UnauthenticatedError } from '../../src/utils/api';
import {
  formatSessionDuration,
  elapsedMinutes,
  type ActiveSession,
  type SessionSummary,
  type NextAction,
} from '../../src/lib/focus-logic';
import {
  SectionHeader,
  WorkspaceScaffold,
  SoftPanel,
} from '../components/layout';
import {
  Badge,
  EmptyState,
  MetricCard,
  SurfaceChip,
  SurfaceLinkChip,
  SurfaceButtonChip,
} from '../components/ui';
import {
  getHomeSurfaceQueryOptions,
  useHomeSurface,
  useActiveSession,
  useRecentSessions,
  type PressureSignal,
  type Recommendation,
} from '../lib/viewer-adapter';
import { useMutationWithVerification } from '../hooks/use-mutation-with-verification';
import { updateTaskStatus } from '../lib/api/tasks';
import { CodSignalRow } from '../components/cod/CodSignalRow';
import { CodActionRow } from '../components/cod/CodActionRow';
import { useUIStore } from '../../src/store/ui';

const noteSearch = (path: string) => ({ p: path });

export const Route = createFileRoute('/')({
  validateSearch: homeSearchParams,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(getHomeSurfaceQueryOptions());
  },
  component: FocusRoute,
});

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function RecentSessionsPanel({ sessions }: { sessions: SessionSummary[] }) {
  if (!sessions.length) return null;
  return (
    <SoftPanel variant="utility" tone="muted" className="space-y-2 p-4">
      <SurfaceChip tone="accent" className="mb-3">
        Recent sessions
      </SurfaceChip>
      {sessions.map((s) => (
        <Link
          key={s.id}
          to={'/session/$id'}
          params={{ id: s.id }}
          className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-black/5 transition-colors"
        >
          <span className="text-sm font-medium text-slate-800 truncate">
            {s.title ?? `Session ${s.id.slice(0, 6)}`}
          </span>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className="text-xs text-slate-500">
              {formatSessionDuration(s.startedAt, s.endedAt)}
            </span>
            <span className="text-xs text-slate-500 capitalize">
              {s.status}
            </span>
          </div>
        </Link>
      ))}
    </SoftPanel>
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
  const [confirmingEnd, setConfirmingEnd] = React.useState(false);

  return (
    <SoftPanel
      variant="utility"
      tone="muted"
      className="flex items-center justify-between p-4"
    >
      <div className="flex flex-col gap-0.5">
        <SurfaceChip tone="accent" className="w-fit">
          Session active
        </SurfaceChip>
        {session.title && (
          <span className="text-sm font-medium text-slate-800">
            {session.title}
          </span>
        )}
        <span className="text-xs text-slate-500">
          {elapsed !== null && (
            <>
              {elapsed}m elapsed{tasksTotal > 0 ? ' · ' : ''}
            </>
          )}
          {tasksTotal > 0 && (
            <>
              {tasksDone}/{tasksTotal} tasks
            </>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <SurfaceButtonChip type="button" onClick={onResume} tone="accent">
          Resume
        </SurfaceButtonChip>
        {confirmingEnd ? (
          <>
            <SurfaceButtonChip
              type="button"
              onClick={() => {
                onEnd();
                setConfirmingEnd(false);
              }}
              tone="neutral"
            >
              Confirm end
            </SurfaceButtonChip>
            <SurfaceButtonChip
              type="button"
              onClick={() => setConfirmingEnd(false)}
              tone="muted"
            >
              Cancel
            </SurfaceButtonChip>
          </>
        ) : (
          <SurfaceButtonChip
            type="button"
            onClick={() => setConfirmingEnd(true)}
            tone="neutral"
          >
            End
          </SurfaceButtonChip>
        )}
      </div>
    </SoftPanel>
  );
}

const HOME_TASKS_PER_PAGE = 6;

function taskSeverityFromPriority(
  priority: number
): 'critical' | 'high' | 'normal' {
  if (priority >= 8) return 'critical';
  if (priority >= 5) return 'high';
  return 'normal';
}

function TaskSeverityBadge({
  priority,
  confidencePct,
}: {
  priority: number;
  confidencePct: number;
}) {
  const severity = taskSeverityFromPriority(priority);
  const variant =
    severity === 'critical'
      ? 'danger'
      : severity === 'high'
        ? 'warning'
        : 'muted';
  return (
    <Badge
      variant={variant}
      className="inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
    >
      <span>{severity}</span>
      <span className="text-[10px] normal-case tracking-normal">
        {confidencePct}%
      </span>
    </Badge>
  );
}

function HomeTaskCard({
  task,
  onStart,
  onBacklog,
  mutating,
  compact = false,
}: {
  task: NextAction;
  onStart: (taskPath: string) => void;
  onBacklog: (taskPath: string) => void;
  mutating: boolean;
  compact?: boolean;
}) {
  const confidencePct = Math.max(1, Math.min(99, Math.round(task.score * 10)));
  return (
    <SoftPanel variant="utility" tone="muted" noPadding className="shadow-sm">
      <div className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className={`line-clamp-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 font-semibold text-slate-800 ${compact ? 'text-xs' : 'text-sm'}`}
            >
              {task.title}
            </h3>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block size-2 rounded-full bg-slate-300" />
              <span>Task</span>
              <span className="inline-block size-2 rounded-full bg-slate-500" />
            </div>
          </div>
          <TaskSeverityBadge
            priority={task.priority}
            confidencePct={confidencePct}
          />
        </div>

        <div
          className={`flex flex-wrap items-center gap-2 ${compact ? 'mt-3' : 'mt-4'}`}
        >
          {task.path ? (
            <SurfaceLinkChip
              to="/note"
              search={noteSearch(task.path)}
              tone="neutral"
            >
              Open
            </SurfaceLinkChip>
          ) : (
            <span aria-disabled="true" className="cursor-not-allowed">
              Open
            </span>
          )}
          <SurfaceButtonChip
            type="button"
            onClick={() => onStart(task.path)}
            disabled={mutating}
            tone="accent"
          >
            {mutating ? 'Starting…' : 'Start'}
          </SurfaceButtonChip>
          <SurfaceButtonChip
            type="button"
            onClick={() => onBacklog(task.path)}
            disabled={mutating}
            tone="muted"
          >
            {mutating ? 'Updating…' : 'Backlog'}
          </SurfaceButtonChip>
        </div>
      </div>
    </SoftPanel>
  );
}

function BacklogStripCard({
  task,
  onStart,
  onBacklog,
  mutating,
}: {
  task: NextAction;
  onStart: (taskPath: string) => void;
  onBacklog: (taskPath: string) => void;
  mutating: boolean;
}) {
  return (
    <SoftPanel
      variant="utility"
      tone="muted"
      noPadding
      className="p-3 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-800">
          {task.title}
        </p>
        <div className="flex items-center gap-2">
          {task.path ? (
            <SurfaceLinkChip
              to="/note"
              search={noteSearch(task.path)}
              tone="neutral"
            >
              Open
            </SurfaceLinkChip>
          ) : null}
          <SurfaceButtonChip
            type="button"
            onClick={() => onStart(task.path)}
            disabled={mutating}
            tone="accent"
          >
            Start
          </SurfaceButtonChip>
          <SurfaceButtonChip
            type="button"
            onClick={() => onBacklog(task.path)}
            disabled={mutating}
            tone="muted"
          >
            Backlog
          </SurfaceButtonChip>
        </div>
      </div>
    </SoftPanel>
  );
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

function FocusRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { q, collection, session, snapshot, detailId } = Route.useSearch();
  const {
    data: surface,
    isLoading: surfaceLoading,
    error: surfaceError,
  } = useHomeSurface();
  const { data: activeSession } = useActiveSession();
  const { data: recentSessions } = useRecentSessions();
  const [endingSession, setEndingSession] = useState(false);
  const verification = useUIStore((state) => state.verification);

  const [endSessionError, setEndSessionError] = useState<string | null>(null);

  const endSession = async () => {
    if (!activeSession) return;
    setEndingSession(true);
    setEndSessionError(null);
    try {
      await apiFetch('/api/v1/cod/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          status: 'completed',
        }),
      });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        navigate({ to: '/login' });
        return;
      }
      setEndSessionError(
        err instanceof Error ? err.message : 'Failed to end session.'
      );
    } finally {
      setEndingSession(false);
    }
  };

  const deferMutation = useMutationWithVerification<boolean, string>({
    mutationFn: (taskPath: string) => updateTaskStatus(taskPath, 'backlog'),
    domain: 'work',
    actionId: 'home-defer',
  });
  const [pendingDeferPath, setPendingDeferPath] = useState<string | null>(null);
  const [pendingExecutePath, setPendingExecutePath] = useState<string | null>(
    null
  );

  const handleDefer = useCallback(
    (taskPath: string) => {
      setPendingDeferPath(taskPath);
      deferMutation.mutate(taskPath, {
        onSettled: () => setPendingDeferPath(null),
      });
    },
    [deferMutation]
  );

  const executeMutation = useMutationWithVerification<boolean, string>({
    mutationFn: (taskPath: string) => updateTaskStatus(taskPath, 'in-progress'),
    domain: 'work',
    actionId: 'home-execute',
  });

  const handleExecute = useCallback(
    (taskPath: string) => {
      setPendingExecutePath(taskPath);
      executeMutation.mutate(taskPath, {
        onSettled: () => setPendingExecutePath(null),
      });
    },
    [executeMutation]
  );

  // Hard-redirect to /login on 401 — return null while in-flight (D3)
  useEffect(() => {
    if (surfaceError instanceof UnauthenticatedError) {
      navigate({ to: '/login' });
    }
  }, [surfaceError, navigate]);

  if (surfaceError instanceof UnauthenticatedError) {
    return null;
  }

  const pressureBand = surface?.pressureBand ?? [];
  const decisionQueue = surface?.decisionQueue ?? [];
  const topTask: NextAction | undefined = (surface?.tasks ?? [])[0];
  const visiblePressureBand = pressureBand.filter(
    (item) => item.sourceId !== topTask?.id
  );
  const visibleDecisionQueue = decisionQueue.filter(
    (item) => item.mutationRef?.targetId !== topTask?.id
  );
  const snapshots = {
    automation: surface?.snapshots?.automation ?? [],
    knowledge: surface?.snapshots?.knowledge ?? [],
    portfolio: surface?.snapshots?.portfolio ?? [],
    bubble: surface?.snapshots?.bubble ?? [],
    health: surface?.snapshots?.health ?? [],
  };
  const taskCards = surface?.tasks ?? [];
  const featuredTask = taskCards[0];
  const backlogTasks = taskCards.slice(1);
  const searchEcho = [q, collection, session, snapshot, detailId].filter(
    (value): value is string => Boolean(value)
  );
  const [taskPage, setTaskPage] = useState(1);
  const totalTaskPages = Math.max(
    1,
    Math.ceil(backlogTasks.length / HOME_TASKS_PER_PAGE)
  );
  useEffect(() => {
    if (taskPage > totalTaskPages) setTaskPage(totalTaskPages);
  }, [taskPage, totalTaskPages]);
  const pageStart = (taskPage - 1) * HOME_TASKS_PER_PAGE;
  const pagedTasks = backlogTasks.slice(
    pageStart,
    pageStart + HOME_TASKS_PER_PAGE
  );

  const summaryItems = [
    {
      label: 'Pressure',
      value:
        surfaceLoading && !surface
          ? 'Loading'
          : String(visiblePressureBand.length),
      detail:
        visiblePressureBand.length > 0
          ? `${visiblePressureBand.length} active signal${visiblePressureBand.length !== 1 ? 's' : ''} — review below`
          : 'No pressure signals right now',
    },
    {
      label: 'Queue',
      value:
        surfaceLoading && !surface
          ? 'Loading'
          : String(visibleDecisionQueue.length),
      detail:
        visibleDecisionQueue.length > 0
          ? `${visibleDecisionQueue.length} ranked move${visibleDecisionQueue.length !== 1 ? 's' : ''} — act or defer`
          : 'Queue is clear',
    },
  ] as const;

  const snapshotMap = {
    automation: snapshots.automation.length,
    knowledge: snapshots.knowledge.length,
    portfolio: snapshots.portfolio.length,
    bubble: snapshots.bubble.length,
    health: snapshots.health.length,
  } as const;

  // ---------------------------------------------------------------------------
  // Signal / Recommendation callbacks
  // ---------------------------------------------------------------------------

  const handleSignalOpen = useCallback(
    (signal: PressureSignal) => {
      if (signal.sourceId) {
        navigate({ to: '/note', search: { p: signal.sourceId } });
      } else {
        navigate({ to: '/inbox' });
      }
    },
    [navigate]
  );

  const handleSignalAct = useCallback(
    (signal: PressureSignal) => {
      if (signal.taskPath) {
        handleExecute(signal.taskPath);
      }
    },
    [handleExecute]
  );

  const handleRecExecute = useCallback(
    (id: string) => {
      const rec = visibleDecisionQueue.find((r) => r.id === id);
      if (rec?.taskPath) handleExecute(rec.taskPath);
    },
    [visibleDecisionQueue, handleExecute]
  );

  const handleRecDefer = useCallback(
    (id: string) => {
      const rec = visibleDecisionQueue.find((r) => r.id === id);
      if (rec?.taskPath) handleDefer(rec.taskPath);
    },
    [visibleDecisionQueue, handleDefer]
  );

  // no-op for now
  const handleRecSimulate = useCallback((_id: string) => {}, []);

  // ---------------------------------------------------------------------------
  // Aside: snapshot grid + context tail
  // ---------------------------------------------------------------------------

  const asideContent = (
    <div className="space-y-5">
      {/* Snapshot grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/work"
          className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 hover:bg-white/85"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Pressure
          </p>
          <p className="mt-0.5 text-[1.65rem] leading-none font-semibold tabular-nums text-slate-800">
            {visiblePressureBand.length}
          </p>
          <div className="mt-2 h-px w-16 bg-slate-300/80" />
        </Link>
        <Link
          to="/actions"
          search={{
            sort: undefined,
            simulatableOnly: undefined,
            selectedId: undefined,
          }}
          className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 hover:bg-white/85"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Queue
          </p>
          <p className="mt-0.5 text-[1.65rem] leading-none font-semibold tabular-nums text-slate-800">
            {visibleDecisionQueue.length}
          </p>
          <div className="mt-2 h-px w-16 bg-slate-300/80" />
        </Link>
        <Link
          to="/portfolio"
          search={{ tab: undefined, selectedId: undefined }}
          className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 hover:bg-white/85"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Portfolio
          </p>
          <p className="mt-0.5 text-[1.65rem] leading-none font-semibold tabular-nums text-slate-800">
            {snapshotMap.portfolio}
          </p>
          <div className="mt-2 h-px w-16 bg-slate-300/80" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/automation"
          search={{
            tab: undefined,
            subtab: undefined,
            selectedId: undefined,
            autoRefresh: undefined,
          }}
          className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 hover:bg-white/85"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Automation
          </p>
          <p className="mt-0.5 text-2xl font-semibold leading-none text-slate-800">
            {snapshotMap.automation}
          </p>
          <div className="mt-2 h-px w-14 bg-slate-300/80" />
        </Link>
        <Link
          to="/bubble"
          search={{ tab: undefined, selectedId: undefined }}
          className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 hover:bg-white/85"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Bubble
          </p>
          <p className="mt-0.5 text-2xl font-semibold leading-none text-slate-800">
            {snapshotMap.bubble}
          </p>
          <div className="mt-2 h-px w-14 bg-slate-300/80" />
        </Link>
        <Link
          to="/knowledge"
          className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 hover:bg-white/85"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Knowledge
          </p>
          <p className="mt-0.5 text-2xl font-semibold leading-none text-slate-800">
            {snapshotMap.knowledge}
          </p>
          <div className="mt-2 h-px w-14 bg-slate-300/80" />
        </Link>
        <Link
          to="/health"
          search={{ tab: undefined, selectedId: undefined }}
          className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 hover:bg-white/85"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Health
          </p>
          <p className="mt-0.5 text-2xl font-semibold leading-none text-slate-800">
            {snapshotMap.health}
          </p>
          <div className="mt-2 h-px w-14 bg-slate-300/80" />
        </Link>
      </div>

      {/* Context tail placeholder */}
      <div className="rounded-[18px] border border-slate-200 bg-slate-50/60 px-4 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-2">
          Context Tail
        </p>
        {(surface?.contextTail ?? []).length > 0 ? (
          <div className="space-y-2">
            {(surface?.contextTail ?? []).map((item) => (
              <p
                key={item.id}
                className="text-xs text-slate-600 leading-relaxed"
              >
                {item.title}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 leading-relaxed">
            Context candidates will surface here.
          </p>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Primary column
  // ---------------------------------------------------------------------------

  const primaryContent = (
    <div className="space-y-6">
      {surfaceError && !surface ? (
        <EmptyState
          title="Home surface unavailable."
          description="The adapter query failed to load."
        />
      ) : null}

      {/* Section 1: Pressure Band */}
      <section className="space-y-3">
        <SectionHeader
          title="Pressure Band"
          subtitle="Active signals surfaced by COD."
        />
        {visiblePressureBand.length > 0 ? (
          <CodSignalRow
            signals={visiblePressureBand}
            onOpen={handleSignalOpen}
            onAct={handleSignalAct}
          />
        ) : (
          <EmptyState
            title="No pressure signals."
            description="All clear — no active blockers or risks right now."
          />
        )}
      </section>

      {/* Section 2: Decision Queue */}
      <section className="space-y-3">
        <SectionHeader
          title="Decision Queue"
          subtitle="Ranked recommendations — act, simulate, or defer."
        />
        {visibleDecisionQueue.length > 0 ? (
          <CodActionRow
            recommendations={visibleDecisionQueue}
            onExecute={handleRecExecute}
            onSimulate={handleRecSimulate}
            onDefer={handleRecDefer}
          />
        ) : (
          <EmptyState
            title="Decision queue is clear."
            description="No ranked moves right now."
          />
        )}
      </section>

      {/* Section 3: Verification Rail */}
      <section className="space-y-3">
        <SectionHeader
          title="Verification Rail"
          subtitle="Outcome verification for recent actions."
        />
        {verification.phase === 'pending' && (
          <p className="text-sm text-sky-600">Verifying…</p>
        )}
        {verification.phase === 'failed' && (
          <p className="text-sm text-red-400">Verification failed.</p>
        )}
      </section>

      {/* Section 4: Immediate Interventions (task backlog) */}
      {taskCards.length > 0 ? (
        <section className="space-y-4">
          <div className="space-y-4">
            <article className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white/85 p-5 pl-7 shadow-sm">
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-b from-fuchsia-300 via-violet-500 to-purple-600"
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Immediate Interventions
              </p>
              {featuredTask ? (
                <>
                  <div className="mt-4 mx-auto w-full max-w-[560px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="line-clamp-2 text-lg font-semibold text-slate-800">
                      {featuredTask.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="inline-block size-2 rounded-full bg-slate-400" />
                        <span>Task</span>
                      </div>
                      <TaskSeverityBadge
                        priority={featuredTask.priority}
                        confidencePct={Math.max(
                          1,
                          Math.min(99, Math.round(featuredTask.score * 10))
                        )}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {featuredTask.path ? (
                      <Link
                        to="/note"
                        search={{ p: featuredTask.path }}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-50"
                      >
                        Open
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="cursor-not-allowed rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
                      >
                        Open
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleExecute(featuredTask.path)}
                      disabled={pendingExecutePath === featuredTask.path}
                      className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 hover:bg-sky-100 disabled:opacity-50"
                    >
                      {pendingExecutePath === featuredTask.path
                        ? 'Starting…'
                        : 'Start'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDefer(featuredTask.path)}
                      disabled={pendingDeferPath === featuredTask.path}
                      className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                    >
                      {pendingDeferPath === featuredTask.path
                        ? 'Updating…'
                        : 'Backlog'}
                    </button>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No best move available."
                  description="When tasks surface, the top recommendation appears here."
                />
              )}
            </article>
          </div>
          <section className="space-y-3">
            <SectionHeader
              title="Immediate Interventions"
              subtitle="Prioritized follow-up cards."
            />
            {pagedTasks.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {pagedTasks.map((task, idx) =>
                  idx < 2 ? (
                    <HomeTaskCard
                      key={task.id}
                      task={task}
                      onStart={handleExecute}
                      onBacklog={handleDefer}
                      mutating={
                        pendingExecutePath === task.path ||
                        pendingDeferPath === task.path
                      }
                      compact
                    />
                  ) : (
                    <BacklogStripCard
                      key={task.id}
                      task={task}
                      onStart={handleExecute}
                      onBacklog={handleDefer}
                      mutating={
                        pendingExecutePath === task.path ||
                        pendingDeferPath === task.path
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <EmptyState
                title="No backlog candidates."
                description="Additional surfaced tasks will appear here."
              />
            )}
          </section>
          {backlogTasks.length > 0 && totalTaskPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/65 px-3 py-2">
              <button
                type="button"
                onClick={() => setTaskPage((p) => Math.max(1, p - 1))}
                disabled={taskPage === 1}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 disabled:opacity-40"
              >
                Prev
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                Page {taskPage} / {totalTaskPages}
              </p>
              <button
                type="button"
                onClick={() =>
                  setTaskPage((p) => Math.min(totalTaskPages, p + 1))
                }
                disabled={taskPage === totalTaskPages}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>
      ) : null}

      {/* Recent sessions at the bottom of primary */}
      {recentSessions && recentSessions.length > 0 ? (
        <RecentSessionsPanel sessions={recentSessions} />
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6">
      {activeSession && !endingSession ? (
        <>
          <ActiveSessionBanner
            session={activeSession}
            onResume={() =>
              navigate({ to: '/session/$id', params: { id: activeSession.id } })
            }
            onEnd={endSession}
          />
          {endSessionError && (
            <p className="text-sm text-red-400" role="alert">
              {endSessionError}
            </p>
          )}
        </>
      ) : activeSession && endingSession ? (
        <p className="text-sm text-slate-400" role="status">
          Ending session…
        </p>
      ) : null}

      <WorkspaceScaffold
        title="Home"
        subtitle={
          searchEcho.length
            ? `Command center · ${searchEcho.join(' · ')}`
            : 'Command center — system state, best move, and live modules.'
        }
        statusLine={undefined}
        nextAction={undefined}
        summaryItems={summaryItems}
        heroContent={undefined}
        primaryTitle="Today's Focus"
        primarySubtitle="Best move, pressure signals, and ranked recommendations."
        primary={primaryContent}
        asideTitle="Snapshot Grid"
        asideSubtitle="Live module status"
        aside={asideContent}
      />
    </div>
  );
}
