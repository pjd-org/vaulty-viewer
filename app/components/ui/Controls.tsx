import React from 'react'

export interface SegmentOption {
  value: string
  label: string
}

export interface SegmentedControlProps {
  options: SegmentOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SegmentedControl({ options, value, onChange, className = '' }: SegmentedControlProps) {
  return (
    <div className={`flex items-center bg-slate-100 rounded-xl p-1 gap-1 ${className}`}>
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-sm cursor-pointer transition-all rounded-lg ${
              isActive
                ? 'bg-white shadow-sm text-slate-900 font-medium'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
