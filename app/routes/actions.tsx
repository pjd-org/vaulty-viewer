import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import {
  Badge,
  EmptyState,
  PrimaryButton,
  SecondaryButton,
  SurfaceSectionCard,
} from '../components/ui';
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
  const setVerificationPhase = useUIStore((s) => s.setVerificationPhase);
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
    setVerificationPhase('pending', selected.id);
    executeMutation.mutate(selected.taskPath);
  }, [selected, executeMutation, setVerificationPhase]);

  const handleDefer = React.useCallback(() => {
    if (!selected?.taskPath) return;
    setVerificationPhase('pending', selected.id);
    deferMutation.mutate(selected.taskPath);
  }, [selected, deferMutation, setVerificationPhase]);

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
      <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        <Badge
          variant="muted"
          className="w-fit px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]"
        >
          Sort mode
        </Badge>
        <select
          id="actions-sort"
          aria-label="Sort actions"
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
          className="rounded-full border border-border bg-muted/40 px-3 py-2 text-sm text-foreground transition focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <option value="urgency">Urgency</option>
          <option value="impact">Impact</option>
          <option value="confidence">Confidence</option>
          <option value="source">Source</option>
          <option value="reversibility">Reversibility</option>
        </select>
      </div>
      <label className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 text-sm text-foreground">
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
          className="h-4 w-4 rounded border-border bg-transparent text-primary"
        />
        <span className="font-semibold uppercase tracking-[0.16em] text-[10px] text-muted-foreground">
          Simulatable only
        </span>
      </label>
      <div className="rounded-full border border-border bg-muted/40 px-4 py-2 text-right text-xs text-muted-foreground">
        <Badge
          variant="muted"
          className="mb-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]"
        >
          Showing {recommendations.length} of {allRecommendations.length}
        </Badge>
        <p className="font-medium text-foreground">
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
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl border border-border bg-muted/40"
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
          <div className="flex flex-col gap-3">
            {recommendations.map((item) => {
              const isExpanded = item.id === selectedId;
              return (
                <article
                  key={item.id}
                  className={[
                    'rounded-[22px] border transition',
                    isExpanded
                      ? 'border-primary/30 bg-primary/5 shadow-sm'
                      : 'border-border bg-muted/40',
                  ].join(' ')}
                >
                  {/* ── summary row — clickable ── */}
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setSearch({
                        sort: currentSort,
                        simulatableOnly,
                        selectedId: isExpanded ? undefined : item.id,
                      })
                    }
                    className="w-full cursor-pointer p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-[22px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.summary}
                        </p>
                      </div>
                      <Badge
                        variant="muted"
                        className="px-3 py-1 text-xs uppercase tracking-[0.2em]"
                      >
                        {item.actionType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                          Why now
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.whyNow}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                          Expected effect
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.expectedEffect}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                          Score
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          {item.score.toFixed(1)} / 10
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Confidence {(item.confidence * 100).toFixed(0)}% ·{' '}
                          {item.reversibility} reversibility
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* ── inline detail panel ── */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3 flex flex-col gap-4 text-sm text-muted-foreground">
                      {/* Score breakdown */}
                      <SurfaceSectionCard title="Score breakdown">
                        <div className="flex flex-col gap-2">
                          {Object.entries(item.scoreBreakdown).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between gap-3"
                              >
                                <span className="text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, ' $1')}
                                </span>
                                <span className="text-foreground">{value}</span>
                              </div>
                            )
                          )}
                        </div>
                      </SurfaceSectionCard>

                      {/* Mutation path */}
                      <SurfaceSectionCard title="Mutation path">
                        <p className="text-foreground">
                          {item.mutationRef
                            ? `${item.mutationRef.domain} / ${item.mutationRef.operation}`
                            : 'Simulation only'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Source entities: {item.sourceEntities.length}
                        </p>
                      </SurfaceSectionCard>

                      {/* Source signals */}
                      <SurfaceSectionCard title="Source signals">
                        {item.sourceSignalIds.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {item.sourceSignalIds.map((signalId) => (
                              <span
                                key={signalId}
                                className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground"
                              >
                                {signalId}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No source signals surfaced.
                          </p>
                        )}
                      </SurfaceSectionCard>

                      {/* Verification preview */}
                      <SurfaceSectionCard title="Verification preview">
                        {verificationPhase === 'pending' && (
                          <p className="text-sm text-primary">Verifying…</p>
                        )}
                        {verificationPhase === 'failed' && (
                          <p className="text-sm text-destructive">
                            Verification failed.
                          </p>
                        )}
                        {verificationCount > 0 ? (
                          <div className="flex flex-col gap-2">
                            {surface?.verificationRail.map((vItem) => (
                              <article
                                key={vItem.id}
                                className="rounded-[14px] border border-border bg-muted/40 p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {vItem.summary}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {vItem.actionId}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="muted"
                                    className="px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]"
                                  >
                                    {vItem.status}
                                  </Badge>
                                </div>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Ready for post-action verification.
                          </p>
                        )}
                      </SurfaceSectionCard>

                      {/* Action controls */}
                      <SurfaceSectionCard title="Action controls">
                        <div className="flex flex-wrap gap-2">
                          <PrimaryButton
                            type="button"
                            disabled={
                              !item.taskPath || executeMutation.isPending
                            }
                            onClick={handleExecute}
                            className="rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em]"
                          >
                            {executeMutation.isPending
                              ? 'Starting…'
                              : 'Execute'}
                          </PrimaryButton>
                          <SecondaryButton
                            type="button"
                            disabled={
                              !item.taskPath ||
                              item.reversibility !== 'high' ||
                              simulationLoading
                            }
                            onClick={handleSimulate}
                            className="rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em]"
                          >
                            {simulationLoading ? 'Loading…' : 'Simulate'}
                          </SecondaryButton>
                          <SecondaryButton
                            type="button"
                            disabled={!item.taskPath || deferMutation.isPending}
                            onClick={handleDefer}
                            className="rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em]"
                          >
                            {deferMutation.isPending ? 'Deferring…' : 'Defer'}
                          </SecondaryButton>
                        </div>
                      </SurfaceSectionCard>

                      {/* Simulation preview (item-scoped) */}
                      {simulationData && (
                        <div className="rounded-[18px] border border-warning/30 bg-warning/10 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-warning">
                            Simulation preview
                          </p>
                          <div className="mt-3 flex flex-col gap-2">
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
                                ? [
                                    [
                                      'Milestone',
                                      `${simulationData.milestone}%`,
                                    ],
                                  ]
                                : []),
                              ...(simulationData.blockerCount
                                ? [
                                    [
                                      'Blockers',
                                      String(simulationData.blockerCount),
                                    ],
                                  ]
                                : []),
                              ...(simulationData.checklistProgress
                                ? [
                                    [
                                      'Checklist',
                                      simulationData.checklistProgress,
                                    ],
                                  ]
                                : []),
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="flex items-center justify-between gap-3"
                              >
                                <span className="text-muted-foreground">
                                  {label}
                                </span>
                                <span className="text-foreground">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )
      }
    />
  );
}
