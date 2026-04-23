import React from 'react';
import { Link } from '@tanstack/react-router';
import { type NextAction } from '../../../src/lib/focus-logic';

interface BacklogStripCardProps {
  task: NextAction;
  onStart: (taskPath: string) => void;
  onBacklog: (taskPath: string) => void;
  mutating: boolean;
}

export const BacklogStripCard = React.memo(function BacklogStripCard({
  task,
  onStart,
  onBacklog,
  mutating,
}: BacklogStripCardProps) {
  return (
    <article className="genie-card flex items-center justify-between gap-3 !p-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate rounded-lg border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-2.5 py-1.5 text-sm font-semibold text-[var(--text-primary)]">
          {task.title}
        </p>
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
          Backlog candidate
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {task.path ? (
          <Link
            to="/note"
            search={{ p: task.path }}
            className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-elevated)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] transition-colors hover:bg-[var(--surf-base)]"
          >
            Open
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => onStart(task.path)}
          disabled={mutating}
          className="cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 [background:color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))] [border-color:color-mix(in_srgb,var(--a-sky)_35%,transparent)] [color:color-mix(in_srgb,var(--a-sky)_70%,var(--n-950))] hover:[background:color-mix(in_srgb,var(--a-sky)_22%,var(--surf-elevated))]"
        >
          Start
        </button>
        <button
          type="button"
          onClick={() => onBacklog(task.path)}
          disabled={mutating}
          className="cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 [background:color-mix(in_srgb,var(--a-sun)_12%,var(--surf-elevated))] [border-color:color-mix(in_srgb,var(--a-sun)_35%,transparent)] [color:color-mix(in_srgb,var(--a-sun)_80%,var(--n-950))] hover:[background:color-mix(in_srgb,var(--a-sun)_22%,var(--surf-elevated))]"
        >
          Backlog
        </button>
      </div>
    </article>
  );
});
