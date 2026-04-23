import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import { ThemeSelector } from '../components/settings/ThemeSelector';
import { DensitySelector } from '../components/settings/DensitySelector';
import { SidebarCollapseToggle } from '../components/settings/SidebarCollapseToggle';
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
          <section className="genie-surface genie-surface--utility rounded-[20px] p-4">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Theme
            </h3>
            <ThemeSelector />
          </section>
          <section className="genie-surface genie-surface--utility rounded-[20px] p-4">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Layout density
            </h3>
            <DensitySelector />
          </section>
          <section className="genie-surface genie-surface--utility rounded-[20px] p-4">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Sidebar
            </h3>
            <SidebarCollapseToggle />
          </section>
        </div>
      }
      asideTitle="Preview Panel"
      asideSubtitle="How changes affect the shell."
      aside={
        <div className="genie-surface genie-surface--utility rounded-[20px] p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Selected settings previews will render here.
          </p>
        </div>
      }
    />
  );
}
