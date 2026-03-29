import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useAllTasks } from '../../lib/queries/tasks'
import {
  deriveProjects,
  getProjectTasks,
  type ProjectSummary,
} from '../../../src/lib/projects-logic'
import { SoftPanel } from '../layout'
import { EmptyState } from '../ui'
import SkeletonCard from '../ui/SkeletonCard'
import { BlockersRail, ProjectBoardSection, ProjectDetailHeader } from '.'
import { fetchProjectById } from '../../lib/api/projects'

export function ProjectDetailScene({ projectId }: { projectId: string }) {
  const { data: projectDisplay, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId),
    enabled: !!projectId,
    staleTime: 60_000,
    retry: 1,
  })

  const { data: allTasks = [], isLoading: tasksLoading } = useAllTasks()

  const projectTasks = useMemo(
    () => getProjectTasks(allTasks, projectId),
    [allTasks, projectId],
  )

  const projects = useMemo(() => deriveProjects(allTasks), [allTasks])
  const derivedProject = projects.find((project) => project.id === projectId)

  const project: ProjectSummary | undefined = useMemo(() => {
    if (projectDisplay) {
      return {
        id: projectDisplay.id,
        title: projectDisplay.title,
        status: projectDisplay.statusVariant === 'success' ? 'completed' : 'active',
        progress: (projectDisplay.progressPercent ?? 0) / 100,
        priority: derivedProject?.priority ?? 0,
        taskCounts: derivedProject?.taskCounts ?? {
          total: projectTasks.length,
          done: projectTasks.filter((task) => task.status === 'done').length,
          inProgress: projectTasks.filter((task) => task.status === 'in-progress').length,
          blocked: projectTasks.filter((task) => task.status === 'blocked').length,
          todo: projectTasks.filter(
            (task) => !['done', 'in-progress', 'blocked'].includes(task.status),
          ).length,
        },
      }
    }

    return derivedProject
  }, [derivedProject, projectDisplay, projectTasks])

  const blockedTasks = useMemo(
    () => projectTasks.filter((task) => task.status === 'blocked'),
    [projectTasks],
  )

  const anyLoading = tasksLoading || projectLoading

  if (anyLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-4">
          <SkeletonCard />
          <SoftPanel variant="utility">
            <EmptyState title="Related notes coming soon" />
          </SoftPanel>
        </div>
      </div>
    )
  }

  if (!project) {
    return <EmptyState title={`Project "${projectId}" not found.`} />
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
      <div className="space-y-6">
        <ProjectDetailHeader project={project} />
        <ProjectBoardSection tasks={projectTasks} projectId={projectId} />
      </div>
      <div className="space-y-4">
        <BlockersRail blockedTasks={blockedTasks} />
        <SoftPanel variant="utility">
          <EmptyState title="Related notes coming soon" />
        </SoftPanel>
      </div>
    </div>
  )
}
