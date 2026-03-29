import React, { useState } from 'react'
import { formatDuration, type NextAction } from '../../../src/lib/focus-logic'
import { PrimaryButton, SecondaryButton, SegmentedControl, IconButton } from '../ui'
import { useSessionPlannerQuery } from '../../lib/queries/agents'

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
  const [aiEnabled, setAiEnabled] = useState(false)

  const agentTasks = tasks.slice(0, 20).map((t) => ({
    id: t.id,
    title: t.title,
    estimatedMinutes: t.estimatedTimeMin > 0 ? t.estimatedTimeMin : undefined,
    focusCost: t.focusCost,
    priority: t.priority,
  }))

  const { data: aiPlan, isFetching: aiLoading } = useSessionPlannerQuery(
    agentTasks,
    Number(budgetMin),
    { enabled: aiEnabled }
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAiPlan = () => {
    setAiEnabled(true)
  }

  const handleUseAiPlan = () => {
    if (!aiPlan) return
    const ids = [aiPlan.main_task.id, ...aiPlan.supporting_tasks.map((t) => t.id)]
    onStart(ids, Number(budgetMin))
    setExpanded(false)
  }

  const handleStart = () => {
    onStart(Array.from(selected), Number(budgetMin))
    setExpanded(false)
  }

  if (!expanded) {
    return (
      <div className="genie-surface genie-surface--utility px-4 py-3">
        <SecondaryButton onClick={() => setExpanded(true)} className="w-full">
          Plan a session →
        </SecondaryButton>
      </div>
    )
  }

  return (
    <div className="genie-surface genie-surface--elevated p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Plan a session</p>
        <IconButton
          onClick={() => { setExpanded(false); setAiEnabled(false) }}
          label="Close"
          icon={<span className="text-lg leading-none">×</span>}
          className="text-slate-400"
        />
      </div>

      <div>
        <p className="text-xs text-slate-600 mb-2">Duration</p>
        <SegmentedControl
          options={BUDGET_OPTIONS}
          value={budgetMin}
          onChange={(v) => { setBudgetMin(v); setAiEnabled(false) }}
        />
      </div>

      {/* AI plan result */}
      {aiPlan && !aiLoading && (
        <div className="genie-surface genie-surface--utility rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">AI Session Plan</p>
          <p className="text-xs text-slate-600 italic">{aiPlan.expected_outcome}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
              {aiPlan.main_task.title}
              <span className="text-xs text-slate-500 ml-auto">{aiPlan.main_task.duration}</span>
            </div>
            {aiPlan.supporting_tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm text-slate-700 pl-4">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0" />
                {t.title}
                <span className="text-xs text-slate-500 ml-auto">{t.duration}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Total: {aiPlan.total_time}</p>
          <PrimaryButton onClick={handleUseAiPlan} className="w-full">
            Start this session
          </PrimaryButton>
        </div>
      )}

      {/* Manual task picker (shown when AI hasn't run or loaded) */}
      {!aiPlan && (
        <div>
          <p className="text-xs text-slate-600 mb-2">Tasks</p>
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
                <span className="text-xs text-slate-500 shrink-0">
                  {t.estimatedTimeMin > 0 ? formatDuration(t.estimatedTimeMin) : ''}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {!aiPlan && (
          <SecondaryButton
            onClick={handleAiPlan}
            disabled={aiLoading || tasks.length === 0}
            className="flex-1"
          >
            {aiLoading ? 'Planning…' : '✦ Let AI plan it'}
          </SecondaryButton>
        )}
        {!aiPlan && (
          <PrimaryButton onClick={handleStart} disabled={selected.size === 0} className="flex-1">
            Start ({selected.size})
          </PrimaryButton>
        )}
        {aiPlan && (
          <SecondaryButton onClick={() => setAiEnabled(false)} className="w-full">
            Back to manual
          </SecondaryButton>
        )}
      </div>
    </div>
  )
}
