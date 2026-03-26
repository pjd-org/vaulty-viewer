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
            <a key={label} href="/" className="text-primary hover:text-primary-2 underline-offset-2 hover:underline inline-block">
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
