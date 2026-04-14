import React from 'react';
import { Link } from '@tanstack/react-router';
import { STATUS_COLUMNS, type KanbanTask } from '../../../src/lib/kanban-logic';

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
      tabIndex={0}
      draggable={!isReadOnly}
      onDragStart={() => onDragStart(task)}
      onDragEnd={onDragEnd}
      className={[
        'rounded-[14px] border p-3 transition select-none',
        isDragging
          ? 'border-sky-400/40 bg-sky-50 opacity-60'
          : 'border-slate-200 bg-black/3 hover:bg-black/5',
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
              'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
              task.priority >= 8
                ? 'bg-red-100 text-red-700'
                : task.priority >= 5
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-black/5 text-slate-500',
            ].join(' ')}
            title={`Priority ${task.priority}`}
          >
            P{task.priority}
          </span>
        )}
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-1 mb-2">
        {task.estimatedTimeMin ? (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-slate-500">
            ⏱{' '}
            {task.estimatedTimeMin >= 60
              ? `${Math.round(task.estimatedTimeMin / 60)}h`
              : `${task.estimatedTimeMin}m`}
          </span>
        ) : null}
        {task.goalId && (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-slate-500">
            🎯 {task.goalId.replace(/-/g, ' ')}
          </span>
        )}
        {task.projectId && (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-slate-500">
            🚀 {task.projectId}
          </span>
        )}
      </div>

      {/* Tags */}
      {task.tags?.length ? (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags
            .filter((tag) => !tag.startsWith('goal:') && tag !== 'task')
            .slice(0, 3)
            .map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] text-sky-700"
              >
                #{tag}
              </span>
            ))}
        </div>
      ) : null}

      {/* Blocked badge */}
      {task.status === 'blocked' && (
        <div className="mb-2 rounded-[8px] bg-red-100 px-2 py-1 text-[11px] text-red-700">
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
                className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-40"
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
              className="rounded-full border border-slate-200 bg-black/3 px-2 py-0.5 text-[10px] text-slate-600 focus-visible:outline-none disabled:opacity-40"
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
