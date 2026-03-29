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
      <header className="rounded-[28px] p-6 genie-surface genie-surface--hero genie-layer-hero">
        <div className="genie-content flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-800">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
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
