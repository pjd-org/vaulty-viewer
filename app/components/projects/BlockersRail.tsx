import React from 'react'
import { SoftPanel } from '../layout'
import type { KanbanTask } from '../../../src/lib/kanban-logic'

interface BlockersRailProps {
  blockedTasks: KanbanTask[]
}

export function BlockersRail({ blockedTasks }: BlockersRailProps) {
  if (blockedTasks.length === 0) return null

  return (
    <SoftPanel title="Blockers">
      <div className="space-y-2">
        {blockedTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3"
          >
            <p className="text-sm font-medium text-red-800">{task.title}</p>
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-red-100/70 px-2 py-0.5 text-[11px] font-medium text-red-700"
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
  )
}
