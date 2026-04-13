import React from 'react';
import { SoftPanel } from '../layout';
import type { KanbanTask } from '../../../src/lib/kanban-logic';

interface BlockersRailProps {
  blockedTasks: KanbanTask[];
}

export function BlockersRail({ blockedTasks }: BlockersRailProps) {
  if (blockedTasks.length === 0) return null;

  return (
    <SoftPanel title="Blockers" variant="utility">
      <div className="space-y-2">
        {blockedTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <div className="flex items-start gap-2">
              {/* Blocked indicator dot */}
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-rose-800">{task.title}</p>
            </div>
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 ml-4">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </SoftPanel>
  );
}
