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
    <div className={`genie-surface genie-surface--utility flex items-center rounded-xl p-1 gap-1 ${className}`}>
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`tab px-3 py-1.5 text-sm cursor-pointer transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
              isActive ? 'active font-medium' : 'hover:text-slate-800'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
