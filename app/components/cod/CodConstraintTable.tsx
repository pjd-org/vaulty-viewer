import React from 'react'

interface CodConstraintTableProps {
  items: { label: string; value: string }[]
}

export function CodConstraintTable({ items }: CodConstraintTableProps) {
  return (
    <dl className="grid grid-cols-1 gap-2">
      {items.map(({ label, value }) => (
        <div key={label} className="flex items-baseline justify-between gap-2">
          <dt className="text-xs uppercase tracking-wide text-slate-500 shrink-0">{label}</dt>
          <dd className="text-sm font-medium text-slate-900 text-right">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
