import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { WorkspaceScaffold } from '../components/layout'
import { timelineSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/timeline')({
  validateSearch: timelineSearchParams,
  component: TimelineRoute,
})

function TimelineRoute() {
  return (
    <WorkspaceScaffold
      title="Timeline"
      subtitle="Replay and audit surface for interventions, incidents, rejections, and runs."
      summaryItems={[
        { label: 'Mode', value: 'Audit', detail: 'Live and replay params reserved' },
        { label: 'Interventions', value: 'Tracked', detail: 'Verification-aware stream' },
        { label: 'Rejections', value: 'Split', detail: 'User vs automated stays distinct' },
        { label: 'Runs', value: 'Linked', detail: 'Huey, pipelines, schedules, agents' },
      ]}
      primaryTitle="Event Stream"
      primarySubtitle="Timeline list and filter controls."
      primary={<p className="text-sm text-slate-300">Timeline now has a stable path and query surface for live/audit modes.</p>}
      asideTitle="Event Detail"
      asideSubtitle="Before/after state, actors, context, and replay."
      aside={<p className="text-sm text-slate-300">Detailed event inspection lands here.</p>}
    />
  )
}
