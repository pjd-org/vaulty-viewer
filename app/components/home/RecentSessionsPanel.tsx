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
    <div className="rounded-[28px] border border-[var(--border-default)] bg-[var(--surf-utility)] p-4 space-y-2">
      <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
        Recent sessions
      </p>
      {sessions.map((s) => (
        <Link
          key={s.id}
          to={'/session/$id'}
          params={{ id: s.id }}
          className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[var(--surf-utility)] transition-colors"
        >
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
            {s.title ?? `Session ${s.id.slice(0, 6)}`}
          </span>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className="text-xs text-[var(--text-tertiary)]">
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
