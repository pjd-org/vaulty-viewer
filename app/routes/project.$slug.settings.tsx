import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectTabPlaceholder } from '../components/projects'

export const Route = createFileRoute('/project/$slug/settings')({
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
