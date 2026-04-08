import React, { useCallback, useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { homeSearchParams } from '../../src/lib/routes/search-params';
import { apiFetch, UnauthenticatedError } from '../../src/utils/api';
import {
  formatSessionDuration,
  formatScore,
  elapsedMinutes,
  type ActiveSession,
  type SessionSummary,
  type NextAction,
} from '../../src/lib/focus-logic';
import { SectionHeader, WorkspaceScaffold } from '../components/layout';
import { EmptyState, PrimaryButton, SecondaryButton } from '../components/ui';
import { CodSignalRow } from '../components/cod/CodSignalRow';
import { BestMoveCard } from '../components/home/BestMoveCard';
import {
  SurfaceEntryGrid,
  type SurfaceEntryTile,
} from '../components/home/SurfaceEntryGrid';
import {
  getHomeSurfaceQueryOptions,
  useHomeSurface,
  useActiveSession,
  useRecentSessions,
} from '../lib/viewer-adapter';
import { useUIStore } from '../../src/store/ui';
import { useMutationWithVerification } from '../hooks/use-mutation-with-verification';
import { updateTaskStatus } from '../lib/api/tasks';

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
    <div className="rounded-[28px] border border-slate-200 bg-black/3 p-4 space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Recent sessions
      </p>
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
  const [confirmingEnd, setConfirmingEnd] = React.useState(false);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-black/3 p-4 flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-sky-600 uppercase tracking-wide">
          Session active
        </span>
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
        <PrimaryButton onClick={onResume}>Resume</PrimaryButton>
        {confirmingEnd ? (
          <>
            <SecondaryButton
              onClick={() => {
                onEnd();
                setConfirmingEnd(false);
              }}
            >
              Confirm end
            </SecondaryButton>
            <SecondaryButton onClick={() => setConfirmingEnd(false)}>
              Cancel
            </SecondaryButton>
          </>
        ) : (
          <SecondaryButton onClick={() => setConfirmingEnd(true)}>
            End
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}

/** Returns true if the text is a known boilerplate/templated filler string. */
function isTemplatedText(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  // Exact known boilerplate strings from the API
  const BOILERPLATE = [
    'It is short enough to create momentum without expensive context switching.',
    'Completing this task will reduce the backlog and improve project velocity.',
    'This action has a low effort cost and can be completed quickly.',
  ];
  return BOILERPLATE.includes(trimmed);
}

/** Humanizes internal action IDs like "action:task-123456789-my-task-md" → "My Task". */
function humanizeActionId(actionId: string): string {
  const stripped = actionId.replace(/^[a-z]+:/i, ''); // remove "action:" prefix
  const noTimestamp = stripped.replace(/\b\d{10,}\b-?/g, ''); // remove 13-digit timestamps
  const noExt = noTimestamp.replace(/-md$/, ''); // strip trailing -md
  const label = noExt.replace(/[-_]+/g, ' ').trim();
  return label ? label.replace(/\b\w/g, (c) => c.toUpperCase()) : actionId;
}

function SignalWorkLink({ sourceId }: { sourceId: string }) {
  return (
    <Link
      to="/work"
      search={{ selectedId: sourceId }}
      className="inline-flex items-center gap-1 rounded-full border border-sky-600/40 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 transition-colors hover:border-sky-600/70 hover:bg-sky-100 hover:text-sky-800"
    >
      Open work
    </Link>
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

  // Hooks must all be called unconditionally — before any early return.
  const verificationPhase = useUIStore((s) => s.verification.phase);

  const deferMutation = useMutationWithVerification<boolean, string>({
    mutationFn: (taskPath: string) => updateTaskStatus(taskPath, 'backlog'),
    domain: 'work',
    actionId: 'home-defer',
  });
  const [pendingDeferPath, setPendingDeferPath] = useState<string | null>(null);

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

  const completeMutation = useMutationWithVerification<boolean, string>({
    mutationFn: (taskPath: string) => updateTaskStatus(taskPath, 'completed'),
    domain: 'work',
    actionId: 'home-complete',
  });

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
  const verificationRail = surface?.verificationRail ?? [];

  // Derive top severity for the Home status line
  const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 } as const;
  type Severity = keyof typeof SEVERITY_RANK;
  const topSeverity: Severity | null =
    pressureBand.length > 0
      ? pressureBand.reduce<Severity | null>((best, item) => {
          const s = item.severity as Severity;
          if (!best) return s;
          return (SEVERITY_RANK[s] ?? 0) > (SEVERITY_RANK[best] ?? 0)
            ? s
            : best;
        }, null)
      : null;

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
  const contextTail = surface?.contextTail ?? [];
  const searchEcho = [q, collection, session, snapshot, detailId].filter(
    (value): value is string => Boolean(value)
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
    {
      label: 'Verification',
      value:
        surfaceLoading && !surface
          ? 'Loading'
          : verificationRail.some((item) => item.status !== 'pending')
            ? 'Active'
            : 'Ready',
      detail: verificationRail.some((item) => item.status !== 'pending')
        ? 'Results to review in the rail below'
        : 'No pending feedback — loop is idle',
    },
  ] as const;

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
        statusLine={
          surface
            ? [
                `${visiblePressureBand.length} pressure signal${visiblePressureBand.length !== 1 ? 's' : ''}`,
                `${visibleDecisionQueue.length} queued decision${visibleDecisionQueue.length !== 1 ? 's' : ''}`,
                `verification ${verificationRail.some((i) => i.status !== 'pending') ? 'active' : 'ready'}`,
                topSeverity === 'critical'
                  ? '⚠ CRITICAL signals active'
                  : topSeverity === 'high'
                    ? '⚠ High-severity pressure'
                    : null,
              ]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        nextAction={
          topTask
            ? `→ Best move: "${topTask.title}" — start it, skip it, or inspect in Work.`
            : visibleDecisionQueue.length > 0
              ? '→ Review queued decisions below and act or defer.'
              : '→ No immediate moves. Check Inbox or review pressure signals.'
        }
        summaryItems={summaryItems}
        primaryTitle="Today's Focus"
        primarySubtitle="Best move, pressure signals, and ranked recommendations."
        primary={
          <div className="space-y-6">
            {surfaceError && !surface ? (
              <EmptyState
                title="Home surface unavailable."
                description="The adapter query failed to load."
              />
            ) : null}

            {topTask ? (
              <section className="space-y-3">
                <SectionHeader title="Best Move" subtitle="Next in queue." />
                <BestMoveCard
                  task={topTask}
                  onStart={(t) => executeMutation.mutate(t.path)}
                  onSkip={(t) => handleDefer(t.path)}
                  onComplete={(t) => completeMutation.mutate(t.path)}
                  mutating={
                    executeMutation.isPending ||
                    pendingDeferPath === topTask?.path ||
                    completeMutation.isPending
                  }
                />
              </section>
            ) : null}

            <section className="space-y-3">
              <SectionHeader
                title="Pressure Band"
                subtitle="Highest-pressure signals across the system."
              />
              <div className="space-y-3">
                {visiblePressureBand.length > 0 ? (
                  visiblePressureBand.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[22px] border border-slate-200 bg-black/3 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-slate-800 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.summary}
                          </p>
                        </div>
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-700 shrink-0">
                          {item.severity}
                        </span>
                      </div>
                      <div className="mt-3">
                        <CodSignalRow
                          items={[
                            { label: 'Source type', value: item.sourceType },
                            {
                              label: 'Severity',
                              value: item.severity,
                              variant:
                                item.severity === 'high'
                                  ? 'bad'
                                  : item.severity === 'medium'
                                    ? 'warn'
                                    : 'ok',
                            },
                            {
                              label: 'Confidence',
                              value: `${((item.confidence ?? 0) * 100).toFixed(0)}%`,
                            },
                          ]}
                        />
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {item.whySurfaced}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <SignalWorkLink sourceId={item.sourceId} />
                        {item.taskPath ? (
                          <>
                            <Link
                              to="/work"
                              search={{ selectedId: item.sourceId }}
                              className="rounded-full border border-slate-200 bg-black/3 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600 hover:bg-black/6 transition-colors"
                            >
                              Open task
                            </Link>
                            <button
                              type="button"
                              disabled={pendingDeferPath === item.taskPath}
                              onClick={() => handleDefer(item.taskPath!)}
                              className="rounded-full border border-slate-200 bg-black/3 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600 hover:bg-black/6 transition-colors disabled:opacity-50"
                            >
                              {pendingDeferPath === item.taskPath
                                ? 'Deferring…'
                                : 'Defer'}
                            </button>
                          </>
                        ) : (
                          item.allowedActions.map((action) => (
                            <span
                              key={`${item.id}-${action.actionType}`}
                              aria-disabled="true"
                              title="Action unavailable without a task path"
                              className="rounded-full border border-slate-200 bg-black/3 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 opacity-40 cursor-not-allowed select-none"
                            >
                              {action.label}
                            </span>
                          ))
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    title="No pressure is surfaced right now."
                    description="Once the adapter has signals, the pressure band will populate here."
                  />
                )}
              </div>
            </section>

            <section className="space-y-3">
              <SectionHeader
                title="Decision Queue"
                subtitle="Top ranked recommendations."
              />
              {visibleDecisionQueue.length > 0 ? (
                <div className="space-y-3">
                  {visibleDecisionQueue.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[22px] border border-slate-200 bg-black/3 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-slate-800 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.summary}
                          </p>
                        </div>
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-700 shrink-0">
                          {formatScore(item.score)}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Why now
                          </p>
                          {isTemplatedText(item.whyNow) ? (
                            <p className="mt-1 text-xs text-slate-400 italic">
                              —
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-slate-600">
                              {item.whyNow}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Expected effect
                          </p>
                          {isTemplatedText(item.expectedEffect) ? (
                            <p className="mt-1 text-xs text-slate-400 italic">
                              —
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-slate-600">
                              {item.expectedEffect}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Confidence
                          </p>
                          <p className="mt-1 text-sm text-slate-800">
                            {((item.confidence ?? 0) * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.reversibility} reversibility
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link
                          to="/actions"
                          search={{
                            selectedId: item.id,
                            sort: undefined,
                            simulatableOnly: undefined,
                          }}
                          className="text-xs font-semibold text-sky-700 underline decoration-sky-500/40 underline-offset-4"
                        >
                          Inspect in Actions
                        </Link>
                        <Link
                          to="/actions"
                          search={{
                            selectedId: item.id,
                            simulatableOnly: true,
                            sort: undefined,
                          }}
                          className="rounded-full border border-slate-200 bg-black/3 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600 hover:bg-black/6 transition-colors"
                        >
                          Simulate
                        </Link>
                        {item.taskPath ? (
                          <button
                            type="button"
                            disabled={pendingDeferPath === item.taskPath}
                            onClick={() => handleDefer(item.taskPath!)}
                            className="rounded-full border border-slate-200 bg-black/3 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600 hover:bg-black/6 transition-colors disabled:opacity-50"
                          >
                            {pendingDeferPath === item.taskPath
                              ? 'Deferring…'
                              : 'Defer'}
                          </button>
                        ) : (
                          <span
                            aria-disabled="true"
                            title="No task path available"
                            className="rounded-full border border-slate-200 bg-black/3 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 opacity-40 cursor-not-allowed select-none"
                          >
                            Defer
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No decisions are surfaced right now."
                  description="Once the queue refreshes, the best next moves will appear here."
                />
              )}
            </section>

            <section className="space-y-3">
              <SectionHeader
                title="Verification Rail"
                subtitle="Feedback, snapshots, and context."
              />
              <div className="space-y-6">
                <section className="space-y-3">
                  {verificationPhase === 'pending' && (
                    <p className="text-sm text-sky-600">Verifying…</p>
                  )}
                  {verificationPhase === 'failed' && (
                    <p className="text-sm text-red-600">Verification failed.</p>
                  )}
                  {verificationRail.length > 0 ? (
                    <div className="space-y-3">
                      {verificationRail.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-[18px] border border-slate-200 bg-black/3 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                                {item.summary}
                              </p>
                              <p
                                className="mt-1 text-xs text-slate-500 truncate"
                                title={item.actionId}
                              >
                                {humanizeActionId(item.actionId)}
                              </p>
                            </div>
                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-700">
                              {item.status}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {item.improved ? <span>Improved</span> : null}
                            {item.followUpNeeded ? (
                              <span>Follow-up needed</span>
                            ) : null}
                            {item.resolvedAt ? (
                              <span>
                                {new Date(item.resolvedAt).toLocaleDateString(
                                  undefined,
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  }
                                )}
                              </span>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Verification rail is ready."
                      description="Results will appear here after actions are executed."
                    />
                  )}
                </section>

                <section className="space-y-3">
                  <SectionHeader
                    title="Snapshot Grid"
                    subtitle="Domain-level pressure snapshots."
                  />
                  <SurfaceEntryGrid
                    loading={surfaceLoading && !surface}
                    tiles={
                      [
                        {
                          label: 'Automation',
                          role: 'Active pipelines and triggers',
                          count: snapshots.automation.length,
                          to: '/automation',
                          nextStep: 'Review pipeline health',
                        },
                        {
                          label: 'Knowledge',
                          role: 'Authored memory and context',
                          count: snapshots.knowledge.length,
                          to: '/knowledge',
                          nextStep: 'Search or browse notes',
                        },
                        {
                          label: 'Portfolio',
                          role: 'Projects and milestone tracking',
                          count: snapshots.portfolio.length,
                          to: '/portfolio',
                          nextStep: 'Check project progress',
                        },
                        {
                          label: 'Bubble',
                          role: 'Audience-facing content state',
                          count: snapshots.bubble.length,
                          to: '/bubble',
                          nextStep: 'Review content signals',
                        },
                        {
                          label: 'Health',
                          role: 'System and personal vitals',
                          count: snapshots.health.length,
                          to: '/health',
                          nextStep: 'Check system status',
                        },
                      ] as SurfaceEntryTile[]
                    }
                  />
                </section>

                <section className="space-y-3">
                  <SectionHeader
                    title="Context Tail"
                    subtitle="COD-selected context, not just recent notes."
                  />
                  {contextTail.length > 0 ? (
                    <div className="space-y-3">
                      {contextTail.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-[18px] border border-slate-200 bg-black/3 p-4"
                        >
                          <p className="text-sm font-semibold text-slate-800">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.summary}
                          </p>
                          <p className="mt-3 text-xs text-slate-500">
                            {item.reasonSelected}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No context tail is selected."
                      description="COD-selected context will appear here when available."
                    />
                  )}
                </section>

                {recentSessions && recentSessions.length > 0 ? (
                  <RecentSessionsPanel sessions={recentSessions} />
                ) : null}
              </div>
            </section>
          </div>
        }
      />
    </div>
  );
}
