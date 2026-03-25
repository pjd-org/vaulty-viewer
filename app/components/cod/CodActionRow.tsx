import React from 'react'
import { PrimaryButton, SecondaryButton } from '../ui'

interface CodActionRowProps {
  actions: string[]
  canWork: boolean
  maxSprintMin: number
  onCheckIn?: () => void
}

const PRIMARY_ACTIONS = new Set(['Start 25m sprint', 'Start full session', 'Plan 90m'])
const CHECKIN_ACTIONS = new Set(['Check in'])
const BROWSE_ACTIONS = new Set(['Browse safe tasks'])

export function CodActionRow({ actions, canWork, onCheckIn }: CodActionRowProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {actions.map((label) => {
        if (PRIMARY_ACTIONS.has(label)) {
          return (
            <PrimaryButton key={label} disabled={!canWork}>
              {label}
            </PrimaryButton>
          )
        }
        if (CHECKIN_ACTIONS.has(label)) {
          return (
            <SecondaryButton key={label} onClick={onCheckIn}>
              {label}
            </SecondaryButton>
          )
        }
        if (BROWSE_ACTIONS.has(label)) {
          return (
            <a key={label} href="/" className="bg-slate-100 text-slate-700 rounded-xl px-4 py-2 text-sm font-medium hover:bg-slate-200 transition-colors inline-block">
              {label}
            </a>
          )
        }
        return (
          <SecondaryButton key={label}>
            {label}
          </SecondaryButton>
        )
      })}
    </div>
  )
}
