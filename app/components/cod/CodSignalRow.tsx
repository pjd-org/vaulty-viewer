import React from 'react'

const VARIANT_COLOR: Record<string, string> = {
  ok: 'text-green-600',
  warn: 'text-amber-600',
  bad: 'text-red-600',
}

interface CodSignalItem {
  label: string
  value: string
  variant?: 'ok' | 'warn' | 'bad'
}

interface CodSignalRowProps {
  items: CodSignalItem[]
}

export function CodSignalRow({ items }: CodSignalRowProps) {
  return (
    <div className="flex flex-col gap-2">
      {items.map(({ label, value, variant }) => (
        <div key={label} className="flex items-center justify-between gap-2">
          <span className="text-sm text-slate-600">{label}</span>
          <span className={`text-sm font-medium ${variant ? VARIANT_COLOR[variant] : 'text-slate-900'}`}>
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}
