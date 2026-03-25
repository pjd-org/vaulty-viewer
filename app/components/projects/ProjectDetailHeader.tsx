import React from 'react'
import { toProjectSummaryDisplay } from '../../lib/display'
import { SoftChip, SoftChipProps, MetaRow } from '../ui'
import { SoftPanel } from '../layout'
import type { ProjectSummary } from '../../../src/lib/projects-logic'

interface ProjectDetailHeaderProps {
  project: ProjectSummary
  taskCounts: {
    todo: number
    inProgress: number
    done: number
    blocked: number
  }
}

export function ProjectDetailHeader({ project, taskCounts }: ProjectDetailHeaderProps) {
  const display = toProjectSummaryDisplay(project)

  const variantMap: Record<typeof display.statusVariant, SoftChipProps['variant']> = {
    success: 'success',
    danger: 'danger',
    warning: 'warning',
    default: 'default',
  }

  const total = taskCounts.todo + taskCounts.inProgress + taskCounts.done + taskCounts.blocked
  const progressPercent = total > 0 ? Math.round((taskCounts.done / total) * 100) : 0

  const metaItems = [
    { label: `${taskCounts.todo} to do` },
    { label: `${taskCounts.inProgress} in progress` },
    { label: `${taskCounts.done} done` },
    ...(taskCounts.blocked > 0 ? [{ label: `${taskCounts.blocked} blocked` }] : []),
  ]

  return (
    <SoftPanel>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900 leading-tight">{display.title}</h2>
        <SoftChip
          label={display.statusLabel}
          variant={variantMap[display.statusVariant]}
          className="shrink-0 mt-0.5"
        />
      </div>

      <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#4f8cff] rounded-full transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">{display.progressText}</p>

      <MetaRow items={metaItems} className="mt-4" />
    </SoftPanel>
  )
}
