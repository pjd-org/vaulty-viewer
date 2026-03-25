import React from 'react'

export type MetricVariant = 'default' | 'success' | 'warning' | 'danger'

const metricValueColor: Record<MetricVariant, string> = {
  default: 'text-slate-900',
  success: 'text-green-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
}

export interface MetricLabelProps {
  label: string
  value: React.ReactNode
  sublabel?: string
  variant?: MetricVariant
}

export function MetricLabel({ label, value, sublabel, variant = 'default' }: MetricLabelProps) {
  return (
    <div className="inline-block">
      <div className={`text-2xl font-semibold ${metricValueColor[variant]}`}>{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{label}</div>
      {sublabel && <div className="text-xs text-slate-400 mt-0.5">{sublabel}</div>}
    </div>
  )
}

export interface MetaItem {
  icon?: React.ReactNode
  label: string
}

export interface MetaRowProps {
  items: MetaItem[]
  className?: string
}

export function MetaRow({ items, className = '' }: MetaRowProps) {
  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1 text-sm text-slate-500">
          {item.icon && <span className="shrink-0">{item.icon}</span>}
          {item.label}
        </span>
      ))}
    </div>
  )
}

export interface ReasonTextProps {
  children: React.ReactNode
  className?: string
}

export function ReasonText({ children, className = '' }: ReasonTextProps) {
  return (
    <p className={`text-sm text-slate-500 italic leading-relaxed ${className}`}>
      {children}
    </p>
  )
}
