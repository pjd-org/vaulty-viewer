import React from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';

import { SoftPanel } from '../components/layout';
import { EmptyState } from '../components/ui/EmptyState';
import { SoftChip } from '../components/ui/Chips';
import { GlassCard } from '../components/ui/glass-card';
import { GlassBadge } from '../components/ui/glass-badge';
import Timeline, {
  TimelineItem,
  TimelineItemTitle,
  TimelineItemDescription,
} from '../components/ui/timeline';
import { useProjectSurface } from '../lib/viewer-adapter';
import { projectSearchParams } from '../../src/lib/routes/search-params';

export const Route = createFileRoute('/project/$slug/timeline')({
  validateSearch: projectSearchParams,
  component: ProjectTimelineRoute,
});

// ---------------------------------------------------------------------------
// Status badge → glass variant
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const variant =
    lower === 'success' || lower === 'complete' || lower === 'done'
      ? 'success'
      : lower === 'warning' || lower === 'pending'
        ? 'warning'
        : lower === 'error' || lower === 'failed' || lower === 'rejected'
          ? 'destructive'
          : 'default';
  return (
    <GlassBadge variant={variant} size="sm">
      {status}
    </GlassBadge>
  );
}

// ---------------------------------------------------------------------------
// Stat card (glass)
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <GlassCard variant="light" glowEffect={false} className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton (glass)
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route component
// ---------------------------------------------------------------------------

function ProjectTimelineRoute() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { data: surface, isLoading } = useProjectSurface(slug);

  const timelineHints = surface?.timelineHints ?? [];
  const verificationRail = surface?.verificationRail ?? [];

  const selectedHint =
    timelineHints.find((h) => h.id === search.selectedId) ??
    timelineHints[0] ??
    null;

  const stats = [
    { label: 'Timeline Events', value: timelineHints.length },
    { label: 'Verifications', value: verificationRail.length },
    {
      label: 'Successful',
      value: verificationRail.filter((v) => v.status === 'success').length,
    },
    { label: 'Selected', value: selectedHint ? 1 : 0 },
  ];

  if (isLoading && !surface) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Stat bar ── */}
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        {/* ── Left: timeline events ── */}
        <SoftPanel
          variant="elevated"
          title="Timeline Events"
          subtitle="Project interventions, incidents, and key moments."
        >
          {timelineHints.length === 0 ? (
            <EmptyState
              title="No timeline events surfaced."
              description="When project interventions, incidents, or key moments are recorded they will appear here."
            />
          ) : (
            <Timeline
              orientation="vertical"
              alternating
              vertItemSpacing={130}
              vertItemMaxWidth={600}
              className="min-h-[560px]"
            >
              {timelineHints.map((hint) => {
                const active = selectedHint?.id === hint.id;
                return (
                  <TimelineItem
                    key={hint.id}
                    variant={active ? 'glass' : 'outline'}
                    hollow={!active}
                  >
                    <Link
                      to="/project/$slug/timeline"
                      params={{ slug }}
                      search={{ ...search, selectedId: hint.id }}
                      className="block"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <TimelineItemTitle>
                            {hint.title ?? hint.id}
                          </TimelineItemTitle>
                          {hint.type != null && (
                            <TimelineItemDescription>
                              {hint.type}
                            </TimelineItemDescription>
                          )}
                        </div>
                        {hint.status && <StatusBadge status={hint.status} />}
                      </div>
                    </Link>
                  </TimelineItem>
                );
              })}
            </Timeline>
          )}
        </SoftPanel>

        {/* ── Right: verification rail + detail ── */}
        <div className="flex flex-col gap-4">
          {/* Selected event detail */}
          <SoftPanel
            variant="utility"
            title="Selected Event"
            subtitle="Detail for the selected timeline event."
          >
            {selectedHint ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {selectedHint.title ?? selectedHint.id}
                    </h3>
                    {selectedHint.type != null && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedHint.type}
                      </p>
                    )}
                  </div>
                  {selectedHint.status && (
                    <StatusBadge status={selectedHint.status} />
                  )}
                </div>
                <GlassCard variant="light" glowEffect={false} className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
                    ID
                  </p>
                  <p className="mt-2 break-all text-xs font-mono text-white/80">
                    {selectedHint.id}
                  </p>
                </GlassCard>
              </div>
            ) : (
              <EmptyState
                title="No event selected."
                description="Pick a timeline event from the list to inspect its detail."
              />
            )}
          </SoftPanel>

          {/* Verification rail */}
          <SoftPanel
            variant="utility"
            title="Verification Rail"
            subtitle="Project verification outcomes."
          >
            {verificationRail.length === 0 ? (
              <EmptyState
                title="No verification outcomes."
                description="When project actions resolve, their verification history will appear here."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {verificationRail.map((v) => (
                  <GlassCard
                    key={v.id}
                    variant="light"
                    glowEffect={false}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-white/90">
                        {v.summary}
                      </p>
                      <StatusBadge status={v.status} />
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </SoftPanel>
        </div>
      </div>
    </div>
  );
}
