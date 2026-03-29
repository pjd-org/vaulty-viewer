import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectTabPlaceholder } from '../components/projects'

export const Route = createFileRoute('/project/$slug/risks')({
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
