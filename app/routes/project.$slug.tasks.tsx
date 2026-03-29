import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { ProjectTabPlaceholder } from '../components/projects'

export const Route = createFileRoute('/project/$slug/tasks')({
  component: ProjectTasksRoute,
})

function ProjectTasksRoute() {
  return (
    <ProjectTabPlaceholder
      title="Project Tasks"
      description="Task queues, active work, and blockers for this project will render here."
    />
  )
}
