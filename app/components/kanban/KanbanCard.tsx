import React from 'react';
import { Link } from '@tanstack/react-router';
import { STATUS_COLUMNS, type KanbanTask } from '../../../src/lib/kanban-logic';

const kanbanChipClass =
  'rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-slate-500';
const kanbanChipRowClass = 'flex flex-wrap gap-1 mb-2';

export interface KanbanCardProps {
  task: KanbanTask;
  isDragging: boolean;
  isReadOnly: boolean;
  mutatingTaskId: string | null;
  onDragStart: (task: KanbanTask) => void;
  onDragEnd: () => void;
  onStatusChange: (task: KanbanTask, status: string) => void;
}

export function KanbanCard({
  task,
  isDragging,
  isReadOnly,
  mutatingTaskId,
  onDragStart,
  onDragEnd,
  onStatusChange,
}: KanbanCardProps) {
  return (
    <article
      aria-label={task.title}
      draggable={!isReadOnly}
      onDragStart={() => onDragStart(task)}
      onDragEnd={onDragEnd}
      className={[
        'genie-card !rounded-[14px] !p-3 transition select-none',
        isDragging ? 'genie-card--sky opacity-60' : '',
        !isReadOnly ? 'cursor-grab active:cursor-grabbing' : '',
      ].join(' ')}
    >
      {/* Title + priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-slate-800 leading-snug">
          {task.title}
        </span>
        {task.priority > 0 && (
          <span
            className={[
              'shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold',
              task.priority >= 8
                ? '[background:color-mix(in_srgb,var(--a-rose)_18%,white)] [color:color-mix(in_srgb,var(--a-rose)_70%,#1c2230)] [border-color:color-mix(in_srgb,var(--a-rose)_30%,transparent)]'
                : task.priority >= 5
                  ? '[background:color-mix(in_srgb,var(--a-sun)_18%,white)] [color:color-mix(in_srgb,var(--a-sun)_80%,#1c2230)] [border-color:color-mix(in_srgb,var(--a-sun)_30%,transparent)]'
                  : 'bg-black/5 text-slate-500 border-transparent',
            ].join(' ')}
            title={`Priority ${task.priority}`}
          >
            P{task.priority}
          </span>
        )}
      </div>

      {/* Meta chips */}
      <div className={kanbanChipRowClass}>
        {task.estimatedTimeMin ? (
          <span className={kanbanChipClass}>
            ⏱{' '}
            {task.estimatedTimeMin >= 60
              ? `${Math.round(task.estimatedTimeMin / 60)}h`
              : `${task.estimatedTimeMin}m`}
          </span>
        ) : null}
        {task.goalId && (
          <span className={kanbanChipClass}>
            🎯 {task.goalId.replace(/-/g, ' ')}
          </span>
        )}
        {task.projectId && (
          <span className={kanbanChipClass}>🚀 {task.projectId}</span>
        )}
      </div>

      {/* Tags */}
      {task.tags?.length ? (
        <div className={kanbanChipRowClass}>
          {task.tags
            .filter((tag) => !tag.startsWith('goal:') && tag !== 'task')
            .slice(0, 3)
            .map((tag) => (
              <span
                key={tag}
                className="rounded-full border [background:color-mix(in_srgb,var(--a-sky)_12%,white)] [border-color:color-mix(in_srgb,var(--a-sky)_28%,transparent)] [color:color-mix(in_srgb,var(--a-sky)_65%,#1c2230)] px-2 py-0.5 text-[10px]"
              >
                #{tag}
              </span>
            ))}
        </div>
      ) : null}

      {/* Blocked badge */}
      {task.status === 'blocked' && (
        <div className="mb-2 rounded-[8px] border [background:color-mix(in_srgb,var(--a-rose)_14%,white)] [border-color:color-mix(in_srgb,var(--a-rose)_28%,transparent)] [color:color-mix(in_srgb,var(--a-rose)_70%,#1c2230)] px-2 py-1 text-[11px]">
          🚫 Blocked
        </div>
      )}

      {/* Footer: open link + actions */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <Link
          to={task.link}
          className="rounded-full bg-black/5 px-3 py-1 text-[11px] text-slate-600 transition hover:bg-black/8"
        >
          Open →
        </Link>
        {!isReadOnly && task.path ? (
          <div className="flex items-center gap-1">
            {task.status !== 'completed' ? (
              <button
                type="button"
                onClick={() => onStatusChange(task, 'completed')}
                disabled={mutatingTaskId === task.id}
                title="Mark completed"
                className="rounded-full border [background:color-mix(in_srgb,var(--a-mint)_14%,white)] [border-color:color-mix(in_srgb,var(--a-mint)_28%,transparent)] [color:color-mix(in_srgb,var(--a-mint)_70%,#1c2230)] px-2 py-1 text-[11px] transition hover:[background:color-mix(in_srgb,var(--a-mint)_24%,white)] disabled:opacity-40"
              >
                ✓
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStatusChange(task, 'todo')}
                disabled={mutatingTaskId === task.id}
                title="Reopen task"
                className="rounded-full bg-black/5 px-2 py-1 text-[11px] text-slate-600 transition hover:bg-black/8 disabled:opacity-40"
              >
                ↺
              </button>
            )}
            <select
              aria-label={`Move "${task.title}" to column`}
              value={task.status}
              onChange={(e) => onStatusChange(task, e.target.value)}
              disabled={mutatingTaskId === task.id}
              className="rounded-full border border-slate-200 bg-black/3 px-2 py-0.5 text-[10px] text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_24%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-40"
            >
              {STATUS_COLUMNS.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-slate-400">
            read-only
          </span>
        )}
      </div>
    </article>
  );
}
