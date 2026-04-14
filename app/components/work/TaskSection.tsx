import React from 'react';
import { TaskList } from './TaskList';
import type { NextAction } from '../../../src/lib/focus-logic';
import type { WorkSurfacePayload } from '../../lib/viewer-adapter';

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
        <p className="text-sm font-medium text-neutral-600">
          Task and dependency data not yet connected.
        </p>
        <p className="text-xs text-neutral-400">
          Adapter context is wired. Task and dependency workspaces will appear
          once the runtime surface connects.
        </p>
      </div>
    );
  }

  if (data.tasks.length === 0) {
    return (
      <div data-testid="work-task-empty-state" className="mt-4 space-y-2">
        <p className="text-sm font-medium text-neutral-600">No tasks ready.</p>
        <p className="text-xs text-neutral-400">
          All tasks may be blocked or no unblocked tasks remain.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">
          Next Actions
        </h3>
        <span className="text-xs font-medium text-slate-500">
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
