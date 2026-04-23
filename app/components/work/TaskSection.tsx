import React from 'react';
import { TaskList } from './TaskList';
import type { NextAction } from '../../../src/lib/focus-logic';
import type { WorkSurfacePayload } from '../../lib/viewer-adapter';

const emptyHeadingClass = 'text-sm font-medium text-text2';
const emptyBodyClass = 'text-xs text-text3';

export function TaskSection({
  data,
  selectedId,
  onSelect,
}: {
  data: WorkSurfacePayload | undefined;
  selectedId: string | null;
  onSelect: (task: NextAction | null) => void;
}) {
  if (!data) {
    return (
      <div data-testid="work-task-empty-state" className="mt-4 flex flex-col gap-2">
        <p className={emptyHeadingClass}>
          Task and dependency data not yet connected.
        </p>
        <p className={emptyBodyClass}>
          Adapter context is wired. Task and dependency workspaces will appear
          once the runtime surface connects.
        </p>
      </div>
    );
  }

  if (data.tasks.length === 0) {
    return (
      <div data-testid="work-task-empty-state" className="mt-4 flex flex-col gap-2">
        <p className={emptyHeadingClass}>No tasks ready.</p>
        <p className={emptyBodyClass}>
          All tasks may be blocked or no unblocked tasks remain.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-glass-soft)] bg-[var(--surf-utility)] px-4 py-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]">
          Next Actions
          </h3>
          <p className="text-xs text-[var(--text-tertiary)]">
            Expand a task to inspect blockers and next steps.
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-[var(--text-tertiary)]">
          {data.total} tasks · {data.mode}
        </span>
      </div>
      <TaskList
        tasks={data.tasks}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </div>
  );
}
