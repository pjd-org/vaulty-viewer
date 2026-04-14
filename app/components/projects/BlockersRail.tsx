import React from 'react';
import { SoftPanel } from '../layout';
import type { KanbanTask } from '../../../src/lib/kanban-logic';

interface BlockersRailProps {
  blockedTasks: KanbanTask[];
  /** Override the primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

export function BlockersRail({ blockedTasks, accentColor }: BlockersRailProps) {
  const accent = accentColor ?? 'var(--a-rose)';
  if (blockedTasks.length === 0) return null;

  return (
    <SoftPanel title="Blockers" variant="utility">
      <div className="space-y-2">
        {blockedTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-xl px-4 py-3"
            style={{
              border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
              background: `color-mix(in srgb, ${accent} 12%, transparent)`,
            }}
          >
            <div className="flex items-start gap-2">
              {/* Blocked indicator dot */}
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ background: accent }}
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-[var(--text-danger)]">
                {task.title}
              </p>
            </div>
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 ml-4">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-[var(--text-danger)]"
                    style={{
                      background: `color-mix(in srgb, ${accent} 15%, transparent)`,
                    }}
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
