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
  const hueyJobs = surface?.executionSnapshot.hueyJobs ?? [];
  const schedules = surface?.executionSnapshot.scheduleItems ?? [];

  const allItems = [...pipelines, ...runners, ...hueyJobs, ...schedules];

  const selectedItem =
    allItems.find((item) => item.id === search.selectedId) ??
    allItems[0] ??
    null;

  const stats = [
    { label: 'Pipelines', value: pipelines.length },
    { label: 'Runners', value: runners.length },
    { label: 'Huey Jobs', value: hueyJobs.length },
    { label: 'Schedules', value: schedules.length },
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
        {/* ── Left: item list ── */}
        <SoftPanel
          variant="elevated"
          title="Automation Queue"
          subtitle="Active pipelines, runners, Huey jobs, and schedules for this project."
        >
          {allItems.length === 0 ? (
            <EmptyState
              title="No automation items surfaced."
              description="When pipelines, runners, or schedules are linked to this project they will appear here."
            />
          ) : (
            <div className="space-y-3">
              {allItems.map((item) => {
                const active = selectedItem?.id === item.id;
                return (
                  <Link
                    key={item.id}
                    to="/project/$slug/automation"
                    params={{ slug }}
                    search={{ ...search, selectedId: item.id }}
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
                          {item.title ?? item.id}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
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
        <div className="space-y-4">
          <SoftPanel
            variant="utility"
            title="Selected Item"
            subtitle="Detail for the selected automation entity."
          >
            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">
                      {selectedItem.title ?? selectedItem.id}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedItem.type}
                    </p>
                  </div>
                  {selectedItem.status && (
                    <SoftChip label={selectedItem.status} />
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-slate-200 bg-black/3 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      ID
                    </p>
                    <p className="mt-2 text-xs font-mono text-slate-700 break-all">
                      {selectedItem.id}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-black/3 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Project
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
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
