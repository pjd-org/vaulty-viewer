import React from 'react'
import type { InboxItemDisplay } from '../../types/display'
import { PrimaryButton, SecondaryButton, IconButton, SoftChip } from '../ui'

interface InboxItemCardProps {
  item: InboxItemDisplay
  onInspect: () => void
  onPromote?: () => void
  onReject?: () => void
}

export function InboxItemCard({ item, onInspect, onPromote, onReject }: InboxItemCardProps) {
  return (
    <div className="genie-surface genie-surface--utility p-4 space-y-2 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-slate-800 flex-1 min-w-0 truncate">
          {item.title}
        </span>
        <SoftChip label={item.originLabel} variant="default" />
        {item.isBlocked && <SoftChip label="Blocked" variant="danger" />}
        {item.ageLabel && (
          <span className="text-xs text-slate-500 shrink-0" suppressHydrationWarning>
            {item.ageLabel}
          </span>
        )}
      </div>

      {item.contextSnippet && (
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
          {item.contextSnippet}
        </p>
      )}

      <div className="flex items-center gap-2">
        <SecondaryButton onClick={onInspect}>Inspect</SecondaryButton>
        {item.actions.includes('promote') && onPromote && (
          <PrimaryButton onClick={onPromote}>Promote</PrimaryButton>
        )}
        {onReject && (
          <IconButton
            icon={<span aria-hidden="true" className="text-base leading-none">×</span>}
            label="Reject"
            onClick={onReject}
            className="text-slate-500 hover:text-red-500"
          />
        )}
      </div>
    </div>
  )
}
