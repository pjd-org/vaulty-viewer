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
    <div className="rounded-2xl border border-neutral-200 bg-surface p-4 space-y-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-neutral-900 flex-1 min-w-0 truncate">
          {item.title}
        </span>
        <SoftChip label={item.originLabel} variant="default" />
        {item.isBlocked && <SoftChip label="Blocked" variant="danger" />}
        <span className="text-xs text-neutral-400 shrink-0">{item.ageLabel}</span>
      </div>

      {item.contextSnippet && (
        <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2">
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
            className="text-slate-400 hover:text-red-500"
          />
        )}
      </div>
    </div>
  )
}
