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
    <article
      className={`rounded-[18px] border border-slate-200 bg-white/70 shadow-sm ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className={`line-clamp-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 font-semibold text-slate-800 ${compact ? 'text-xs' : 'text-sm'}`}
          >
            {task.title}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-block size-2 rounded-full bg-slate-300" />
            <span>Task</span>
            <span className="inline-block size-2 rounded-full bg-slate-500" />
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
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-50"
          >
            Open
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="cursor-not-allowed rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
          >
            Open
          </span>
        )}
        <button
          type="button"
          onClick={() => onStart(task.path)}
          disabled={mutating}
          className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 hover:bg-sky-100 disabled:opacity-50"
        >
          {mutating ? 'Starting…' : 'Start'}
        </button>
        <button
          type="button"
          onClick={() => onBacklog(task.path)}
          disabled={mutating}
          className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 hover:bg-amber-100 disabled:opacity-50"
        >
          {mutating ? 'Updating…' : 'Backlog'}
        </button>
      </div>
    </article>
  );
}
