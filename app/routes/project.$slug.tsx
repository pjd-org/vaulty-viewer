import React from 'react'
import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'

import { ProjectDetailScene } from '../components/projects'
import { ProjectRouteShell } from '../components/layout'
import { projectSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/project/$slug')({
  validateSearch: projectSearchParams,
  component: ProjectRoute,
})

function ProjectRoute() {
  const { slug } = Route.useParams()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const canonicalPath = `/project/${encodeURIComponent(slug)}`
  const isOverview = pathname === canonicalPath

  return (
    <ProjectRouteShell
      slug={slug}
      summaryItems={[
        { label: 'Scope', value: slug, detail: 'Project-scoped command center' },
        { label: 'Pressure', value: 'Live', detail: 'Scoped signals and queue items land here' },
        { label: 'Verification', value: 'Visible', detail: 'Project verification rail is reserved' },
        { label: 'Context', value: 'COD-selected', detail: 'Knowledge stays relevance-ranked' },
      ]}
    >
      {isOverview ? <ProjectDetailScene projectId={slug} /> : <Outlet />}
    </ProjectRouteShell>
  )
}
