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
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="h-20 animate-pulse rounded-[18px] border border-border bg-muted/20"
            />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-[18px] border border-border bg-muted/20" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Stat bar ── */}
      <div className="grid gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-utility)] p-4"
            >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              {s.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Severity partition bar ── */}
      {allRisks.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
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
            <div className="flex flex-col gap-3">
              {allRisks.map((risk) => {
                const active = selectedRisk?.id === risk.id;
                return (
                  <Link
                    key={risk.id}
                    to="/project/$slug/risks"
                    params={{ slug }}
                    search={{ ...search, selectedId: risk.id }}
                    className={[
                      'block rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-4 transition',
                      active
                        ? 'border-[color-mix(in_srgb,var(--a-sky)_30%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_10%,var(--surf-base))] shadow-sm'
                        : 'hover:border-[var(--border-default)] hover:bg-[var(--surf-elevated)]',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-snug text-[var(--text-primary)]">
                          {risk.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
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
        <div className="flex flex-col gap-4">
          <SoftPanel
            variant="utility"
            title="Selected Risk"
            subtitle="Detail and triage context for the selected risk signal."
            actions={
              <Link
                to="/project/$slug/dependencies"
                params={{ slug }}
                search={{ ...search, selectedId: selectedRisk?.id }}
                className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
              >
                View dependencies
              </Link>
            }
          >
            {selectedRisk ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold leading-snug text-[var(--text-primary)]">
                      {selectedRisk.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {selectedRisk.summary}
                    </p>
                  </div>
                  <SoftChip label={selectedRisk.severity} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                      Kind
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                      {selectedRisk.kind}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                      Severity
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                      {selectedRisk.severity}
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
                  {selectedRisk.whySurfaced}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/project/$slug/tasks"
                    params={{ slug }}
                    search={{ ...search, selectedId: undefined }}
                    className="rounded-full border border-[color-mix(in_srgb,var(--a-sky)_30%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--a-sky)_18%,var(--surf-elevated))]"
                  >
                    Open tasks
                  </Link>
                  <Link
                    to="/project/$slug/automation"
                    params={{ slug }}
                    search={{ ...search, selectedId: undefined }}
                    className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
                  >
                    Open automation
                  </Link>
                </div>
                {selectedRisk.confidence != null && (
                  <div className="rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                      Confidence
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--text-primary)] tabular-nums">
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
