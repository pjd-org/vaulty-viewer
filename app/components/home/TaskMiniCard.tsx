import React from 'react';
import { Link } from '@tanstack/react-router';
import { type NextAction } from '../../../src/lib/focus-logic';
import { toTaskDisplayMeta } from '../../lib/display';
import { IconButton, SoftChip } from '../ui';

interface TaskMiniCardProps {
  task: NextAction;
  onStart: (t: NextAction) => void;
  onComplete: (t: NextAction) => void;
}

export function TaskMiniCard({ task, onStart, onComplete }: TaskMiniCardProps) {
  const meta = toTaskDisplayMeta(task);

  return (
    <div className="genie-card flex items-center gap-4 py-3 px-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Link
          to="/note"
          search={{ p: task.path }}
          className="block truncate text-sm font-semibold text-[var(--text-primary)] transition-opacity hover:opacity-75"
        >
          {task.title}
        </Link>
        <div className="flex items-center gap-2">
          <SoftChip label={meta.durationLabel} />
          <span className="text-[11px] text-[var(--text-tertiary)]">
            Quick action
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <IconButton
          icon={<span>▶</span>}
          label="Start task"
          onClick={() => onStart(task)}
        />
        <IconButton
          icon={<span>✓</span>}
          label="Complete task"
          onClick={() => onComplete(task)}
        />
      </div>
    </div>
  );
}
