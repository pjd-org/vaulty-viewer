import React, { useEffect, useMemo, useState } from 'react';
import { useWhatNowQuery, useUpNextQuery } from '../lib/queries/agents';
import type { TaskInput } from '../../src/lib/agent-prompts';
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
    <div className="genie-surface genie-surface--utility rounded-[28px] p-4 space-y-2">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
        Recent sessions
      </p>
      {sessions.map((s) => (
        <Link
          key={s.id}
          to={'/session/$id'}
          params={{ id: s.id }}
          className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/10 transition-colors"
        >
          <span className="text-sm font-medium text-slate-800 truncate">
            {s.title ?? `Session ${s.id.slice(0, 6)}`}
          </span>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className="text-xs text-slate-500">
              {formatSessionDuration(s.startedAt, s.endedAt)}
            </span>
            <span className="text-xs text-slate-600 capitalize">
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
    <div className="genie-surface genie-surface--utility rounded-[28px] p-4 flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-sky-300 uppercase tracking-wide">
          Session active
        </span>
        {session.title && (
          <span className="text-sm font-medium text-slate-800">
            {session.title}
          </span>
        )}
        <span className="text-xs text-slate-600">
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

  // Derive agentTasks from the adapter's preserved raw task data
  const agentTasks: TaskInput[] = useMemo(
    () =>
      (surface?.tasks ?? []).slice(0, 20).map((t) => ({
        id: t.id,
        title: t.title,
        estimatedMinutes: t.estimatedTimeMin,
        focusCost: t.focusCost,
        priority: t.priority,
        project: t.projectId,
        status: t.status,
      })),
    [surface?.tasks]
  );

  const { data: whatNow, isError: whatNowFailed } = useWhatNowQuery(
    agentTasks,
    {
      enabled: !surfaceLoading && agentTasks.length > 0,
    }
  );
  const { data: upNext, isError: upNextFailed } = useUpNextQuery(agentTasks, {
    enabled: !surfaceLoading && agentTasks.length > 0,
  });

  const endSession = async () => {
    if (!activeSession) return;
    setEndingSession(true);
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
  const immediateActions = surface?.immediateActions ?? [];
  const verificationRail = surface?.verificationRail ?? [];

  const topTask: NextAction | undefined = (surface?.tasks ?? [])[0];
  const snapshots = surface?.snapshots ?? {
    automation: [],
    knowledge: [],
    portfolio: [],
    bubble: [],
    health: [],
  };
  const contextTail = surface?.contextTail ?? [];
  const searchEcho = [q, collection, session, snapshot, detailId].filter(
    (value): value is string => Boolean(value)
  );

  const summaryItems = [
    {
      label: 'Pressure',
      value:
        surfaceLoading && !surface ? 'Loading' : String(pressureBand.length),
      detail: 'Highest-pressure signals',
    },
    {
      label: 'Queue',
      value:
        surfaceLoading && !surface ? 'Loading' : String(decisionQueue.length),
      detail: 'COD-ranked next moves',
    },
    {
      label: 'Immediate',
      value:
        surfaceLoading && !surface
          ? 'Loading'
          : String(immediateActions.length),
      detail: 'Low-friction interventions',
    },
    {
      label: 'Verification',
      value:
        surfaceLoading && !surface
          ? 'Loading'
          : verificationRail.length
            ? 'Active'
            : 'Ready',
      detail: 'Feedback loop',
    },
  ] as const;

  const renderSignalActions = (sourceId: string) => (
    <Link
      to="/work"
      search={{ selectedId: sourceId }}
      className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300 transition-colors hover:border-sky-400/70 hover:bg-sky-400/20 hover:text-sky-100"
    >
      Open work
    </Link>
  );

  return (
    <div className="space-y-6">
      {activeSession && !endingSession ? (
        <ActiveSessionBanner
          session={activeSession}
          onResume={() =>
            navigate({ to: '/session/$id', params: { id: activeSession.id } })
          }
          onEnd={endSession}
        />
      ) : null}

      <WorkspaceScaffold
        title="Home"
        subtitle={
          searchEcho.length
            ? `Global mission control · ${searchEcho.join(' · ')}`
            : 'Global mission control'
        }
        summaryItems={summaryItems}
        primaryTitle="Pressure Band"
        primarySubtitle="Highest-pressure signals across the system."
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
                <SectionHeader
                  title="Best Move"
                  subtitle="Top COD-ranked task ready to execute."
                />
                <BestMoveCard
                  task={topTask}
                  onStart={(t) => executeMutation.mutate(t.path)}
                  onSkip={(t) => deferMutation.mutate(t.path)}
                  onComplete={(t) => completeMutation.mutate(t.path)}
                  mutating={
                    executeMutation.isPending ||
                    deferMutation.isPending ||
                    completeMutation.isPending
                  }
                />
              </section>
            ) : null}

            <section className="space-y-3">
              <div className="space-y-3">
                {pressureBand.length > 0 ? (
                  pressureBand.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[22px] border border-white/8 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-slate-100 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-300">
                            {item.summary}
                          </p>
                        </div>
                        <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-100 shrink-0">
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
                      <p className="mt-3 text-sm text-slate-300">
                        {item.whySurfaced}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {renderSignalActions(item.sourceId)}
                        {item.taskPath ? (
                          <>
                            <Link
                              to="/work"
                              search={{ selectedId: item.sourceId }}
                              className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 hover:bg-white/10 transition-colors"
                            >
                              Open task
                            </Link>
                            <button
                              type="button"
                              disabled={deferMutation.isPending}
                              onClick={() =>
                                deferMutation.mutate(item.taskPath!)
                              }
                              className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                              {deferMutation.isPending ? 'Deferring…' : 'Defer'}
                            </button>
                          </>
                        ) : (
                          item.allowedActions.map((action) => (
                            <span
                              key={`${item.id}-${action.actionType}`}
                              className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300"
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
              {decisionQueue.length > 0 ? (
                <div className="space-y-3">
                  {decisionQueue.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[22px] border border-white/8 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-slate-100 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-300">
                            {item.summary}
                          </p>
                        </div>
                        <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-100 shrink-0">
                          {formatScore(item.score)}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Why now
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {item.whyNow}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Expected effect
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {item.expectedEffect}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Confidence
                          </p>
                          <p className="mt-1 text-sm text-slate-200">
                            {(item.confidence * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs text-slate-400">
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
                          className="text-xs font-semibold text-sky-100 underline decoration-sky-300/40 underline-offset-4"
                        >
                          Inspect in Actions
                        </Link>
                        <Link
                          to="/actions"
                          search={{
                            selectedId: item.id,
                            sort: undefined,
                            simulatableOnly: undefined,
                          }}
                          className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 hover:bg-white/10 transition-colors"
                        >
                          Execute
                        </Link>
                        <Link
                          to="/actions"
                          search={{
                            selectedId: item.id,
                            simulatableOnly: true,
                            sort: undefined,
                          }}
                          className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 hover:bg-white/10 transition-colors"
                        >
                          Simulate
                        </Link>
                        {item.taskPath ? (
                          <button
                            type="button"
                            disabled={deferMutation.isPending}
                            onClick={() => deferMutation.mutate(item.taskPath!)}
                            className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                          >
                            {deferMutation.isPending ? 'Deferring…' : 'Defer'}
                          </button>
                        ) : (
                          <span className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
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
                title="Immediate Interventions"
                subtitle="Low-friction actions only."
              />
              {immediateActions.length > 0 ? (
                <div className="space-y-3">
                  {immediateActions.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[18px] border border-white/8 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {item.summary}
                          </p>
                        </div>
                        <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-100">
                          {item.reversibility}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-slate-400">
                        {item.expectedEffect}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No immediate interventions are surfaced."
                  description="The adapter will surface low-friction actions once they are available."
                />
              )}
            </section>

            <section className="space-y-3">
              <SectionHeader
                title="Legacy coaching"
                subtitle="Agent guidance stays parallel for now."
              />
              {whatNow || upNext ? (
                <div className="genie-surface genie-surface--utility rounded-[22px] px-4 py-3 text-sm space-y-2">
                  {whatNow ? (
                    <div>
                      <p className="font-medium text-slate-700">
                        {whatNow.rationale}
                      </p>
                      <p className="text-xs text-slate-500">
                        {whatNow.why_now}
                      </p>
                    </div>
                  ) : null}
                  {upNext ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {upNext.flow_label ?? 'Up next'}
                      </p>
                      {upNext.steps.slice(0, 3).map((step) => (
                        <p
                          key={step.id}
                          className="mt-1 text-sm text-slate-700"
                        >
                          {step.title}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  title="Legacy coaching is quiet."
                  description="The route still keeps the parallel agent lane available when tasks exist."
                />
              )}
              {(whatNowFailed || upNextFailed) && (
                <div className="genie-surface genie-surface--utility rounded-[22px] px-4 py-3 text-sm space-y-1">
                  <p className="text-slate-700">
                    AI guidance is temporarily unavailable.
                  </p>
                  <p className="text-xs text-slate-500">
                    The adapter-backed surface still remains current.
                  </p>
                </div>
              )}
            </section>
          </div>
        }
        asideTitle="Verification Rail"
        asideSubtitle="Feedback, snapshots, and context."
        aside={
          <div className="space-y-6">
            <section className="space-y-3">
              {verificationPhase === 'pending' && (
                <p className="text-sm text-sky-300">Verifying…</p>
              )}
              {verificationPhase === 'failed' && (
                <p className="text-sm text-red-400">Verification failed.</p>
              )}
              {verificationRail.length > 0 ? (
                <div className="space-y-3">
                  {verificationRail.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[18px] border border-white/8 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-100 line-clamp-2">
                            {item.summary}
                          </p>
                          <p className="mt-1 text-xs text-slate-400 truncate">
                            {item.actionId}
                          </p>
                        </div>
                        <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-100">
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        {item.improved ? <span>Improved</span> : null}
                        {item.followUpNeeded ? (
                          <span>Follow-up needed</span>
                        ) : null}
                        {item.resolvedAt ? (
                          <span>{item.resolvedAt}</span>
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
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      label: 'Automation',
                      items: snapshots.automation,
                      to: '/automation',
                    },
                    {
                      label: 'Knowledge',
                      items: snapshots.knowledge,
                      to: '/knowledge',
                    },
                    {
                      label: 'Portfolio',
                      items: snapshots.portfolio,
                      to: '/portfolio',
                    },
                    { label: 'Bubble', items: snapshots.bubble, to: '/bubble' },
                    { label: 'Health', items: snapshots.health, to: '/health' },
                  ] as const
                ).map((snapshotGroup) => (
                  <Link
                    key={snapshotGroup.label}
                    to={snapshotGroup.to as never}
                    className="rounded-[18px] border border-white/8 bg-white/5 p-4 transition hover:bg-white/8"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {snapshotGroup.label}
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-100">
                      {snapshotGroup.items.length > 0
                        ? snapshotGroup.items.length
                        : '—'}
                    </p>
                  </Link>
                ))}
              </div>
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
                      className="rounded-[18px] border border-white/8 bg-white/5 p-4"
                    >
                      <p className="text-sm font-semibold text-slate-100">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {item.summary}
                      </p>
                      <p className="mt-3 text-xs text-slate-400">
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
        }
      />
    </div>
  );
}
