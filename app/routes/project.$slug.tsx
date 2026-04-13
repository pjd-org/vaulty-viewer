import React from 'react'
import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'

import { ProjectDetailScene } from '../components/projects'
import { ProjectRouteShell } from '../components/layout'
import { useLoginRedirectOnUnauthenticated } from '../hooks/use-login-redirect'
import {
  getProjectSurfaceQueryOptions,
  useProjectSurface,
} from '../lib/viewer-adapter'
import { getAllTasksQueryOptions } from '../lib/queries/tasks'
import { getProjectQueryOptions } from '../lib/api/projects'
import { projectSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/project/$slug')({
  validateSearch: projectSearchParams,
  loader: async ({ params, context }) => {
    const projectId = params.slug
    await Promise.all([
      context.queryClient.ensureQueryData(getProjectQueryOptions(projectId)),
      context.queryClient.ensureQueryData(getAllTasksQueryOptions()),
      context.queryClient.ensureQueryData(getProjectSurfaceQueryOptions(projectId)),
    ])
  },
  component: ProjectRoute,
})

function ProjectRoute() {
  const { slug } = Route.useParams()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const canonicalPath = `/project/${encodeURIComponent(slug)}`
  const isOverview = pathname === canonicalPath
  const { data: summarySurface, isLoading, error } = useProjectSurface(slug)
  const isUnauthenticated = useLoginRedirectOnUnauthenticated(error)

  if (isUnauthenticated) return null

  const summaryItems = [
    {
      label: 'Scope',
      value: slug,
      detail: 'Project-scoped command center',
    },
    {
      label: 'Pressure',
      value: isLoading && !summarySurface ? 'Loading' : String(summarySurface?.pressureBand.length ?? 0),
      detail: 'Scoped signals currently surfaced',
    },
    {
      label: 'Queue',
      value: isLoading && !summarySurface ? 'Loading' : String(summarySurface?.decisionQueue.length ?? 0),
      detail: 'COD-ranked next moves',
    },
    {
      label: 'Verification',
      value:
        isLoading && !summarySurface
          ? 'Loading'
          : summarySurface?.verificationRail.length
            ? 'Active'
            : 'Ready',
      detail: 'Project feedback loop',
    },
  ]

  return (
    <ProjectRouteShell
      slug={slug}
      summaryItems={summaryItems}
      projectSurface={summarySurface ?? null}
    >
      {isOverview ? (
        <ProjectDetailScene projectId={slug} />
      ) : (
        <Outlet />
      )}
    </ProjectRouteShell>
  )
}
