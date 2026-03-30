import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectTabPlaceholder } from '../components/projects'
import { projectSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/project/$slug/risks')({
  validateSearch: projectSearchParams,
  component: ProjectRisksRoute,
})

function ProjectRisksRoute() {
  return (
    <ProjectTabPlaceholder
      title="Project Risks"
      description="Risk summaries, momentum changes, and mitigation plans will render here."
    />
  )
}
