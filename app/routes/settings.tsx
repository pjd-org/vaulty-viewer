import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { WorkspaceScaffold } from '../components/layout'
import { readStringSearchParam } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/settings')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: readStringSearchParam(search.tab),
  }),
  component: SettingsRoute,
})

function SettingsRoute() {
  return (
    <WorkspaceScaffold
      title="Settings"
      subtitle="Scoring, alerts, commands, sources, and viewer preferences."
      summaryItems={[
        { label: 'Scoring', value: 'Scoped', detail: 'Viewer-level settings route' },
        { label: 'Alerts', value: 'Reserved', detail: 'Future control pane' },
        { label: 'Commands', value: 'Ready', detail: 'Global shell slot established' },
        { label: 'Preferences', value: 'Live', detail: 'Density and shell choices can land here' },
      ]}
      primaryTitle="Settings Workspace"
      primarySubtitle="Preference groups and control forms."
      primary={<p className="text-sm text-slate-300">Settings now has a canonical route and search contract.</p>}
      asideTitle="Preview Panel"
      asideSubtitle="How changes affect the shell."
      aside={<p className="text-sm text-slate-300">Selected settings previews will render here.</p>}
    />
  )
}
