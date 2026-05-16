import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { GlassSurface } from '@vault/ui';

import { WorkspaceScaffold } from '../components/layout';
import { ThemeSelector } from '../components/settings/ThemeSelector';
import { DensitySelector } from '../components/settings/DensitySelector';
import { SidebarCollapseToggle } from '../components/settings/SidebarCollapseToggle';
import { ConfigAdminPanel } from '../components/config/ConfigAdminPanel';
import { readStringSearchParam } from '../../src/lib/routes/search-params';

export const Route = createFileRoute('/settings')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: readStringSearchParam(search.tab),
  }),
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <WorkspaceScaffold
      title="Settings"
      subtitle="Scoring, alerts, commands, sources, and viewer preferences."
      summaryItems={[
        {
          label: 'Scoring',
          value: 'Scoped',
          detail: 'Viewer-level settings route',
        },
        { label: 'Alerts', value: 'Reserved', detail: 'Future control pane' },
        {
          label: 'Commands',
          value: 'Ready',
          detail: 'Global shell slot established',
        },
        {
          label: 'Preferences',
          value: 'Live',
          detail: 'Density and shell choices can land here',
        },
      ]}
      primaryTitle="Settings Workspace"
      primarySubtitle="Preference groups and control forms."
      primary={
        <div className="flex flex-col gap-6">
          <GlassSurface as="section" variant="canvas" radius="2xl" shadow="sm" border="default" className="p-4">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Navigation
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Sidebar is collapsed to icons. Use the sidebar toggle to expand
              labels.
            </p>
          </GlassSurface>
          <GlassSurface as="section" variant="canvas" radius="2xl" shadow="sm" border="default" className="p-4">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Theme
            </h3>
            <ThemeSelector />
          </GlassSurface>
          <GlassSurface as="section" variant="canvas" radius="2xl" shadow="sm" border="default" className="p-4">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Layout density
            </h3>
            <DensitySelector />
          </GlassSurface>
          <GlassSurface as="section" variant="canvas" radius="2xl" shadow="sm" border="default" className="p-4">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Sidebar
            </h3>
            <SidebarCollapseToggle />
          </GlassSurface>
          <ConfigAdminPanel />
        </div>
      }
      asideTitle="Preview Panel"
      asideSubtitle="How changes affect the shell."
      aside={
        <GlassSurface variant="canvas" radius="2xl" shadow="sm" border="default" className="p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Selected settings previews will render here.
          </p>
        </GlassSurface>
      }
    />
  );
}
