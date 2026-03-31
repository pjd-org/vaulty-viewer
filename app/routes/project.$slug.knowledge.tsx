import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectKnowledgeLaneShell } from '../components/projects'
import { projectSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/project/$slug/knowledge')({
  validateSearch: projectSearchParams,
  component: ProjectKnowledgeRoute,
})

function ProjectKnowledgeRoute() {
  const { slug } = Route.useParams()
  const { tab, selectedId, noteId, mode, templateId, memoryTab } = Route.useSearch()

  return (
    <ProjectKnowledgeLaneShell
      slug={slug}
      tab={tab}
      selectedId={selectedId}
      noteId={noteId}
      mode={mode}
      templateId={templateId}
      memoryTab={memoryTab}
    />
  )
}
