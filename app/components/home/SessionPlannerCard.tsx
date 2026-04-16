import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { formatDuration, type NextAction } from '../../../src/lib/focus-logic';
import {
  PrimaryButton,
  SecondaryButton,
  SegmentedControl,
  IconButton,
} from '../ui';
import { useSessionPlannerQuery } from '../../lib/queries/agents';

interface SessionPlannerCardProps {
  tasks: NextAction[];
  onStart: (taskIds: string[], budgetMin: number) => void;
  /** Override the primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

const sectionLabelClass = 'text-xs text-[var(--text-secondary)] mb-2';
const durationLabelClass = 'text-xs text-[var(--text-tertiary)] ml-auto';

const BUDGET_OPTIONS = [
  { value: '25', label: '25m' },
  { value: '45', label: '45m' },
  { value: '90', label: '90m' },
  { value: '120', label: '120m' },
];

/** Corner bracket accent — card-5 pattern */
const CornerBracket = ({ className }: { className: string }) => (
  <div
    className={cn('size-5 absolute border-[var(--border-glass)]', className)}
  />
);

const CornerBrackets = () => (
  <>
    <CornerBracket className="-top-px -left-px border-l-2 border-t-2 rounded-tl-lg" />
    <CornerBracket className="-top-px -right-px border-r-2 border-t-2 rounded-tr-lg" />
    <CornerBracket className="-bottom-px -left-px border-l-2 border-b-2 rounded-bl-lg" />
    <CornerBracket className="-bottom-px -right-px border-r-2 border-b-2 rounded-br-lg" />
  </>
);

export function SessionPlannerCard({
  tasks,
  onStart,
  accentColor,
}: SessionPlannerCardProps) {
  const accent = accentColor ?? 'var(--color-primary)';
  const [expanded, setExpanded] = useState(false);
  const [budgetMin, setBudgetMin] = useState('45');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(tasks.slice(0, 5).map((t) => t.id))
  );
  const [aiEnabled, setAiEnabled] = useState(false);

  const agentTasks = tasks.slice(0, 20).map((t) => ({
    id: t.id,
    title: t.title,
    estimatedMinutes: t.estimatedTimeMin > 0 ? t.estimatedTimeMin : undefined,
    focusCost: t.focusCost,
    priority: t.priority,
  }));

  const { data: aiPlan, isFetching: aiLoading } = useSessionPlannerQuery(
    agentTasks,
    Number(budgetMin),
    { enabled: aiEnabled }
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAiPlan = () => {
    setAiEnabled(true);
  };

  const handleUseAiPlan = () => {
    if (!aiPlan) return;
    const ids = [
      aiPlan.main_task.id,
      ...aiPlan.supporting_tasks.map((t) => t.id),
    ];
    onStart(ids, Number(budgetMin));
    setExpanded(false);
  };

  const handleStart = () => {
    onStart(Array.from(selected), Number(budgetMin));
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <div className="genie-card shadow-[0px_4px_0px_0px_var(--border-glass)]">
        <div className="px-4 py-3">
          <SecondaryButton onClick={() => setExpanded(true)} className="w-full">
            Plan a session →
          </SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="genie-card relative rounded-md">
      <CornerBrackets />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Plan a session
          </p>
          <IconButton
            onClick={() => {
              setExpanded(false);
              setAiEnabled(false);
            }}
            label="Close"
            icon={<span className="text-lg leading-none">×</span>}
            className="text-[var(--text-tertiary)]"
          />
        </div>

        <div>
          <p className={sectionLabelClass}>Duration</p>
          <SegmentedControl
            options={BUDGET_OPTIONS}
            value={budgetMin}
            onChange={(v) => {
              setBudgetMin(v);
              setAiEnabled(false);
            }}
          />
        </div>

        {/* AI plan result */}
        {aiPlan && !aiLoading && (
          <div className="genie-surface genie-surface--utility rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              AI Session Plan
            </p>
            <p className="text-xs text-[var(--text-secondary)] italic">
              {aiPlan.expected_outcome}
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <span
                  aria-hidden="true"
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: accent }}
                />
                {aiPlan.main_task.title}
                <span className={durationLabelClass}>
                  {aiPlan.main_task.duration}
                </span>
              </div>
              {aiPlan.supporting_tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 text-sm text-[var(--text-secondary)] pl-4"
                >
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] shrink-0"
                  />
                  {t.title}
                  <span className={durationLabelClass}>{t.duration}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              Total: {aiPlan.total_time}
            </p>
            <PrimaryButton onClick={handleUseAiPlan} className="w-full">
              Start this session
            </PrimaryButton>
          </div>
        )}

        {/* Manual task picker (shown when AI hasn't run or loaded) */}
        {!aiPlan && (
          <div>
            <p className={sectionLabelClass}>Tasks</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tasks.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggle(t.id)}
                    className="rounded"
                  />
                  <span className="flex-1 truncate text-[var(--text-primary)]">
                    {t.title}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                    {t.estimatedTimeMin > 0
                      ? formatDuration(t.estimatedTimeMin)
                      : ''}
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
            <PrimaryButton
              onClick={handleStart}
              disabled={selected.size === 0}
              className="flex-1"
            >
              Start ({selected.size})
            </PrimaryButton>
          )}
          {aiPlan && (
            <SecondaryButton
              onClick={() => setAiEnabled(false)}
              className="w-full"
            >
              Back to manual
            </SecondaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
