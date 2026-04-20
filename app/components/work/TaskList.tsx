import React from 'react';
import { TaskDetail } from './TaskDetail';
import type { NextAction } from '../../../src/lib/focus-logic';

export function TaskList({
  tasks,
  selectedId,
  onSelect,
}: {
  tasks: NextAction[];
  selectedId: string | null;
  onSelect: (task: NextAction | null) => void;
}) {
  return (
    <ul
      data-testid="work-task-list"
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
    >
      {tasks.map((task) => {
        const isExpanded = selectedId === task.id;
        return (
          <li
            key={task.id}
            className="rounded-2xl border border-border bg-[var(--surf-elevated)] shadow-sm"
          >
            <button
              type="button"
              onClick={() => onSelect(isExpanded ? null : task)}
              aria-expanded={isExpanded}
              className={[
                'flex w-full items-start justify-between rounded-2xl px-4 py-3 text-sm transition-colors',
                isExpanded
                  ? 'bg-surface3 text-text'
                  : 'text-text2 hover:bg-surface',
              ].join(' ')}
            >
              <div className="flex min-w-0 items-start gap-2">
                <span
                  className={`mt-1 size-2 shrink-0 rounded-full ${
                    task.status === 'blocked'
                      ? 'bg-[color-mix(in_srgb,var(--a-rose)_80%,transparent)]'
                      : 'bg-[color-mix(in_srgb,var(--a-mint)_80%,transparent)]'
                  }`}
                />
                <div className="min-w-0">
                  <span className="line-clamp-2 text-left font-semibold text-text">
                    {task.title}
                  </span>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-text2">
                    <span>{task.priority}p</span>
                    <span>·</span>
                    <span>{task.estimatedTimeMin ?? 0}m</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    task.status === 'blocked'
                      ? 'bg-[color-mix(in_srgb,var(--a-rose)_12%,transparent)] text-[var(--text-danger)]'
                      : 'bg-[color-mix(in_srgb,var(--a-mint)_12%,transparent)] text-[var(--text-success)]'
                  }`}
                >
                  {task.status}
                </span>
                <span
                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  aria-hidden="true"
                >
                  ›
                </span>
              </div>
            </button>
            {isExpanded && (
              <div className="mx-2 mb-2 rounded-xl border border-border bg-surface px-4 py-3 animate-fade-in">
                <TaskDetail task={task} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
