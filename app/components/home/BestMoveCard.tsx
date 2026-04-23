import React from 'react';
import { Link } from '@tanstack/react-router';
import { isBlocked, type NextAction } from '../../../src/lib/focus-logic';
import { toTaskDisplayMeta } from '../../lib/display';
import {
  PrimaryButton,
  SecondaryButton,
  IconButton,
  SoftChip,
  StatusPill,
} from '../ui';

interface BestMoveCardProps {
  task: NextAction;
  onStart: (t: NextAction) => void;
  onSkip: (t: NextAction) => void;
  onComplete: (t: NextAction) => void;
  mutating: boolean;
}

const whyNowTextClass = 'text-xs mt-2 font-medium';

/** Derive a short "why now" line from available signal. */
function getWhyNowLine(task: NextAction): string | null {
  const reasons = task.scoreBreakdown?.compoundReasons;
  if (reasons && reasons.length > 0) return reasons[0];
  if (task.dueDate) return `Due ${task.dueDate}`;
  if (task.priority >= 8) return 'High priority — top of the queue.';
  return null;
}

export function BestMoveCard({
  task,
  onStart,
  onSkip,
  onComplete,
  mutating,
}: BestMoveCardProps) {
  const meta = toTaskDisplayMeta(task);
  const blocked = isBlocked(task);
  const whyNow = getWhyNowLine(task);

  return (
    <div className="genie-surface genie-surface--hero genie-surface--sky flex flex-col gap-4 animate-fade-in p-6">
      <div className="space-y-2">
        <Link
          to="/note"
          search={{ p: task.path }}
          className="block text-xl font-semibold leading-tight text-[var(--text-primary)] transition-opacity hover:opacity-80"
        >
          {task.title}
        </Link>
        {task.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {task.description}
          </p>
        )}
      </div>

      {whyNow && (
        <p className={`${whyNowTextClass} text-[var(--text-success)]`}>
          {whyNow}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SoftChip label={meta.durationLabel} />
        <SoftChip label={meta.focusLabel} />
        <SoftChip label={meta.effortLabel} />
        {blocked && <StatusPill status="blocked" />}
      </div>

      {blocked && (
        <p className={`${whyNowTextClass} text-[var(--text-warning)]`}>
          This task has dependencies
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton onClick={() => onStart(task)} disabled={mutating}>
          Start
        </PrimaryButton>
        <SecondaryButton onClick={() => onComplete(task)} disabled={mutating}>
          Mark done
        </SecondaryButton>
        <IconButton
          icon={<span>×</span>}
          label="Skip task"
          onClick={() => onSkip(task)}
        />
      </div>
    </div>
  );
}
