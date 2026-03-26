import React from 'react'

interface PageFrameProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PageFrame({ title, subtitle, actions, children }: PageFrameProps) {
  return (
    <div className="space-y-6">
      <header className="rounded-[28px] border border-neutral-200 bg-surface/90 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">{actions}</div>
          )}
        </div>
      </header>
      {children}
    </div>
  )
}
