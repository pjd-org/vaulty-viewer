import React from 'react'

interface SoftPanelProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  variant?: 'base' | 'elevated' | 'hero' | 'utility' | 'overlay'
  className?: string
  children: React.ReactNode
}

const VARIANT_CLASSES: Record<NonNullable<SoftPanelProps['variant']>, string> = {
  base: 'genie-surface genie-layer-panel',
  elevated: 'genie-surface genie-surface--elevated genie-layer-panel',
  hero: 'genie-surface genie-surface--hero genie-layer-hero',
  utility: 'genie-surface genie-surface--utility genie-layer-panel',
  overlay: 'genie-surface genie-surface--overlay genie-layer-overlay',
}

export function SoftPanel({
  title,
  subtitle,
  actions,
  variant = 'base',
  className,
  children,
}: SoftPanelProps) {
  const hasHeader = title || subtitle || actions

  return (
    <section
      className={[
        'rounded-[28px] p-6',
        VARIANT_CLASSES[variant],
        className ?? '',
      ].join(' ').trim()}
    >
      {hasHeader && (
        <div className="flex justify-between items-center mb-5">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-slate-600">{subtitle}</p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
