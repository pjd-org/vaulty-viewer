import React from 'react'

const VARIANT_COLOR: Record<string, string> = {
  ok: 'text-success',
  warn: 'text-warning',
  bad: 'text-danger',
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
          <span className="text-sm text-neutral-600">{label}</span>
          <span className={`text-sm font-medium ${variant ? VARIANT_COLOR[variant] : 'text-neutral-900'}`}>
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}
