import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectTabPlaceholder } from '../components/projects'
import { projectSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/project/$slug/settings')({
  validateSearch: projectSearchParams,
  component: ProjectSettingsRoute,
})

function ProjectSettingsRoute() {
  return (
    <ProjectTabPlaceholder
      title="Project Settings"
      description="Project-specific scoring, source, and preference controls will render here."
    />
  )
}
