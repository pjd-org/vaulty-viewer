import React from 'react'
import { Link } from '@tanstack/react-router'
import { isBlocked, type NextAction } from '../../../src/lib/focus-logic'
import { toTaskDisplayMeta } from '../../lib/display'
import { SoftPanel } from '../layout'
import { PrimaryButton, SecondaryButton, IconButton, SoftChip, StatusPill } from '../ui'

interface BestMoveCardProps {
  task: NextAction
  onStart: (t: NextAction) => void
  onSkip: (t: NextAction) => void
  onComplete: (t: NextAction) => void
  mutating: boolean
}

export function BestMoveCard({ task, onStart, onSkip, onComplete, mutating }: BestMoveCardProps) {
  const meta = toTaskDisplayMeta(task)
  const blocked = isBlocked(task)

  return (
    <SoftPanel className="bg-gradient-to-br from-[#f8f9ff] to-white">
      <Link
        to="/note"
        search={{ p: task.path }}
        className="text-xl font-semibold text-neutral-900 hover:text-primary transition-colors block"
      >
        {task.title}
      </Link>

      {task.description && (
        <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <SoftChip label={meta.durationLabel} />
        <SoftChip label={meta.focusLabel} />
        <SoftChip label={meta.effortLabel} />
        {blocked && <StatusPill status="blocked" />}
      </div>

      {blocked && (
        <p className="text-xs text-amber-600 mt-2">This task has dependencies</p>
      )}

      <div className="flex items-center gap-3 mt-4">
        <PrimaryButton onClick={() => onStart(task)} disabled={mutating}>
          Start
        </PrimaryButton>
        <SecondaryButton onClick={() => onComplete(task)} disabled={mutating}>
          Mark done
        </SecondaryButton>
        <IconButton icon={<span>×</span>} label="Skip task" onClick={() => onSkip(task)} />
      </div>
    </SoftPanel>
  )
}
