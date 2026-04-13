import React from 'react';
import type { KanbanTask } from '../../../src/lib/kanban-logic';

interface ProjectBoardSectionProps {
  tasks: KanbanTask[];
  projectId: string;
}

interface Column {
  key: string;
  label: string;
  tasks: KanbanTask[];
  accent?: boolean;
}

// Priority → visual config
const PRIORITY_CONFIG: Record<
  string,
  { label: string; bar: string; badge: string }
> = {
  critical: {
    label: 'Critical',
    bar: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700',
  },
  high: {
    label: 'High',
    bar: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-700',
  },
  medium: {
    label: 'Med',
    bar: 'bg-sky-400',
    badge: 'bg-sky-100 text-sky-700',
  },
  low: {
    label: 'Low',
    bar: 'bg-slate-300',
    badge: 'bg-slate-100 text-slate-500',
  },
};

function getPriorityConfig(priority?: number | string) {
  if (typeof priority === 'number') {
    if (priority >= 9) return PRIORITY_CONFIG.critical;
    if (priority >= 7) return PRIORITY_CONFIG.high;
    if (priority >= 4) return PRIORITY_CONFIG.medium;
    return PRIORITY_CONFIG.low;
  }
  if (typeof priority === 'string') {
    return PRIORITY_CONFIG[priority.toLowerCase()] ?? PRIORITY_CONFIG.medium;
  }
  return null;
}

function TaskCard({ task, accent }: { task: KanbanTask; accent?: boolean }) {
  const pConfig = getPriorityConfig(task.priority);

  return (
    <div className="group relative mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Left accent bar */}
      <div
        className={`absolute inset-y-0 left-0 w-[3px] transition-all group-hover:w-[4px] ${
          accent ? 'bg-sky-400' : (pConfig?.bar ?? 'bg-slate-200')
        }`}
      />

      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-slate-800">
          {task.title}
        </p>
        {pConfig && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${pConfig.badge}`}
          >
            {pConfig.label}
          </span>
        )}
      </div>

      {task.estimatedTimeMin != null && task.estimatedTimeMin > 0 && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-slate-500">
          <svg
            className="h-3 w-3"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 4.5V8l2.5 2" strokeLinecap="round" />
          </svg>
          {task.estimatedTimeMin}m
        </span>
      )}
    </div>
  );
}

const COLUMN_META: Record<
  string,
  {
    dot: string;
    headerBg: string;
    countBg: string;
    emptyBorder: string;
    emptyText: string;
    emptyDesc: string;
  }
> = {
  todo: {
    dot: 'bg-slate-300',
    headerBg: 'bg-slate-50',
    countBg: 'bg-slate-100 text-slate-500',
    emptyBorder: 'border-slate-200',
    emptyText: 'No queued tasks',
    emptyDesc: 'Tasks move here when ready to start.',
  },
  'in-progress': {
    dot: 'bg-sky-400',
    headerBg: 'bg-sky-50',
    countBg: 'bg-sky-100 text-sky-700',
    emptyBorder: 'border-sky-200',
    emptyText: 'Nothing active right now',
    emptyDesc: 'Pick a task from the queue to get started.',
  },
  done: {
    dot: 'bg-emerald-400',
    headerBg: 'bg-emerald-50',
    countBg: 'bg-emerald-100 text-emerald-700',
    emptyBorder: 'border-emerald-200',
    emptyText: 'No completed tasks yet',
    emptyDesc: 'Completed tasks will appear here.',
  },
};

export function ProjectBoardSection({ tasks }: ProjectBoardSectionProps) {
  const columns: Column[] = [
    {
      key: 'todo',
      label: 'To do',
      tasks: tasks.filter((t) => t.status === 'todo' || t.status === 'backlog'),
    },
    {
      key: 'in-progress',
      label: 'In progress',
      tasks: tasks.filter((t) => t.status === 'in-progress'),
      accent: true,
    },
    {
      key: 'done',
      label: 'Done',
      tasks: tasks.filter(
        (t) => t.status === 'completed' || t.status === 'done'
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => {
        const meta = COLUMN_META[col.key];
        return (
          <div key={col.key} className="flex flex-col gap-2">
            {/* Column header */}
            <div
              className={`flex items-center justify-between rounded-xl px-3 py-2 ${meta.headerBg}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${meta.dot}`}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {col.label}
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${meta.countBg}`}
              >
                {col.tasks.length}
              </span>
            </div>

            {/* Cards or empty state */}
            {col.tasks.length === 0 ? (
              <div
                className={`rounded-xl border border-dashed ${meta.emptyBorder} px-4 py-6 text-center`}
              >
                <p className="text-xs font-medium text-slate-500">
                  {meta.emptyText}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {meta.emptyDesc}
                </p>
              </div>
            ) : (
              col.tasks.map((task) => (
                <TaskCard key={task.id} task={task} accent={col.accent} />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
