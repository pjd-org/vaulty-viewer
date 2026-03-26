import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageFrame, PageContainer } from '../components/layout'
import { CodModal } from '../components/cod'
import { useSystemSummarizerQuery } from '../lib/queries/agents'
import { fetchAllTasks } from '../lib/api/tasks'
import { fetchProjects } from '../lib/api/projects'

export const Route = createFileRoute('/cod-status')({
  component: CODStatusRoute,
})

function CODStatusRoute() {
  const { data: tasks } = useQuery({ queryKey: ['tasks'], queryFn: fetchAllTasks, staleTime: 1000 * 60 })
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects, staleTime: 1000 * 60 })

  const agentTasks = (tasks ?? []).map((t: { id: string; title: string; status?: string; estimatedTimeMin?: number | null }) => ({
    id: t.id,
    title: t.title,
    status: t.status ?? undefined,
    priority: undefined,
    estimatedMin: t.estimatedTimeMin ?? undefined,
    project: undefined,
  }))

  const agentProjects = (projects ?? []).map((p) => ({
    id: p.id ?? p.title,
    title: p.title,
  }))

  const { data: summaryData } = useSystemSummarizerQuery(agentTasks, agentProjects, {
    enabled: agentTasks.length > 0,
  })

  return (
    <PageContainer>
      <PageFrame title="Readiness" subtitle="Can you work now, and under what constraints?">
        {summaryData?.summary && summaryData.summary.length > 0 && (
          <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">System State</p>
            <ul className="space-y-1">
              {summaryData.summary.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        )}
        <CodModal />
      </PageFrame>
    </PageContainer>
  )
}
