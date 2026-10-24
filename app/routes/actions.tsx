import React from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';

import { AmbientSurface } from '../components/v2';
import { WorkspaceScaffold } from '../components/layout';
import { Badge } from '@/app/components/ui/badge';
import {
  EmptyState,
  GuardrailBanner,
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
    // See routes/index.tsx: SSR has no service credential, so this call is a
    // guaranteed 401 and used to turn the route into HTTP 500 for anonymous
    // visitors. Skip it; the client refetches through the session-gated proxy.
    if (
      !process.env.VIEWER_INTERNAL_APP_API_KEY &&
      !process.env.AUTH_MCP_API_KEY
    ) {
      return;
    }
    await context.queryClient.ensureQueryData(getActionsSurfaceQueryOptions());
  },
  component: ActionsRoute,
});

function ActionsRoute() {
  const { sort, simulatableOnly, selectedId } = Route.useSearch();
  const { data: surface, isLoading, isStale, error } = useActionsSurface();
  const navigate = useNavigate();
  const currentSort = sort ?? 'urgency';
  const allRecommendations = surface?.recommendations ?? [];
  const availability =
    surface?.meta?.humanState?.status === 'blocked' ||
    surface?.meta?.availability === 'paused'
      ? 'paused'
      : isLoading
        ? 'loading'
        : error
          ? surface ? 'stale' : 'error'
          : surface && isStale
            ? 'stale'
            : surface?.meta?.availability ??
              (surface
                ? allRecommendations.length ? 'ready' : 'empty'
                : 'unavailable');
  const countsComputed = availability === 'ready' || availability === 'empty';
  const availabilityMessage = {
    ready: 'Action recommendations are ready.',
    empty: 'No actions are surfaced right now.',
    paused: 'Task lanes are paused.',
    unavailable: 'Action recommendations are unavailable.',
    error: 'Action recommendations could not be loaded.',
    stale: 'Action recommendations are stale.',
    loading: 'Loading action recommendations…',
  }[availability];


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


  const deferMutation = useMutationWithVerification<boolean, string>({
    mutationFn: (taskPath: string) => updateTaskStatus(taskPath, 'backlog'),
    domain: 'work',
    actionId: selected?.id ?? '',
    projectId: selected?.projectId,
    surfaceScope: 'actions',
  });


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
    <div className="rounded-2xl border border-[var(--border-glass-soft)] bg-[var(--surf-utility)] p-3">
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
            Showing {countsComputed ? recommendations.length : '—'} of {countsComputed ? allRecommendations.length : '—'}
          </Badge>
          <p className="font-medium text-foreground">
            Selected: {selected?.title ?? 'None'}
          </p>
        </div>
      </div>
      <p className="mt-2 px-1 text-xs text-[var(--text-tertiary)]">
        Rank by impact or urgency, then inspect, simulate, or defer.
      </p>
    </div>
  );

  const summaryItems = [
    {
      label: 'Recommended',
      value: countsComputed ? String(recommendations.length) : '—',
      detail: countsComputed ? 'Adapter-ranked recommendations' : 'Uncomputed',
    },
    {
      label: 'High impact',
      value: countsComputed ? String(
        recommendations.filter((item) => item.scoreBreakdown.impact >= 7).length
      ) : '—',
      detail: 'Strong leverage right now',
    },
    {
      label: 'Low friction',
      value: countsComputed ? String(
        recommendations.filter((item) => item.reversibility === 'high').length
      ) : '—',
      detail: 'Safe quick-command candidates',
    },
    {
      label: 'Verification',
      value: surface?.verificationRail[0]?.status ??
        (verificationPhase === 'pending' ? 'pending' :
          verificationPhase === 'failed' ? 'failed' : 'Unverified'),
      detail: 'Recorded verification lifecycle',
    },
  ];

  return (
    <WorkspaceScaffold
      title="Actions"
      subtitle="Execution console for COD-ranked interventions."
      statusLine={`Recommendations: ${availability} · sort: ${currentSort}`}
      actions={toolbar}
      summaryItems={summaryItems}
      primaryTitle="Recommended Actions"
      primarySubtitle="Ranked by urgency, impact, confidence, and reversibility."
      primary={
        <AmbientSurface className="rounded-2xl p-1">
        <div className="flex flex-col gap-4">
        <GuardrailBanner humanState={surface?.meta?.humanState} />
        {isLoading && !surface ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl border border-[var(--border-glass-soft)] bg-[var(--surf-base)]"
              />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <EmptyState
            title={availabilityMessage}
            description={countsComputed
              ? 'Once the queue refreshes, this lane will rank the best next moves.'
              : 'Recommendations are uncomputed. Read-only inspection does not authorize execution.'}
            action={
              <Link
                to="/work"
                className="inline-flex rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
              >
                Review Work
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p role="status" className="text-sm text-muted-foreground">{availabilityMessage}</p>
            {recommendations.map((item) => {
              const isExpanded = item.id === selectedId;
              return (
                <article
                  key={item.id}
                  className={[
                    'rounded-[22px] border transition',
                    isExpanded
                      ? 'border-[color-mix(in_srgb,var(--a-sky)_30%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_8%,var(--surf-base))] shadow-sm'
                      : 'border-[var(--border-glass-soft)] bg-[var(--surf-base)]',
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
                    className="w-full cursor-pointer rounded-[22px] p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold leading-snug text-[var(--text-primary)]">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                          {item.summary}
                        </p>
                      </div>
                      <Badge
                        variant="muted"
                        className="px-3 py-1 text-xs uppercase tracking-[0.2em] bg-[var(--surf-utility)] text-[var(--text-secondary)]"
                      >
                        {item.actionType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                          Why now
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                          {item.whyNow}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                          Expected effect
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                          {item.expectedEffect}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                          Score
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                          {item.score.toFixed(1)} / 10
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          Confidence {(item.confidence * 100).toFixed(0)}% ·{' '}
                          {item.reversibility} reversibility
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* ── inline detail panel ── */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border-glass-soft)] px-4 pb-4 pt-3 flex flex-col gap-4 text-sm text-[var(--text-secondary)]">
                      <div className="flex flex-wrap gap-2">
                        <PrimaryButton
                          type="button"
                          disabled
                          title="Execution requires fresh server authorization."
                          className="rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em]"
                        >
                          Execute
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
                        {item.taskPath && (
                          <Link
                            to="/note"
                            search={{ p: item.taskPath }}
                            className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
                          >
                            Open source note
                          </Link>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Execution requires fresh server authorization; cached and local rankings cannot authorize execution.
                      </p>

                      {/* Score breakdown */}
                      <SurfaceSectionCard
                        title="Score breakdown"
                        tone="neutral"
                      >
                        <div className="flex flex-col gap-2">
                          {Object.entries(item.scoreBreakdown).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between gap-3"
                              >
                                <span className="capitalize text-[var(--text-tertiary)]">
                                  {key.replace(/([A-Z])/g, ' $1')}
                                </span>
                                <span className="text-[var(--text-primary)]">
                                  {value}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </SurfaceSectionCard>

                      {/* Mutation path */}
                      <SurfaceSectionCard title="Mutation path" tone="neutral">
                        <p className="text-[var(--text-primary)]">
                          {item.mutationRef
                            ? `${item.mutationRef.domain} / ${item.mutationRef.operation}`
                            : 'Simulation only'}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                          Source entities: {item.sourceEntities.length}
                        </p>
                      </SurfaceSectionCard>

                      {/* Source signals */}
                      <SurfaceSectionCard title="Source signals" tone="neutral">
                        {item.sourceSignalIds.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {item.sourceSignalIds.map((signalId) => (
                              <span
                                key={signalId}
                                className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-utility)] px-3 py-1 text-xs text-[var(--text-secondary)]"
                              >
                                {signalId}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--text-tertiary)]">
                            No source signals surfaced.
                          </p>
                        )}
                      </SurfaceSectionCard>

                      {/* Verification preview */}
                      <SurfaceSectionCard
                        title="Verification preview"
                        tone="neutral"
                      >
                        {verificationPhase === 'pending' && (
                          <p className="text-sm text-[var(--text-info)]">
                            Verifying…
                          </p>
                        )}
                        {verificationPhase === 'failed' && (
                          <p className="text-sm text-[var(--text-danger)]">
                            Verification failed.
                          </p>
                        )}
                        {verificationCount > 0 ? (
                          <div className="flex flex-col gap-2">
                            {surface?.verificationRail.map((vItem) => (
                              <article
                                key={vItem.id}
                                className="rounded-[14px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                      {vItem.summary}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
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
                            No verification evidence recorded.
                          </p>
                        )}
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
        )}
        </div>
        </AmbientSurface>
      }
    />
  );
}
