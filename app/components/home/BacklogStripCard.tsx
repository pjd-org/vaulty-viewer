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
    <article className="rounded-[18px] border border-border bg-surface2 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 truncate rounded-md border border-border bg-surface px-2 py-1 text-sm font-semibold text-text">
          {task.title}
        </p>
        <div className="flex items-center gap-2">
          {task.path ? (
            <Link
              to="/note"
              search={{ p: task.path }}
              className="rounded-full border border-border bg-[var(--surf-elevated)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-text"
            >
              Open
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => onStart(task.path)}
            disabled={mutating}
            className="cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 [background:color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))] [border-color:color-mix(in_srgb,var(--a-sky)_35%,transparent)] [color:color-mix(in_srgb,var(--a-sky)_70%,var(--n-950))]"
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => onBacklog(task.path)}
            disabled={mutating}
            className="cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 [background:color-mix(in_srgb,var(--a-sun)_12%,var(--surf-elevated))] [border-color:color-mix(in_srgb,var(--a-sun)_35%,transparent)] [color:color-mix(in_srgb,var(--a-sun)_80%,var(--n-950))]"
          >
            Backlog
          </button>
        </div>
      </div>
    </article>
  );
});
