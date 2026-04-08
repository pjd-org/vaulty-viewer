import React from 'react';

export interface SummaryRowItem {
  label: string;
  value: string;
  detail?: string;
}

interface SummaryRowProps {
  items: readonly SummaryRowItem[];
}

export function SummaryRow({ items }: SummaryRowProps) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[18px] border border-slate-200 bg-black/[0.03] px-4 py-3"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-800">
            {item.value}
          </p>
          {item.detail && (
            <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
          )}
        </div>
      ))}
    </div>
  );
}
