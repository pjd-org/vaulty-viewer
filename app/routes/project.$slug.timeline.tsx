import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectTabPlaceholder } from '../components/projects'

export const Route = createFileRoute('/project/$slug/timeline')({
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
