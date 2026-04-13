import React from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';

import { SoftPanel } from '../components/layout';
import { EmptyState } from '../components/ui/EmptyState';
import { SoftChip } from '../components/ui/Chips';
import Timeline, {
  TimelineItem,
  TimelineItemDate,
  TimelineItemTitle,
  TimelineItemDescription,
} from '../components/ui/timeline';
import { useProjectSurface } from '../lib/viewer-adapter';
import { projectSearchParams } from '../../src/lib/routes/search-params';

export const Route = createFileRoute('/project/$slug/timeline')({
  validateSearch: projectSearchParams,
  component: ProjectTimelineRoute,
});

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
              alternating={false}
              alignment="top/left"
              noCards={false}
              vertItemSpacing={110}
              vertItemMaxWidth={600}
            >
              {timelineHints.map((hint) => {
                const active = selectedHint?.id === hint.id;
                return (
                  <TimelineItem
                    key={hint.id}
                    variant={active ? 'default' : 'outline'}
                    className={
                      active
                        ? 'border-sky-300 bg-sky-50 shadow-[0_18px_45px_rgba(56,189,248,0.10)]'
                        : undefined
                    }
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
                        {hint.status && <SoftChip label={hint.status} />}
                      </div>
                    </Link>
                  </TimelineItem>
                );
              })}
            </Timeline>
          )}
        </SoftPanel>

        {/* ── Right: verification rail + detail ── */}
        <div className="space-y-4">
          <SoftPanel
            variant="utility"
            title="Selected Event"
            subtitle="Detail for the selected timeline event."
          >
            {selectedHint ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">
                      {selectedHint.title ?? selectedHint.id}
                    </h3>
                    {selectedHint.type != null && (
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedHint.type}
                      </p>
                    )}
                  </div>
                  {selectedHint.status && (
                    <SoftChip label={selectedHint.status} />
                  )}
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-black/3 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    ID
                  </p>
                  <p className="mt-2 text-xs font-mono text-slate-700 break-all">
                    {selectedHint.id}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No event selected."
                description="Pick a timeline event from the list to inspect its detail."
              />
            )}
          </SoftPanel>

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
              <div className="space-y-3">
                {verificationRail.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-[18px] border border-slate-200 bg-black/3 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {v.summary}
                      </p>
                      <SoftChip label={v.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SoftPanel>
        </div>
      </div>
    </div>
  );
}
