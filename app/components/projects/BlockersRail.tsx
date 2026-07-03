import React from 'react';
import { SoftPanel } from '../layout';
import type { KanbanTask } from '../../../src/lib/kanban-logic';

interface BlockersRailProps {
  blockedTasks: KanbanTask[];
  /** Override the primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  selectedTaskId?: string;
  onSelectTask?: (taskId: string) => void;
  showSelectCta?: boolean;
}

export function BlockersRail({
  blockedTasks,
  accentColor,
  subtitle,
  actions,
  selectedTaskId,
  onSelectTask,
  showSelectCta = false,
}: BlockersRailProps) {
  const accent = accentColor ?? 'var(--a-rose)';
  if (blockedTasks.length === 0) return null;

  const isInteractive = typeof onSelectTask === 'function';

  return (
    <SoftPanel
      title="Blockers"
      subtitle={subtitle}
      actions={actions}
      variant="utility"
    >
      <div className="flex flex-col gap-2">
        {blockedTasks.map((task) => {
          const selected = selectedTaskId === task.id;
          const borderMix = selected ? 45 : 30;
          const backgroundMix = selected ? 20 : 12;

          return (
            <div
              key={task.id}
              role={isInteractive ? 'button' : undefined}
              tabIndex={isInteractive ? 0 : undefined}
              aria-label={isInteractive ? `Select blocker ${task.title}` : undefined}
              onClick={
                isInteractive ? () => onSelectTask(task.id) : undefined
              }
              onKeyDown={
                isInteractive
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectTask(task.id);
                      }
                    }
                  : undefined
              }
              data-selected={selected ? 'true' : 'false'}
              className="rounded-xl px-4 py-3 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--a-sky)]/50"
              style={{
                border: `1px solid color-mix(in srgb, ${accent} ${borderMix}%, transparent)`,
                background: `color-mix(in srgb, ${accent} ${backgroundMix}%, transparent)`,
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
                <div className="mt-2 ml-4 flex flex-wrap gap-1">
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
              {isInteractive && showSelectCta && (
                <div className="mt-3 ml-4">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectTask(task.id);
                    }}
                    className="rounded-full border border-[color-mix(in_srgb,var(--a-sky)_30%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--a-sky)_18%,var(--surf-elevated))]"
                  >
                    Select task
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SoftPanel>
  );
}
