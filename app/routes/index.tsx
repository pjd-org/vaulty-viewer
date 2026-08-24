import React, { useCallback, useEffect, useState } from 'react';
import {
  createFileRoute,
  Link,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { homeSearchParams } from '../../src/lib/routes/search-params';
import { apiFetch, UnauthenticatedError } from '../../src/utils/api';
import { buildAuthTransitionPath } from '../../src/lib/auth-transition';
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
import { Badge } from '@/app/components/ui/badge';
import {
  EmptyState,
  MetricCard,
  SurfaceChip,
  SurfaceLinkChip,
  SurfaceButtonChip,
  VaultyLogo,
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
import { SurfaceEntryGrid, type SurfaceEntryTile } from '../components/home/SurfaceEntryGrid';
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
    <SoftPanel
      variant="utility"
      tone="muted"
      className="flex flex-col gap-2 p-4"
    >
      <SurfaceChip tone="accent" className="mb-3">
        Recent sessions
      </SurfaceChip>
      {sessions.map((s) => (
        <Link
          key={s.id}
          to={'/session/$id'}
          params={{ id: s.id }}
          className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-muted/60"
        >
          <span className="truncate text-sm font-medium text-foreground">
            {s.title ?? `Session ${s.id.slice(0, 6)}`}
          </span>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className="text-xs text-muted-foreground">
              {formatSessionDuration(s.startedAt, s.endedAt)}
            </span>
            <span className="text-xs capitalize text-muted-foreground">
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
          <span className="text-sm font-medium text-foreground">
            {session.title}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
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
              className={`line-clamp-2 rounded-md border border-border bg-muted/40 px-2 py-1.5 font-semibold text-foreground ${compact ? 'text-xs' : 'text-sm'}`}
            >
              {task.title}
            </h3>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block size-2 rounded-full bg-border" />
              <span>Task</span>
              <span className="inline-block size-2 rounded-full bg-muted-foreground" />
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
        <p className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted/40 px-2 py-1 text-sm font-semibold text-foreground">
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
  const location = useLocation();
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
        navigate({
          to: buildAuthTransitionPath(
            `${location.pathname}${location.search}`
          ),
        });
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
      navigate({
        to: buildAuthTransitionPath(`${location.pathname}${location.search}`),
        replace: true,
      });
    }
  }, [location.pathname, location.search, navigate, surfaceError]);

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
  const immediateActions = surface?.immediateActions ?? [];
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
    pressure: visiblePressureBand.length,
    queue: visibleDecisionQueue.length,
    automation: snapshots.automation.length,
    knowledge: snapshots.knowledge.length,
    portfolio: snapshots.portfolio.length,
    bubble: snapshots.bubble.length,
    health: snapshots.health.length,
  } as const;

  const pressureTile: SurfaceEntryTile = {
    label: 'Pressure',
    role: 'Active blockers and pressure signals',
    count: snapshotMap.pressure,
    to: '/work',
    nextStep: 'Review active blockers',
  };

  const queueTile: SurfaceEntryTile = {
    label: 'Queue',
    role: 'Ranked recommendations ready to execute',
    count: snapshotMap.queue,
    to: '/actions',
    search: {
      sort: undefined,
      simulatableOnly: undefined,
      selectedId: undefined,
    },
    nextStep: 'Execute or defer top move',
  };

  const portfolioTile: SurfaceEntryTile = {
    label: 'Portfolio',
    role: 'Cross-project pressure summary',
    count: snapshotMap.portfolio,
    to: '/portfolio',
    search: { tab: undefined, selectedId: undefined },
    nextStep: 'Inspect impacted projects',
  };

  const snapshotTiles: SurfaceEntryTile[] = [
    pressureTile,
    queueTile,
    portfolioTile,
    {
      label: 'Automation',
      role: 'Agents, runs, and scheduler load',
      count: snapshotMap.automation,
      to: '/automation',
      search: {
        tab: undefined,
        subtab: undefined,
        selectedId: undefined,
        autoRefresh: undefined,
      },
      nextStep: 'Review active runs',
    },
    {
      label: 'Bubble',
      role: 'Runtime pressure and reward lanes',
      count: snapshotMap.bubble,
      to: '/bubble',
      search: { tab: undefined, selectedId: undefined },
      nextStep: 'Check momentum and rewards',
    },
    {
      label: 'Knowledge',
      role: 'Vault notes and retrieval context',
      count: snapshotMap.knowledge,
      to: '/knowledge',
      nextStep: 'Review supporting context',
    },
    {
      label: 'Health',
      role: 'System diagnostics and checks',
      count: snapshotMap.health,
      to: '/health',
      search: { tab: undefined, selectedId: undefined },
      nextStep: 'Inspect health status',
    },
  ];

  const heroSnapshotTiles: SurfaceEntryTile[] = [
    pressureTile,
    queueTile,
    portfolioTile,
  ];

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
    <div className="flex flex-col gap-5">
      {/* Snapshot grid */}
      <SurfaceEntryGrid
        tiles={snapshotTiles}
        loading={surfaceLoading && !surface}
      />

      {/* Context tail placeholder */}
      <div className="rounded-[18px] border border-border bg-muted/40 px-4 py-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Context Tail
        </p>
        {(surface?.contextTail ?? []).length > 0 ? (
          <div className="flex flex-col gap-2">
            {(surface?.contextTail ?? []).map((item) => (
              <p
                key={item.id}
                className="text-xs leading-relaxed text-muted-foreground"
              >
                {item.title}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
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
    <div className="flex flex-col gap-6">
      {surfaceError && !surface ? (
        <EmptyState
          title="Home surface unavailable."
          description="The adapter query failed to load."
        />
      ) : null}

      {/* Section 1: Pressure Band */}
      <section className="flex flex-col gap-3">
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
            action={
              <Link
                to="/work"
                className="inline-flex rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
              >
                Open Work
              </Link>
            }
          />
        )}
      </section>

      {/* Section 2: Decision Queue */}
      <section className="flex flex-col gap-3">
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
            action={
              <Link
                to="/actions"
                search={{
                  sort: undefined,
                  simulatableOnly: undefined,
                  selectedId: undefined,
                }}
                className="inline-flex rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
              >
                Open Actions
              </Link>
            }
          />
        )}
      </section>

      {/* Section 3: Verification Rail */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Verification Rail"
          subtitle="Outcome verification for recent actions."
        />
        {(surface?.verificationRail ?? []).length > 0 ? (
          <div className="flex flex-col gap-2">
            {(surface?.verificationRail ?? []).map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-3 rounded-[16px] border border-border bg-card/70 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {entry.entity?.title ?? entry.summary}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {entry.summary}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    entry.status === 'success'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : entry.status === 'warning'
                        ? 'bg-amber-500/15 text-amber-400'
                        : entry.status === 'failed'
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        ) : verification.phase === 'pending' ? (
          <p className="text-sm text-primary">Verifying…</p>
        ) : verification.phase === 'failed' ? (
          <p className="text-sm text-destructive">Verification failed.</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            No verified actions yet — outcomes appear here after execution.
          </p>
        )}
      </section>

      {/* Section 4: Immediate Interventions (task backlog) */}
      {taskCards.length > 0 ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <article className="relative overflow-hidden rounded-[24px] border border-border bg-card/85 p-5 pl-7 shadow-sm">
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-b from-fuchsia-300 via-violet-500 to-purple-600"
              />
              {/* Logo link + Snapshot grid */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Link
                    to="/"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--a-sky),var(--a-mint))] text-[#0f172a] shadow-[0_10px_24px_rgba(51,95,255,0.28)] hover:opacity-90"
                  >
                    <VaultyLogo className="h-5 w-5" />
                  </Link>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Immediate Interventions
                  </p>
                </div>
                <div className="w-full max-w-[520px]">
                  <SurfaceEntryGrid
                    tiles={heroSnapshotTiles}
                    loading={surfaceLoading && !surface}
                    columns={3}
                  />
                </div>
              </div>
              {featuredTask ? (
                <>
                  <div className="mx-auto mt-4 w-full max-w-[560px] rounded-2xl border border-border bg-muted/40 p-4">
                    <p className="line-clamp-2 text-lg font-semibold text-foreground">
                      {featuredTask.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-block size-2 rounded-full bg-muted-foreground" />
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
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground hover:bg-muted/60"
                      >
                        Open
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="cursor-not-allowed rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        Open
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleExecute(featuredTask.path)}
                      disabled={pendingExecutePath === featuredTask.path}
                      className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary hover:bg-primary/20 disabled:opacity-50"
                    >
                      {pendingExecutePath === featuredTask.path
                        ? 'Starting…'
                        : 'Start'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDefer(featuredTask.path)}
                      disabled={pendingDeferPath === featuredTask.path}
                      className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-warning hover:bg-warning/20 disabled:opacity-50"
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
                action={
                  <Link
                    to="/inbox"
                    className="inline-flex rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
                  >
                    Review Inbox
                  </Link>
                }
              />
              )}
            </article>
          </div>
          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Immediate Interventions"
              subtitle="Prioritized follow-up cards."
            />
            {immediateActions.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {immediateActions.map((rec: Recommendation) => {
                  const target = rec.taskPath ?? String(
                    rec.mutationRef?.targetId ?? rec.id,
                  );
                  const mutating =
                    pendingExecutePath === target ||
                    pendingDeferPath === target;
                  return (
                    <article
                      key={rec.id}
                      className="relative overflow-hidden rounded-[20px] border border-border bg-card/85 p-4 pl-6 shadow-sm"
                    >
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-1.5 rounded-l-[20px] bg-[var(--vault-accent)] opacity-70"
                      />
                      <p className="text-sm font-semibold text-foreground">
                        {rec.title}
                      </p>
                      {rec.whyNow && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {rec.whyNow}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExecute(target)}
                          disabled={mutating || !rec.taskPath}
                          className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
                        >
                          {pendingExecutePath === target ? 'Executing…' : 'Execute'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDefer(target)}
                          disabled={mutating}
                          className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning hover:bg-warning/20 disabled:opacity-50"
                        >
                          {pendingDeferPath === target ? 'Deferring…' : 'Defer'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No low-friction interventions."
                description="High-reversibility moves surface here when the queue produces them."
                action={
                  <Link
                    to="/actions"
                    search={{
                      sort: undefined,
                      simulatableOnly: undefined,
                      selectedId: undefined,
                    }}
                    className="inline-flex rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
                  >
                    Open Actions
                  </Link>
                }
              />
            )}
          </section>
          {backlogTasks.length > 0 && totalTaskPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-card/65 px-3 py-2">
              <button
                type="button"
                onClick={() => setTaskPage((p) => Math.max(1, p - 1))}
                disabled={taskPage === 1}
                className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground disabled:opacity-40"
              >
                Prev
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Page {taskPage} / {totalTaskPages}
              </p>
              <button
                type="button"
                onClick={() =>
                  setTaskPage((p) => Math.min(totalTaskPages, p + 1))
                }
                disabled={taskPage === totalTaskPages}
                className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground disabled:opacity-40"
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
    <div className="flex flex-col gap-6">
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
            <p className="text-sm text-destructive" role="alert">
              {endSessionError}
            </p>
          )}
        </>
      ) : activeSession && endingSession ? (
        <p className="text-sm text-muted-foreground" role="status">
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
