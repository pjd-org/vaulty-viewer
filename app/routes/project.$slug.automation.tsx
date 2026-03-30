import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectTabPlaceholder } from '../components/projects'
import { projectSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/project/$slug/automation')({
  validateSearch: projectSearchParams,
  component: ProjectAutomationRoute,
})

function ProjectAutomationRoute() {
  return (
    <ProjectTabPlaceholder
      title="Project Automation"
      description="Project-linked pipelines, runs, schedules, and queue health will render here."
    />
  )
}
