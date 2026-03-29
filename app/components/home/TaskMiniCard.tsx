import React from 'react'
import { Link } from '@tanstack/react-router'
import { type NextAction } from '../../../src/lib/focus-logic'
import { toTaskDisplayMeta } from '../../lib/display'
import { IconButton, SoftChip } from '../ui'

interface TaskMiniCardProps {
  task: NextAction
  onStart: (t: NextAction) => void
  onComplete: (t: NextAction) => void
}

export function TaskMiniCard({ task, onStart, onComplete }: TaskMiniCardProps) {
  const meta = toTaskDisplayMeta(task)

  return (
    <div className="genie-surface genie-surface--elevated px-4 py-3 flex items-center gap-4 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex-1 min-w-0">
        <Link
          to="/note"
          search={{ p: task.path }}
          className="text-sm font-medium text-slate-800 hover:text-sky-700 truncate block transition-colors"
        >
          {task.title}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <SoftChip label={meta.durationLabel} />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <IconButton icon={<span>▶</span>} label="Start task" onClick={() => onStart(task)} />
        <IconButton icon={<span>✓</span>} label="Complete task" onClick={() => onComplete(task)} />
      </div>
    </div>
  )
}
