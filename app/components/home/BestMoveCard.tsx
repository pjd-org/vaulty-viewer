import React from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/src/lib/utils';
import { isBlocked, type NextAction } from '../../../src/lib/focus-logic';
import { toTaskDisplayMeta } from '../../lib/display';
import { Card, CardContent } from '../ui/card';
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
    <div className="p-[3px] border-[0.5px] rounded-[14px] border-border animate-fade-in transition-transform duration-200 hover:-translate-y-1">
      <Card
        className={cn(
          'border-[1.5px] bg-gradient-to-br rounded-[12px] shadow-none',
          'from-background to-muted/60 shadow-[2px_0_8px_rgba(0,0,0,0.15)]'
        )}
      >
        <CardContent className="p-6">
          <Link
            to="/note"
            search={{ p: task.path }}
            className="text-xl font-semibold text-slate-800 hover:text-sky-700 transition-colors block"
          >
            {task.title}
          </Link>

          {task.description && (
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Why this is the best move right now */}
          {whyNow && (
            <p className="text-xs text-sky-700 mt-2 font-medium">{whyNow}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <SoftChip label={meta.durationLabel} />
            <SoftChip label={meta.focusLabel} />
            <SoftChip label={meta.effortLabel} />
            {blocked && <StatusPill status="blocked" />}
          </div>

          {blocked && (
            <p className="text-xs text-amber-600 mt-2">
              This task has dependencies
            </p>
          )}

          <div className="flex items-center gap-3 mt-4">
            <PrimaryButton onClick={() => onStart(task)} disabled={mutating}>
              Start
            </PrimaryButton>
            <SecondaryButton
              onClick={() => onComplete(task)}
              disabled={mutating}
            >
              Mark done
            </SecondaryButton>
            <IconButton
              icon={<span>×</span>}
              label="Skip task"
              onClick={() => onSkip(task)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
