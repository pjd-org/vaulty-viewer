import React from 'react'

import { SoftPanel } from './SoftPanel'

export interface SummaryRowItem {
  label: string
  value: string
  detail?: string
}

interface SummaryRowProps {
  items: readonly SummaryRowItem[]
}

export function SummaryRow({ items }: SummaryRowProps) {
  if (!items.length) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <SoftPanel key={item.label} variant="utility" className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-100">
            {item.value}
          </p>
          {item.detail && (
            <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
          )}
        </SoftPanel>
      ))}
    </div>
  )
}
