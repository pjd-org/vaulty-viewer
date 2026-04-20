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
      <div data-testid="work-task-empty-state" className="mt-4 space-y-2">
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
      <div data-testid="work-task-empty-state" className="mt-4 space-y-2">
        <p className={emptyHeadingClass}>No tasks ready.</p>
        <p className={emptyBodyClass}>
          All tasks may be blocked or no unblocked tasks remain.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface2 px-4 py-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-text2">
          Next Actions
        </h3>
        <span className="text-xs font-medium text-text2">
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
