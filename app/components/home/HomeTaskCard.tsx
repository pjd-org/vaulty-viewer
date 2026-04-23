import React from 'react';
import { Link } from '@tanstack/react-router';
import { type NextAction } from '../../../src/lib/focus-logic';
import { TaskSeverityBadge } from './TaskSeverityBadge';

interface HomeTaskCardProps {
  task: NextAction;
  onStart: (taskPath: string) => void;
  onBacklog: (taskPath: string) => void;
  mutating: boolean;
  compact?: boolean;
}

export const HomeTaskCard = React.memo(function HomeTaskCard({
  task,
  onStart,
  onBacklog,
  mutating,
  compact = false,
}: HomeTaskCardProps) {
  const confidencePct = Math.max(1, Math.min(99, Math.round(task.score * 10)));

  return (
    <article
      className={`genie-card flex flex-col gap-4 ${compact ? '!p-3' : 'sm:!p-4'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <h3
            className={`line-clamp-2 rounded-lg border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-2.5 py-2 font-semibold leading-snug text-[var(--text-primary)] shadow-sm ${compact ? 'text-xs' : 'text-sm'}`}
          >
            {task.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <span className="inline-block size-2 rounded-full bg-[var(--a-sky)]/60" />
            <span className="font-medium uppercase tracking-[0.16em]">Task</span>
            <span className="inline-block size-2 rounded-full bg-[var(--text-tertiary)]/70" />
            <span className="tabular-nums">{confidencePct}% confidence</span>
          </div>
        </div>
        <TaskSeverityBadge
          priority={task.priority}
          confidencePct={confidencePct}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {task.path ? (
          <Link
            to="/note"
            search={{ p: task.path }}
            className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-elevated)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)] transition-colors hover:bg-[var(--surf-base)]"
          >
            Open
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="cursor-not-allowed rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-utility)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]"
          >
            Open
          </span>
        )}
        <button
          type="button"
          onClick={() => onStart(task.path)}
          disabled={mutating}
          className="cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 [background:color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))] [border-color:color-mix(in_srgb,var(--a-sky)_35%,transparent)] [color:color-mix(in_srgb,var(--a-sky)_70%,var(--n-950))] hover:[background:color-mix(in_srgb,var(--a-sky)_22%,var(--surf-elevated))]"
        >
          {mutating ? 'Starting…' : 'Start'}
        </button>
        <button
          type="button"
          onClick={() => onBacklog(task.path)}
          disabled={mutating}
          className="cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 [background:color-mix(in_srgb,var(--a-sun)_12%,var(--surf-elevated))] [border-color:color-mix(in_srgb,var(--a-sun)_35%,transparent)] [color:color-mix(in_srgb,var(--a-sun)_80%,var(--n-950))] hover:[background:color-mix(in_srgb,var(--a-sun)_22%,var(--surf-elevated))]"
        >
          {mutating ? 'Updating…' : 'Backlog'}
        </button>
      </div>
    </article>
  );
});
