import React from 'react'

const VARIANT_STYLES = {
  clear: {
    container: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  warn: {
    container: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  rest: {
    container: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
  stop: {
    container: 'bg-red-50 text-red-600 border-red-200',
    dot: 'bg-red-500',
  },
} as const

interface CodSeverityPillProps {
  variant: keyof typeof VARIANT_STYLES
  label: string
}

export function CodSeverityPill({ variant, label }: CodSeverityPillProps) {
  const styles = VARIANT_STYLES[variant]
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${styles.container}`}
    >
      <span className={`w-2 h-2 rounded-full ${styles.dot}`} aria-hidden />
      {label}
    </span>
  )
}
