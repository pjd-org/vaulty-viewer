import React from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';

import { SoftPanel } from '../components/layout';
import { EmptyState } from '../components/ui/EmptyState';
import { SoftChip } from '../components/ui/Chips';
import { useProjectSurface } from '../lib/viewer-adapter';
import { projectSearchParams } from '../../src/lib/routes/search-params';

export const Route = createFileRoute('/project/$slug/automation')({
  validateSearch: projectSearchParams,
  component: ProjectAutomationRoute,
});

function ProjectAutomationRoute() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { data: surface, isLoading } = useProjectSurface(slug);

  const pipelines = surface?.executionSnapshot.activePipelines ?? [];
  const runners = surface?.executionSnapshot.activeRunners ?? [];
  const primaryAgentJobs = surface?.executionSnapshot.primaryAgentJobs ?? [];
  const schedules = surface?.executionSnapshot.scheduleItems ?? [];

  const allItems = [...pipelines, ...runners, ...primaryAgentJobs, ...schedules];

  const selectedItem =
    allItems.find((item) => item.id === search.selectedId) ??
    allItems[0] ??
    null;

  const stats = [
    { label: 'Pipelines', value: pipelines.length },
    { label: 'Runners', value: runners.length },
    { label: 'Primary Agent Jobs', value: primaryAgentJobs.length },
    { label: 'Schedules', value: schedules.length },
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
            className="rounded-[18px] border border-border bg-card p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        {/* ── Left: item list ── */}
        <SoftPanel
          variant="elevated"
          title="Automation Queue"
          subtitle="Active pipelines, runners, Primary Agent jobs, and schedules for this project."
        >
          {allItems.length === 0 ? (
            <EmptyState
              title="No automation items surfaced."
              description="When pipelines, runners, or schedules are linked to this project they will appear here."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {allItems.map((item) => {
                const active = selectedItem?.id === item.id;
                return (
                  <Link
                    key={item.id}
                    to="/project/$slug/automation"
                    params={{ slug }}
                    search={{ ...search, selectedId: item.id }}
                    className={[
                      'block rounded-[18px] border border-border bg-card p-4 transition',
                      active
                        ? 'border-primary/30 bg-primary/10 shadow-sm'
                        : 'hover:border-border/80 hover:bg-muted/30',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {item.title ?? item.id}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.type}
                        </p>
                      </div>
                      {item.status && <SoftChip label={item.status} />}
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
            title="Selected Item"
            subtitle="Detail for the selected automation entity."
          >
            {selectedItem ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {selectedItem.title ?? selectedItem.id}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedItem.type}
                    </p>
                  </div>
                  {selectedItem.status && (
                    <SoftChip label={selectedItem.status} />
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-border bg-card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      ID
                    </p>
                    <p className="mt-2 break-all text-xs font-mono text-foreground">
                      {selectedItem.id}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-border bg-card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Project
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {slug}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No item selected."
                description="Pick an automation item from the queue to inspect its details."
              />
            )}
          </SoftPanel>
        </div>
      </div>
    </div>
  );
}
