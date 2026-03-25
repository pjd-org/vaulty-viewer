import React from 'react'
import { toProjectSummaryDisplay } from '../../lib/display'
import { SoftChip, SoftChipProps } from '../ui'
import type { ProjectSummary } from '../../../src/lib/projects-logic'

interface ProjectCardProps {
  project: ProjectSummary
  onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const display = toProjectSummaryDisplay(project)

  const variantMap: Record<typeof display.statusVariant, SoftChipProps['variant']> = {
    success: 'success',
    danger: 'danger',
    warning: 'warning',
    default: 'default',
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#4f8cff]/30 hover:shadow-sm transition-all cursor-pointer group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#4f8cff] leading-snug">
          {display.title}
        </h3>
        <SoftChip
          label={display.statusLabel}
          variant={variantMap[display.statusVariant]}
          className="shrink-0"
        />
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#4f8cff] rounded-full transition-all"
          style={{ width: `${display.progressPercent}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">{display.progressText}</p>

      {/* Best move */}
      {display.bestMoveTitle && (
        <p className="mt-3 text-sm text-slate-600 truncate">
          <span className="text-slate-400">→ </span>
          {display.bestMoveTitle}
        </p>
      )}

      {/* ETA chip */}
      {display.etaLabel && (
        <div className="mt-2">
          <SoftChip label={display.etaLabel} className="text-[11px] px-2 py-0.5" />
        </div>
      )}
    </div>
  )
}
