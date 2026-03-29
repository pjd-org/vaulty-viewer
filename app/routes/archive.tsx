import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { WorkspaceScaffold } from '../components/layout'
import { archiveSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/archive')({
  validateSearch: archiveSearchParams,
  component: ArchiveRoute,
})

function ArchiveRoute() {
  return (
    <WorkspaceScaffold
      title="Archive"
      subtitle="Historical decisions, rejected artifacts, and completed operational context."
      summaryItems={[
        { label: 'Rejected', value: 'Split', detail: 'User and automated histories stay separate' },
        { label: 'Deferred', value: 'Kept', detail: 'Archived without losing context' },
        { label: 'Audit', value: 'Ready', detail: 'Timeline and archive link cleanly' },
        { label: 'Search', value: 'URL-backed', detail: 'Source and selection params reserved' },
      ]}
      primaryTitle="Archive Workspace"
      primarySubtitle="Historical queues and archived interventions."
      primary={
        <p className="text-sm text-slate-300">
          Archive is now a first-class route instead of being trapped inside other views.
        </p>
      }
      asideTitle="Archive Detail"
      asideSubtitle="Why it was archived and what can be reopened."
      aside={<p className="text-sm text-slate-300">Selection-driven archive detail renders here.</p>}
    />
  )
}
