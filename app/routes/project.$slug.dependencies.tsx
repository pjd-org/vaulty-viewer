import React from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';

import { SoftPanel } from '../components/layout';
import { EmptyState } from '../components/ui/EmptyState';
import { SoftChip } from '../components/ui/Chips';
import PartitionBar, {
  PartitionBarSegment,
  PartitionBarSegmentTitle,
  PartitionBarSegmentValue,
} from '../components/ui/partition-bar';
import { useProjectSurface } from '../lib/viewer-adapter';
import { projectSearchParams } from '../../src/lib/routes/search-params';

export const Route = createFileRoute('/project/$slug/dependencies')({
  validateSearch: projectSearchParams,
  component: ProjectDependenciesRoute,
});

function ProjectDependenciesRoute() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { data: surface, isLoading } = useProjectSurface(slug);

  const blockers = surface?.dependencyRiskSignals ?? [];
  const allSignals = blockers;

  const criticalBlockers = blockers.filter((s) => s.severity === 'critical');
  const highBlockers = blockers.filter((s) => s.severity === 'high');
  const otherBlockers = blockers.filter(
    (s) => s.severity !== 'critical' && s.severity !== 'high'
  );

  const selectedSignal =
    allSignals.find((s) => s.id === search.selectedId) ?? allSignals[0] ?? null;

  const stats = [
    { label: 'Total', value: allSignals.length },
    { label: 'Blockers', value: blockers.length },
    {
      label: 'Critical',
      value: blockers.filter((s) => s.severity === 'critical').length,
    },
    { label: 'Selected', value: selectedSignal ? 1 : 0 },
  ];

  if (isLoading && !surface) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="h-20 animate-pulse rounded-[18px] border border-slate-200 bg-black/3"
            />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-[18px] border border-slate-200 bg-black/3" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Stat bar ── */}
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-[18px] border border-slate-200 bg-black/3 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {s.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-800">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Severity partition bar ── */}
      {allSignals.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Severity Breakdown
          </p>
          <PartitionBar
            size="sm"
            gap={1}
            data-testid="dep-severity-partition-bar"
          >
            {criticalBlockers.length > 0 && (
              <PartitionBarSegment
                num={criticalBlockers.length}
                variant="destructive"
                alignment="center"
              >
                <PartitionBarSegmentTitle>
                  {criticalBlockers.length}
                </PartitionBarSegmentTitle>
                <PartitionBarSegmentValue>Critical</PartitionBarSegmentValue>
              </PartitionBarSegment>
            )}
            {highBlockers.length > 0 && (
              <PartitionBarSegment
                num={highBlockers.length}
                variant="secondary"
                alignment="center"
              >
                <PartitionBarSegmentTitle>
                  {highBlockers.length}
                </PartitionBarSegmentTitle>
                <PartitionBarSegmentValue>High</PartitionBarSegmentValue>
              </PartitionBarSegment>
            )}
            {otherBlockers.length > 0 && (
              <PartitionBarSegment
                num={otherBlockers.length}
                variant="muted"
                alignment="center"
              >
                <PartitionBarSegmentTitle>
                  {otherBlockers.length}
                </PartitionBarSegmentTitle>
                <PartitionBarSegmentValue>Other</PartitionBarSegmentValue>
              </PartitionBarSegment>
            )}
          </PartitionBar>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        {/* ── Left: signal list ── */}
        <SoftPanel
          variant="elevated"
          title="Dependency Signals"
          subtitle="Upstream blockers and dependency risk signals for this project."
        >
          {allSignals.length === 0 ? (
            <EmptyState
              title="No dependency signals surfaced."
              description="When upstream blockers or dependency risks are detected they will appear here."
            />
          ) : (
            <div className="space-y-3">
              {allSignals.map((signal) => {
                const active = selectedSignal?.id === signal.id;
                return (
                  <Link
                    key={signal.id}
                    to="/project/$slug/dependencies"
                    params={{ slug }}
                    search={{ ...search, selectedId: signal.id }}
                    className={[
                      'block rounded-[18px] border p-4 transition',
                      active
                        ? 'border-sky-300 bg-sky-50 shadow-[0_18px_45px_rgba(56,189,248,0.10)]'
                        : 'border-slate-200 bg-black/3 hover:border-slate-300 hover:bg-black/5',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          {signal.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {signal.summary}
                        </p>
                      </div>
                      <SoftChip label={signal.kind} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </SoftPanel>

        {/* ── Right: detail ── */}
        <div className="space-y-4">
          <SoftPanel
            variant="utility"
            title="Selected Signal"
            subtitle="Detail for the selected dependency risk signal."
          >
            {selectedSignal ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">
                      {selectedSignal.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedSignal.summary}
                    </p>
                  </div>
                  <SoftChip label={selectedSignal.severity} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-slate-200 bg-black/3 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Kind
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedSignal.kind}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-black/3 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Severity
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedSignal.severity}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {selectedSignal.whySurfaced}
                </p>
              </div>
            ) : (
              <EmptyState
                title="No signal selected."
                description="Pick a dependency signal from the list to inspect its detail."
              />
            )}
          </SoftPanel>
        </div>
      </div>
    </div>
  );
}
