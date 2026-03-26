import React from 'react'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="text-4xl text-neutral-300">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold text-neutral-600 mt-4">{title}</h2>
      {description && (
        <p className="text-sm text-neutral-400 mt-2 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
