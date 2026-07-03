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
                      'block rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-4 transition',
                      active
                        ? 'border-[color-mix(in_srgb,var(--a-sky)_30%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_10%,var(--surf-base))] shadow-sm'
                        : 'hover:border-[var(--border-default)] hover:bg-[var(--surf-elevated)]',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-snug text-[var(--text-primary)]">
                          {item.title ?? item.id}
                        </h3>
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
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
            actions={
              <Link
                to="/project/$slug/tasks"
                params={{ slug }}
                search={{ ...search, selectedId: undefined }}
                className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
              >
                Open tasks
              </Link>
            }
          >
            {selectedItem ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold leading-snug text-[var(--text-primary)]">
                      {selectedItem.title ?? selectedItem.id}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {selectedItem.type}
                    </p>
                  </div>
                  {selectedItem.status && (
                    <SoftChip label={selectedItem.status} />
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                      ID
                    </p>
                    <p className="mt-2 break-all text-xs font-mono text-[var(--text-primary)]">
                      {selectedItem.id}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                      Project
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                      {slug}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/project/$slug/dependencies"
                    params={{ slug }}
                    search={{ ...search, selectedId: undefined }}
                    className="rounded-full border border-[color-mix(in_srgb,var(--a-sky)_30%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--a-sky)_18%,var(--surf-elevated))]"
                  >
                    Inspect dependencies
                  </Link>
                  <Link
                    to="/project/$slug/risks"
                    params={{ slug }}
                    search={{ ...search, selectedId: undefined }}
                    className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
                  >
                    View risks
                  </Link>
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
