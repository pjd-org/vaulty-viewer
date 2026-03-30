import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectTabPlaceholder } from '../components/projects'
import { projectSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/project/$slug/timeline')({
  validateSearch: projectSearchParams,
  component: ProjectTimelineRoute,
})

function ProjectTimelineRoute() {
  return (
    <ProjectTabPlaceholder
      title="Project Timeline"
      description="Project interventions, incidents, and verification history will render here."
    />
  )
}
