import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectTabPlaceholder } from '../components/projects'

export const Route = createFileRoute('/project/$slug/dependencies')({
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
