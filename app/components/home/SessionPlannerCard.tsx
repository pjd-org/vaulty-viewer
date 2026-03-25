import React, { useState } from 'react'
import { formatDuration, type NextAction } from '../../../src/lib/focus-logic'
import { PrimaryButton, SecondaryButton, SegmentedControl } from '../ui'

interface SessionPlannerCardProps {
  tasks: NextAction[]
  onStart: (taskIds: string[], budgetMin: number) => void
}

const BUDGET_OPTIONS = [
  { value: '25', label: '25m' },
  { value: '45', label: '45m' },
  { value: '90', label: '90m' },
  { value: '120', label: '120m' },
]

export function SessionPlannerCard({ tasks, onStart }: SessionPlannerCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [budgetMin, setBudgetMin] = useState('45')
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(tasks.slice(0, 5).map((t) => t.id))
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleStart = () => {
    onStart(Array.from(selected), Number(budgetMin))
    setExpanded(false)
  }

  if (!expanded) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <SecondaryButton onClick={() => setExpanded(true)} className="w-full">
          Plan a session →
        </SecondaryButton>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Plan a session</p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-slate-400 hover:text-slate-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-2">Duration</p>
        <SegmentedControl
          options={BUDGET_OPTIONS}
          value={budgetMin}
          onChange={setBudgetMin}
        />
      </div>

      <div>
        <p className="text-xs text-slate-500 mb-2">Tasks</p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tasks.map((t) => (
            <label key={t.id} className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(t.id)}
                onChange={() => toggle(t.id)}
                className="rounded"
              />
              <span className="flex-1 truncate text-slate-800">{t.title}</span>
              <span className="text-xs text-slate-400 shrink-0">
                {t.estimatedTimeMin > 0 ? formatDuration(t.estimatedTimeMin) : ''}
              </span>
            </label>
          ))}
        </div>
      </div>

      <PrimaryButton onClick={handleStart} disabled={selected.size === 0} className="w-full">
        Start Session ({selected.size} task{selected.size !== 1 ? 's' : ''})
      </PrimaryButton>
    </div>
  )
}
