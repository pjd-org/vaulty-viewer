import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectsWorkspace } from '../components/projects'
import { WorkspaceScaffold } from '../components/layout'
import { workSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/work')({
  validateSearch: workSearchParams,
  component: WorkRoute,
})

function WorkRoute() {
  return (
    <WorkspaceScaffold
      title="Work"
      subtitle="Durable execution lane for tasks, projects, and dependencies."
      summaryItems={[
        { label: 'Projects', value: 'Live', detail: 'Legacy projects index now lands here' },
        { label: 'Tasks', value: 'Queued', detail: 'Today, overdue, blocked, active' },
        { label: 'Dependencies', value: 'Tracked', detail: 'Unblock paths and bottlenecks' },
        { label: 'Scope', value: 'Portfolio', detail: 'Global work lane' },
      ]}
      primaryTitle="Projects"
      primarySubtitle="Compatibility-preserving project list while the work lane grows."
      primary={<ProjectsWorkspace />}
      asideTitle="Execution Notes"
      asideSubtitle="What ships in later phases."
      aside={
        <div className="space-y-3 text-sm text-slate-300">
          <p>Phase 1 keeps project discovery intact under the canonical <code>/work</code> route.</p>
          <p>Phase 3 adds the task and dependency workspaces beside this project surface.</p>
        </div>
      }
    />
  )
}
