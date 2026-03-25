import React from 'react'
import { SoftPanel } from '../layout'
import { SoftChip, PrimaryButton, SecondaryButton } from '../ui'
import type { NoteHeaderDisplay } from '../../types/display'

interface NoteHeaderProps {
  display: NoteHeaderDisplay
  onAction?: (action: string) => void
  extraActions?: React.ReactNode
}

export function NoteHeader({ display, onAction, extraActions }: NoteHeaderProps) {
  const hasActions = display.primaryActions.length > 0 || Boolean(extraActions)

  return (
    <SoftPanel>
      {/* Breadcrumbs + type chip */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          {display.breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.path ?? crumb.label}>
              {i > 0 && <span className="opacity-50 mx-0.5">/</span>}
              <span>{crumb.label}</span>
            </React.Fragment>
          ))}
        </div>
        <SoftChip label={display.typeLabel} variant="default" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-slate-900 mt-2 leading-snug">
        {display.title}
      </h1>

      {/* Status chip */}
      {display.statusLabel && (
        <div className="mt-2">
          <SoftChip label={display.statusLabel} variant={display.statusVariant} />
        </div>
      )}

      {/* Actions */}
      {hasActions && (
        <div className="flex flex-wrap gap-2 mt-4">
          {display.primaryActions.map((action) =>
            action.variant === 'primary' ? (
              <PrimaryButton
                key={action.action}
                onClick={() => onAction?.(action.action)}
              >
                {action.label}
              </PrimaryButton>
            ) : (
              <SecondaryButton
                key={action.action}
                onClick={() => onAction?.(action.action)}
              >
                {action.label}
              </SecondaryButton>
            )
          )}
          {extraActions}
        </div>
      )}
    </SoftPanel>
  )
}
