import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectTabPlaceholder } from '../components/projects'

export const Route = createFileRoute('/project/$slug/knowledge')({
  component: ProjectKnowledgeRoute,
})

function ProjectKnowledgeRoute() {
  return (
    <ProjectTabPlaceholder
      title="Project Knowledge"
      description="Scoped notes, memories, and COD-selected context for this project will render here."
    />
  )
}
