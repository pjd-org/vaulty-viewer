import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import { EmptyState } from '../components/ui';
import {
  getActionsSurfaceQueryOptions,
  useActionsSurface,
} from '../lib/viewer-adapter';
import { actionsSearchParams } from '../../src/lib/routes/search-params';
import { useUIStore } from '../../src/store/ui';
import { useMutationWithVerification } from '../hooks/use-mutation-with-verification';
import {
  updateTaskStatus,
  fetchTaskMetrics,
  type TaskMetrics,
} from '../lib/api/tasks';

const REVERB_RANK: Record<'low' | 'medium' | 'high', number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export const Route = createFileRoute('/actions')({
  validateSearch: actionsSearchParams,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(getActionsSurfaceQueryOptions());
  },
  component: ActionsRoute,
});

function ActionsRoute() {
  const { sort, simulatableOnly, selectedId } = Route.useSearch();
  const { data: surface, isLoading, error } = useActionsSurface();
  const navigate = useNavigate();
  const currentSort = sort ?? 'urgency';
  const allRecommendations = surface?.recommendations ?? [];

  const recommendations = React.useMemo(() => {
    const base = allRecommendations;
    const filtered = simulatableOnly
      ? base.filter((item) => item.reversibility === 'high')
      : base;

    const sorted = [...filtered];
    switch (currentSort) {
      case 'impact':
        sorted.sort(
          (a, b) => b.scoreBreakdown.impact - a.scoreBreakdown.impact
        );
        break;
      case 'confidence':
        sorted.sort((a, b) => b.confidence - a.confidence);
        break;
      case 'reversibility':
        sorted.sort(
          (a, b) =>
            REVERB_RANK[b.reversibility] - REVERB_RANK[a.reversibility] ||
            b.score - a.score
        );
        break;
      case 'source':
        sorted.sort(
          (a, b) =>
            b.sourceSignalIds.length - a.sourceSignalIds.length ||
            b.sourceEntities.length - a.sourceEntities.length ||
            b.score - a.score
        );
        break;
      default:
        sorted.sort((a, b) => b.score - a.score);
        break;
    }

    return sorted;
  }, [allRecommendations, simulatableOnly, currentSort]);

  const selected =
    recommendations.find((item) => item.id === selectedId) ??
    recommendations[0];
  const verificationCount = surface?.verificationRail.length ?? 0;
  const verificationPhase = useUIStore((s) => s.verification.phase);
  const [simulationData, setSimulationData] =
    React.useState<TaskMetrics | null>(null);
  const [simulationLoading, setSimulationLoading] = React.useState(false);

  // Clear simulation data when selection changes
  React.useEffect(() => {
    setSimulationData(null);
  }, [selected?.id]);

  const executeMutation = useMutationWithVerification<boolean, string>({
    mutationFn: (taskPath: string) => updateTaskStatus(taskPath, 'in-progress'),
    domain: 'work',
    actionId: selected?.id ?? '',
    projectId: selected?.projectId,
  });

  const deferMutation = useMutationWithVerification<boolean, string>({
    mutationFn: (taskPath: string) => updateTaskStatus(taskPath, 'backlog'),
    domain: 'work',
    actionId: selected?.id ?? '',
    projectId: selected?.projectId,
  });

  const handleExecute = React.useCallback(() => {
    if (!selected?.taskPath) return;
    executeMutation.mutate(selected.taskPath);
  }, [selected, executeMutation]);

  const handleDefer = React.useCallback(() => {
    if (!selected?.taskPath) return;
    deferMutation.mutate(selected.taskPath);
  }, [selected, deferMutation]);

  const handleSimulate = React.useCallback(async () => {
    if (!selected?.taskPath) return;
    setSimulationLoading(true);
    setSimulationData(null);
    try {
      const metrics = await fetchTaskMetrics(selected.taskPath);
      setSimulationData(metrics);
    } catch {
      setSimulationData(null);
    } finally {
      setSimulationLoading(false);
    }
  }, [selected]);
  const setSearch = React.useCallback(
    (next: {
      sort?: 'urgency' | 'impact' | 'confidence' | 'source' | 'reversibility';
      simulatableOnly?: boolean;
      selectedId?: string;
    }) => {
      navigate({
        to: '/actions',
        search: {
          sort: next.sort,
          simulatableOnly: next.simulatableOnly,
          selectedId: 'selectedId' in next ? next.selectedId : selectedId,
        },
        replace: true,
      });
    },
    [navigate, selectedId]
  );

  const toolbar = (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        <label htmlFor="actions-sort">Sort mode</label>
        <select
          id="actions-sort"
          value={currentSort}
          onChange={(event) =>
            setSearch({
              sort: event.target.value as
                | 'urgency'
                | 'impact'
                | 'confidence'
                | 'source'
                | 'reversibility',
              simulatableOnly,
            })
          }
          className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-300/50"
        >
          <option value="urgency">Urgency</option>
          <option value="impact">Impact</option>
          <option value="confidence">Confidence</option>
          <option value="source">Source</option>
          <option value="reversibility">Reversibility</option>
        </select>
      </div>
      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100">
        <input
          id="actions-simulatable-only"
          type="checkbox"
          checked={Boolean(simulatableOnly)}
          onChange={(event) =>
            setSearch({
              sort: currentSort,
              simulatableOnly: event.target.checked ? true : undefined,
            })
          }
          className="h-4 w-4 rounded border-white/20 bg-transparent text-sky-400"
        />
        <span>Simulatable only</span>
      </label>
      <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-right text-xs text-slate-300">
        <p>
          Showing {recommendations.length} of {allRecommendations.length}{' '}
          recommendations
        </p>
        <p className="mt-1 font-medium text-slate-100">
          Selected: {selected?.title ?? 'None'}
        </p>
      </div>
    </div>
  );

  const summaryItems = [
    {
      label: 'Recommended',
      value: String(recommendations.length),
      detail: 'Live adapter-ranked actions',
    },
    {
      label: 'High impact',
      value: String(
        recommendations.filter((item) => item.scoreBreakdown.impact >= 7).length
      ),
      detail: 'Strong leverage right now',
    },
    {
      label: 'Low friction',
      value: String(
        recommendations.filter((item) => item.reversibility === 'high').length
      ),
      detail: 'Safe quick-command candidates',
    },
    {
      label: 'Verification',
      value: surface?.verificationRail.length ? 'Active' : 'Ready',
      detail: 'Feedback loop reserved for mutation outcomes',
    },
  ];

  return (
    <WorkspaceScaffold
      title="Actions"
      subtitle="Execution console for COD-ranked interventions."
      actions={toolbar}
      summaryItems={summaryItems}
      primaryTitle="Recommended Actions"
      primarySubtitle="Ranked by urgency, impact, confidence, and reversibility."
      primary={
        isLoading && !surface ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : error && !surface ? (
          <EmptyState
            title="Action recommendations are temporarily unavailable."
            description="The shell is intact. Retry once the task service responds again."
          />
        ) : recommendations.length === 0 ? (
          <EmptyState
            title="No actions are surfaced right now."
            description="Once the queue refreshes, this lane will rank the best next moves."
          />
        ) : (
          <div className="space-y-3">
            {recommendations.map((item) => {
              const active = item.id === selected?.id;
              return (
                <article
                  key={item.id}
                  className={[
                    'rounded-[22px] border p-4 transition',
                    active
                      ? 'border-sky-300/40 bg-white/10 shadow-[0_18px_45px_rgba(56,189,248,0.14)]'
                      : 'border-white/8 bg-white/5',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-300">
                        {item.summary}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-100">
                      {item.actionType.replace('_', ' ')}
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
                        Score
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        {item.score.toFixed(1)} / 10
                      </p>
                      <p className="text-xs text-slate-400">
                        Confidence {(item.confidence * 100).toFixed(0)}% ·{' '}
                        {item.reversibility} reversibility
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      }
      asideTitle="Detail Panel"
      asideSubtitle="Selection-driven explanation and controls."
      aside={
        selected ? (
          <div className="space-y-5 text-sm text-slate-300">
            <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Selected action
              </p>
              <h3 className="mt-3 text-lg font-semibold text-slate-100">
                {selected.title}
              </h3>
              <p className="mt-2 text-sm text-slate-300">{selected.summary}</p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-[18px] border border-white/8 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Score breakdown
                </p>
                <div className="mt-3 space-y-2">
                  {Object.entries(selected.scoreBreakdown).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-slate-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="text-slate-200">{value}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="rounded-[18px] border border-white/8 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Mutation path
                </p>
                <p className="mt-3 text-slate-200">
                  {selected.mutationRef
                    ? `${selected.mutationRef.domain} / ${selected.mutationRef.operation}`
                    : 'Simulation only'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Source entities: {selected.sourceEntities.length}
                </p>
              </div>
              <div className="rounded-[18px] border border-white/8 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Source signals
                </p>
                {selected.sourceSignalIds.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.sourceSignalIds.map((signalId) => (
                      <span
                        key={signalId}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-100"
                      >
                        {signalId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">
                    No source signals surfaced.
                  </p>
                )}
              </div>
              <div className="rounded-[18px] border border-white/8 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Verification preview
                </p>
                {verificationPhase === 'pending' && (
                  <p className="mt-3 text-sm text-sky-300">Verifying…</p>
                )}
                {verificationPhase === 'failed' && (
                  <p className="mt-3 text-sm text-red-400">
                    Verification failed.
                  </p>
                )}
                {verificationCount > 0 ? (
                  <div className="mt-3 space-y-2">
                    {surface?.verificationRail.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-[14px] border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-100">
                              {item.summary}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {item.actionId}
                            </p>
                          </div>
                          <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100">
                            {item.status}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">
                    Ready for post-action verification.
                  </p>
                )}
              </div>
              <div className="rounded-[18px] border border-white/8 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Action controls
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!selected.taskPath || executeMutation.isPending}
                    onClick={handleExecute}
                    className="rounded-full border border-sky-300/30 bg-sky-400/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {executeMutation.isPending ? 'Starting…' : 'Execute'}
                  </button>
                  <button
                    type="button"
                    disabled={
                      !selected.taskPath ||
                      selected.reversibility !== 'high' ||
                      simulationLoading
                    }
                    onClick={handleSimulate}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {simulationLoading ? 'Loading…' : 'Simulate'}
                  </button>
                  <button
                    type="button"
                    disabled={!selected.taskPath || deferMutation.isPending}
                    onClick={handleDefer}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deferMutation.isPending ? 'Deferring…' : 'Defer'}
                  </button>
                </div>
              </div>
              {simulationData && (
                <div className="rounded-[18px] border border-amber-300/20 bg-amber-400/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-400">
                    Simulation preview
                  </p>
                  <div className="mt-3 space-y-2">
                    {[
                      ['Status', simulationData.status],
                      ['Priority', String(simulationData.priority)],
                      ['Effort', `${simulationData.effortScore}/10`],
                      ['Focus cost', `${simulationData.focusCost}/10`],
                      [
                        'Estimated time',
                        `${simulationData.estimatedTimeMin} min`,
                      ],
                      ...(simulationData.milestone != null
                        ? [['Milestone', `${simulationData.milestone}%`]]
                        : []),
                      ...(simulationData.blockerCount
                        ? [['Blockers', String(simulationData.blockerCount)]]
                        : []),
                      ...(simulationData.checklistProgress
                        ? [['Checklist', simulationData.checklistProgress]]
                        : []),
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-slate-400">{label}</span>
                        <span className="text-slate-200">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            title="Select an action to inspect."
            description="The right rail will expose explanation, confidence, and mutation details."
          />
        )
      }
    />
  );
}
