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
    <div className="genie-card transition-transform duration-200 hover:-translate-y-0.5 flex items-center gap-4 py-3 px-4">
      <div className="flex-1 min-w-0">
        <Link
          to="/note"
          search={{ p: task.path }}
          className="text-sm font-medium truncate block transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-primary)' }}
        >
          {task.title}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <SoftChip label={meta.durationLabel} />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
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
