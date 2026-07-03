import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { SoftPanel } from '../components/layout';
import { EmptyState } from '../components/ui/EmptyState';
import { SoftChip } from '../components/ui/Chips';
import { useProjectSurface } from '../lib/viewer-adapter';
import { projectSearchParams } from '../../src/lib/routes/search-params';

export const Route = createFileRoute('/project/$slug/settings')({
  validateSearch: projectSearchParams,
  component: ProjectSettingsRoute,
});

function ProjectSettingsRoute() {
  const { slug } = Route.useParams();
  const { data: surface } = useProjectSurface(slug);

  const projectId = surface?.projectId ?? slug;
  const taskCount = surface?.executionSnapshot.activeTasks.length ?? 0;
  const surfaceScope = 'project';

  const sections = [
    {
      label: 'Project ID',
      value: projectId,
      hint: 'The canonical slug used to identify this project across the vault.',
    },
    {
      label: 'Scoring Model',
      value: 'COD default',
      hint: 'Priority, urgency, and impact weights applied by the COD layer.',
    },
    {
      label: 'Source',
      value: 'Vault adapter',
      hint: 'Where project data originates — live vault sync via the adapter layer.',
    },
    {
      label: 'Surface Scope',
      value: surfaceScope,
      hint: 'Signals and recommendations are scoped to this project only.',
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Summary stat bar ── */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Project', value: projectId },
          { label: 'Active Tasks', value: taskCount },
          { label: 'Source', value: 'Vault' },
          { label: 'Scope', value: surfaceScope },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[18px] border border-border bg-muted/40 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-2 truncate text-sm font-semibold text-foreground">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        {/* ── Left: settings fields ── */}
        <SoftPanel
          variant="elevated"
          title="Project Configuration"
          subtitle="Read-only view of project-scoped scoring, source, and preference controls."
        >
          <div className="flex flex-col gap-3">
            {sections.map((section) => (
              <div
                key={section.label}
                className="rounded-[18px] border border-border bg-muted/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {section.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {section.value}
                    </p>
                  </div>
                  <SoftChip label="read-only" />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {section.hint}
                </p>
              </div>
            ))}
          </div>
        </SoftPanel>

        {/* ── Right: info panel ── */}
        <div className="flex flex-col gap-4">
          <SoftPanel
            variant="utility"
            title="Settings Info"
            subtitle="How project settings are applied."
          >
            <EmptyState
              title="Settings are managed via the vault."
              description="Project-scoped scoring weights, source routing, and preference overrides are applied through the vault adapter layer. Editable controls will surface here once the settings API is available."
            />
          </SoftPanel>
        </div>
      </div>
    </div>
  );
}
