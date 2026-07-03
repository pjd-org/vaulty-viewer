import React from 'react';
import type { KanbanTask } from '../../../src/lib/kanban-logic';

interface ProjectBoardSectionProps {
  tasks: KanbanTask[];
  projectId: string;
  /** Override the in-progress column accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

interface Column {
  key: string;
  label: string;
  tasks: KanbanTask[];
}

// Priority → visual config
const PRIORITY_CONFIG: Record<
  string,
  { label: string; bar: string; badge: string }
> = {
  critical: {
    label: 'Critical',
    bar: 'bg-[var(--a-rose)]',
    badge:
      'bg-[color-mix(in_srgb,var(--a-rose)_15%,transparent)] text-[var(--text-danger)]',
  },
  high: {
    label: 'High',
    bar: 'bg-[var(--a-sun)]',
    badge:
      'bg-[color-mix(in_srgb,var(--a-sun)_15%,transparent)] text-[var(--text-warning)]',
  },
  medium: {
    label: 'Med',
    bar: 'bg-[var(--a-sky)]',
    badge:
      'bg-[color-mix(in_srgb,var(--a-sky)_15%,transparent)] text-[var(--text-info)]',
  },
  low: {
    label: 'Low',
    bar: 'bg-[var(--text-tertiary)]',
    badge: 'bg-[var(--surf-utility)] text-[var(--text-tertiary)]',
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

function TaskCard({
  task,
  accentValue,
}: {
  task: KanbanTask;
  accentValue?: string;
}) {
  const pConfig = getPriorityConfig(task.priority);

  return (
    <div className="group relative mb-2 overflow-hidden rounded-xl border border-[var(--border-glass)] bg-[var(--surf-elevated)] px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Left accent bar */}
      <div className="absolute inset-y-0 left-0 w-[3px] transition-all group-hover:w-[4px]">
        {accentValue ? (
          <div
            className="absolute inset-0"
            style={{ background: accentValue }}
          />
        ) : (
          <div
            className={`absolute inset-0 ${pConfig?.bar ?? 'bg-[var(--border-glass)]'}`}
          />
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-[var(--text-primary)]">
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
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--surf-utility)] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)]">
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
    dot: 'bg-[var(--text-tertiary)]',
    headerBg: 'bg-[var(--surf-utility)]',
    countBg: 'bg-[var(--surf-utility)] text-[var(--text-tertiary)]',
    emptyBorder: 'border-[var(--border-glass)]',
    emptyText: 'No queued tasks',
    emptyDesc: 'Tasks move here when ready to start.',
  },
  'in-progress': {
    dot: 'bg-[var(--a-sky)]',
    headerBg: 'bg-[color-mix(in_srgb,var(--a-sky)_10%,transparent)]',
    countBg:
      'bg-[color-mix(in_srgb,var(--a-sky)_15%,transparent)] text-[var(--text-info)]',
    emptyBorder: 'border-[color-mix(in_srgb,var(--a-sky)_30%,transparent)]',
    emptyText: 'Nothing active right now',
    emptyDesc: 'Pick a task from the queue to get started.',
  },
  done: {
    dot: 'bg-[var(--a-mint)]',
    headerBg: 'bg-[color-mix(in_srgb,var(--a-mint)_10%,transparent)]',
    countBg:
      'bg-[color-mix(in_srgb,var(--a-mint)_15%,transparent)] text-[var(--text-success)]',
    emptyBorder: 'border-[color-mix(in_srgb,var(--a-mint)_30%,transparent)]',
    emptyText: 'No completed tasks yet',
    emptyDesc: 'Completed tasks will appear here.',
  },
};

export function ProjectBoardSection({
  tasks,
  accentColor,
}: ProjectBoardSectionProps) {
  const accent = accentColor ?? 'var(--a-sky)';

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
    },
    {
      key: 'done',
      label: 'Done',
      tasks: tasks.filter(
        (t) => t.status === 'completed' || t.status === 'done'
      ),
    },
  ];

  // Compute in-progress column styles dynamically so accent is respected
  const inProgressMeta = {
    dot: accent,
    headerBg: `color-mix(in srgb, ${accent} 10%, transparent)`,
    countBg: `color-mix(in srgb, ${accent} 15%, transparent)`,
    emptyBorder: `color-mix(in srgb, ${accent} 30%, transparent)`,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => {
        const meta = COLUMN_META[col.key];
        const isInProgress = col.key === 'in-progress';

        // Resolve dynamic styles for in-progress; static Tailwind classes for others
        const headerBgStyle = isInProgress
          ? { background: inProgressMeta.headerBg }
          : undefined;
        const headerBgClass = isInProgress ? '' : meta.headerBg;

        const dotStyle = isInProgress
          ? { background: inProgressMeta.dot }
          : undefined;
        const dotClass = isInProgress ? '' : meta.dot;

        const countBgStyle = isInProgress
          ? { background: inProgressMeta.countBg }
          : undefined;
        const countBgClass = isInProgress
          ? 'text-[var(--text-info)]'
          : meta.countBg;

        const emptyBorderStyle = isInProgress
          ? { borderColor: inProgressMeta.emptyBorder }
          : undefined;
        const emptyBorderClass = isInProgress ? '' : meta.emptyBorder;

        return (
          <div key={col.key} className="flex flex-col gap-2">
            {/* Column header */}
            <div
              className={`flex items-center justify-between rounded-xl px-3 py-2 ${headerBgClass}`}
              style={headerBgStyle}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${dotClass}`}
                  style={dotStyle}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  {col.label}
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${countBgClass}`}
                style={countBgStyle}
              >
                {col.tasks.length}
              </span>
            </div>

            {/* Cards or empty state */}
            {col.tasks.length === 0 ? (
              <div
                className={`rounded-xl border border-dashed px-4 py-6 text-center ${emptyBorderClass}`}
                style={emptyBorderStyle}
              >
                <p className="text-xs font-medium text-[var(--text-tertiary)]">
                  {meta.emptyText}
                </p>
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                  {meta.emptyDesc}
                </p>
              </div>
            ) : (
              col.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  accentValue={isInProgress ? accent : undefined}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
