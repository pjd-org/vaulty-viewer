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
    <div
      className="genie-surface genie-surface--hero animate-fade-in transition-transform duration-200 hover:-translate-y-1"
      style={{ padding: '24px' }}
    >
      <Link
        to="/note"
        search={{ p: task.path }}
        className="text-xl font-semibold hover:opacity-80 transition-opacity block"
        style={{ color: 'var(--text-primary)' }}
      >
        {task.title}
      </Link>

      {task.description && (
        <p
          className="text-sm mt-1 line-clamp-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {task.description}
        </p>
      )}

      {/* Why this is the best move right now */}
      {whyNow && (
        <p
          className="text-xs mt-2 font-medium"
          style={{ color: 'var(--text-success)' }}
        >
          {whyNow}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <SoftChip label={meta.durationLabel} />
        <SoftChip label={meta.focusLabel} />
        <SoftChip label={meta.effortLabel} />
        {blocked && <StatusPill status="blocked" />}
      </div>

      {blocked && (
        <p
          className="text-xs mt-2 font-medium"
          style={{ color: 'var(--text-warning)' }}
        >
          This task has dependencies
        </p>
      )}

      <div className="flex items-center gap-3 mt-4">
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
