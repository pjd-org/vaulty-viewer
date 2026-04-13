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

export const Route = createFileRoute('/project/$slug/risks')({
  validateSearch: projectSearchParams,
  component: ProjectRisksRoute,
});

function ProjectRisksRoute() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { data: surface, isLoading } = useProjectSurface(slug);

  const allRisks = surface?.pressureBand ?? [];

  const critical = allRisks.filter((s) => s.severity === 'critical');
  const high = allRisks.filter((s) => s.severity === 'high');
  const other = allRisks.filter(
    (s) => s.severity !== 'critical' && s.severity !== 'high'
  );

  const selectedRisk =
    allRisks.find((s) => s.id === search.selectedId) ?? allRisks[0] ?? null;

  const stats = [
    { label: 'Total', value: allRisks.length },
    { label: 'Critical', value: critical.length },
    { label: 'High', value: high.length },
    { label: 'Selected', value: selectedRisk ? 1 : 0 },
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
      {allRisks.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Severity Breakdown
          </p>
          <PartitionBar size="sm" gap={1} data-testid="severity-partition-bar">
            {critical.length > 0 && (
              <PartitionBarSegment
                num={critical.length}
                variant="destructive"
                alignment="center"
              >
                <PartitionBarSegmentTitle>
                  {critical.length}
                </PartitionBarSegmentTitle>
                <PartitionBarSegmentValue>Critical</PartitionBarSegmentValue>
              </PartitionBarSegment>
            )}
            {high.length > 0 && (
              <PartitionBarSegment
                num={high.length}
                variant="secondary"
                alignment="center"
              >
                <PartitionBarSegmentTitle>
                  {high.length}
                </PartitionBarSegmentTitle>
                <PartitionBarSegmentValue>High</PartitionBarSegmentValue>
              </PartitionBarSegment>
            )}
            {other.length > 0 && (
              <PartitionBarSegment
                num={other.length}
                variant="muted"
                alignment="center"
              >
                <PartitionBarSegmentTitle>
                  {other.length}
                </PartitionBarSegmentTitle>
                <PartitionBarSegmentValue>Other</PartitionBarSegmentValue>
              </PartitionBarSegment>
            )}
          </PartitionBar>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <SoftPanel
          variant="elevated"
          title="Risk Register"
          subtitle="Pressure signals and dependency risks surfaced for this project."
        >
          {allRisks.length === 0 ? (
            <EmptyState
              title="No risks surfaced."
              description="When project pressure or dependency risks are detected they will appear here."
            />
          ) : (
            <div className="space-y-3">
              {allRisks.map((risk) => {
                const active = selectedRisk?.id === risk.id;
                return (
                  <Link
                    key={risk.id}
                    to="/project/$slug/risks"
                    params={{ slug }}
                    search={{ ...search, selectedId: risk.id }}
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
                          {risk.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {risk.summary}
                        </p>
                      </div>
                      <SoftChip label={risk.severity} />
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
            title="Selected Risk"
            subtitle="Detail and triage context for the selected risk signal."
          >
            {selectedRisk ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">
                      {selectedRisk.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedRisk.summary}
                    </p>
                  </div>
                  <SoftChip label={selectedRisk.severity} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-slate-200 bg-black/3 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Kind
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedRisk.kind}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-black/3 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Severity
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedRisk.severity}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {selectedRisk.whySurfaced}
                </p>
                {selectedRisk.confidence != null && (
                  <div className="rounded-[18px] border border-slate-200 bg-black/3 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Confidence
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {Math.round(selectedRisk.confidence * 100)}%
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="No risk selected."
                description="Pick a risk from the register to inspect its triage context."
              />
            )}
          </SoftPanel>
        </div>
      </div>
    </div>
  );
}
