import React from 'react'

interface SoftPanelProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function SoftPanel({ title, subtitle, actions, className, children }: SoftPanelProps) {
  const hasHeader = title || subtitle || actions

  return (
    <section
      className={[
        'rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm',
        className ?? '',
      ].join(' ').trim()}
    >
      {hasHeader && (
        <div className="flex justify-between items-center mb-5">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
