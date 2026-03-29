import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { WorkspaceScaffold } from '../components/layout'
import { automationSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/automation')({
  validateSearch: automationSearchParams,
  component: AutomationRoute,
})

function AutomationRoute() {
  return (
    <WorkspaceScaffold
      title="Automation"
      subtitle="Pipelines, Huey, schedules, and runners in one machine-control lane."
      summaryItems={[
        { label: 'Pipelines', value: '4', detail: 'Simulated, pending, failed, applied' },
        { label: 'Huey', value: 'Healthy', detail: 'Queue health and worker posture' },
        { label: 'Stuck runs', value: '1', detail: 'Needs inspection' },
        { label: 'Schedules', value: '9', detail: 'Today and upcoming' },
      ]}
      primaryTitle="Operational Workspace"
      primarySubtitle="Phase 1 shell for tabs, filters, and scoped details."
      primary={
        <ul className="space-y-3 text-sm text-slate-300">
          <li>Pipelines, runners, Huey, and schedules now have a canonical home.</li>
          <li>Search params are reserved for tab, subtab, selection, and auto-refresh state.</li>
          <li>Phase 3 will connect these panes to runtime-backed tables and inspection flows.</li>
        </ul>
      }
      asideTitle="Detail Panel"
      asideSubtitle="Retry, inspect, and verification hooks live here."
      aside={
        <div className="space-y-3 text-sm text-slate-300">
          <p>The shell is ready for runner details, retry actions, and queue health overlays.</p>
          <p>Huey remains reachable directly at <code>/huey</code> during the transition.</p>
        </div>
      }
    />
  )
}
