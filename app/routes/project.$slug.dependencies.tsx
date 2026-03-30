import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectTabPlaceholder } from '../components/projects'
import { projectSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/project/$slug/dependencies')({
  validateSearch: projectSearchParams,
  component: ProjectDependenciesRoute,
})

function ProjectDependenciesRoute() {
  return (
    <ProjectTabPlaceholder
      title="Project Dependencies"
      description="Upstream blockers, downstream impact, and unblock paths will render here."
    />
  )
}
