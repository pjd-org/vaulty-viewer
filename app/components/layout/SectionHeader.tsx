import React from 'react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={['flex items-center justify-between mb-4', className ?? ''].join(' ').trim()}>
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
