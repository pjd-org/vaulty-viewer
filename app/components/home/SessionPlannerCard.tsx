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
  accentColor?: string;
}

const sectionLabelClass = 'text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)] mb-2';
const durationLabelClass = 'text-xs text-[var(--text-tertiary)] ml-auto tabular-nums';

const BUDGET_OPTIONS = [
  { value: '25', label: '25m' },
  { value: '45', label: '45m' },
  { value: '90', label: '90m' },
  { value: '120', label: '120m' },
];

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
    const ids = [aiPlan.main_task.id, ...aiPlan.supporting_tasks.map((t) => t.id)];
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
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Plan a session
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Build a focused run from the tasks already in play.
            </p>
          </div>
          <SecondaryButton onClick={() => setExpanded(true)}>
            Open planner
          </SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="genie-card relative rounded-md">
      <CornerBrackets />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Plan a session
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Pick the work, then decide how ambitious the session should be.
            </p>
          </div>
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

        {aiPlan && !aiLoading && (
          <div className="genie-surface genie-surface--utility flex flex-col gap-2 rounded-xl p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              AI session plan
            </p>
            <p className="text-xs italic text-[var(--text-secondary)]">
              {aiPlan.expected_outcome}
            </p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full shrink-0"
                  style={{ background: accent }}
                />
                {aiPlan.main_task.title}
                <span className={durationLabelClass}>{aiPlan.main_task.duration}</span>
              </div>
              {aiPlan.supporting_tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 pl-4 text-sm text-[var(--text-secondary)]"
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-[var(--text-tertiary)] shrink-0"
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

        {!aiPlan && (
          <div>
            <p className={sectionLabelClass}>Tasks</p>
            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
              {tasks.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-2 text-sm transition-colors hover:bg-[var(--surf-elevated)]"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggle(t.id)}
                    className="rounded"
                  />
                  <span className="min-w-0 flex-1 truncate text-[var(--text-primary)]">
                    {t.title}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                    {t.estimatedTimeMin > 0 ? formatDuration(t.estimatedTimeMin) : ''}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!aiPlan && (
            <SecondaryButton onClick={handleAiPlan} disabled={aiLoading}>
              {aiLoading ? 'Planning…' : 'Use AI planner'}
            </SecondaryButton>
          )}
          <PrimaryButton
            onClick={handleStart}
            disabled={selected.size === 0 && !aiPlan}
          >
            Start selected
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
