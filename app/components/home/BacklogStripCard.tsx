import { Link } from '@tanstack/react-router';
import { type NextAction } from '../../../src/lib/focus-logic';

interface BacklogStripCardProps {
  task: NextAction;
  onStart: (taskPath: string) => void;
  onBacklog: (taskPath: string) => void;
  mutating: boolean;
}

export function BacklogStripCard({
  task,
  onStart,
  onBacklog,
  mutating,
}: BacklogStripCardProps) {
  return (
    <article className="rounded-[18px] border border-slate-200 bg-white/70 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-800">
          {task.title}
        </p>
        <div className="flex items-center gap-2">
          {task.path ? (
            <Link
              to="/note"
              search={{ p: task.path }}
              className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700"
            >
              Open
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => onStart(task.path)}
            disabled={mutating}
            className="rounded-full border border-sky-300 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700 disabled:opacity-50"
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => onBacklog(task.path)}
            disabled={mutating}
            className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 disabled:opacity-50"
          >
            Backlog
          </button>
        </div>
      </div>
    </article>
  );
}
