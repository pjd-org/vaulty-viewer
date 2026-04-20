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

export function HomeTaskCard({
  task,
  onStart,
  onBacklog,
  mutating,
  compact = false,
}: HomeTaskCardProps) {
  const confidencePct = Math.max(1, Math.min(99, Math.round(task.score * 10)));
  return (
    <article className={`genie-card ${compact ? '!p-3' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className={`line-clamp-2 rounded-md border border-border bg-surface px-2 py-1.5 font-semibold text-text ${compact ? 'text-xs' : 'text-sm'}`}
          >
            {task.title}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-text2">
            <span className="inline-block size-2 rounded-full bg-border" />
            <span>Task</span>
            <span className="inline-block size-2 rounded-full bg-text2" />
          </div>
        </div>
        <TaskSeverityBadge
          priority={task.priority}
          confidencePct={confidencePct}
        />
      </div>

      <div
        className={`flex flex-wrap items-center gap-2 ${compact ? 'mt-3' : 'mt-4'}`}
      >
        {task.path ? (
          <Link
            to="/note"
            search={{ p: task.path }}
            className="rounded-full border border-border bg-[var(--surf-elevated)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-text hover:bg-surface"
          >
            Open
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="cursor-not-allowed rounded-full border border-border bg-surface3 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-text3"
          >
            Open
          </span>
        )}
        <button
          type="button"
          onClick={() => onStart(task.path)}
          disabled={mutating}
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] disabled:opacity-50 [background:color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))] [border-color:color-mix(in_srgb,var(--a-sky)_35%,transparent)] [color:color-mix(in_srgb,var(--a-sky)_70%,var(--n-950))] hover:[background:color-mix(in_srgb,var(--a-sky)_22%,var(--surf-elevated))]"
        >
          {mutating ? 'Starting…' : 'Start'}
        </button>
        <button
          type="button"
          onClick={() => onBacklog(task.path)}
          disabled={mutating}
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] disabled:opacity-50 [background:color-mix(in_srgb,var(--a-sun)_12%,var(--surf-elevated))] [border-color:color-mix(in_srgb,var(--a-sun)_35%,transparent)] [color:color-mix(in_srgb,var(--a-sun)_80%,var(--n-950))] hover:[background:color-mix(in_srgb,var(--a-sun)_22%,var(--surf-elevated))]"
        >
          {mutating ? 'Updating…' : 'Backlog'}
        </button>
      </div>
    </article>
  );
}
