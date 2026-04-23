import { Link } from '@tanstack/react-router';
import {
  formatSessionDuration,
  type SessionSummary,
} from '../../../src/lib/focus-logic';

interface RecentSessionsPanelProps {
  sessions: SessionSummary[];
}

export function RecentSessionsPanel({ sessions }: RecentSessionsPanelProps) {
  if (!sessions.length) return null;
  return (
    <div className="flex flex-col gap-2 rounded-[28px] border border-[var(--border-default)] bg-[var(--surf-utility)] p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
        Recent sessions
      </p>
      {sessions.map((s) => (
        <Link
          key={s.id}
          to={'/session/$id'}
          params={{ id: s.id }}
          className="flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 transition-colors hover:border-[var(--border-glass-soft)] hover:bg-[var(--surf-elevated)]"
        >
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
            {s.title ?? `Session ${s.id.slice(0, 6)}`}
          </span>
          <div className="ml-3 flex shrink-0 items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
              {formatSessionDuration(s.startedAt, s.endedAt)}
            </span>
            <span className="text-xs text-[var(--text-tertiary)] capitalize">
              {s.status}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
