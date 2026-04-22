'use client';

/**
 * agent-shell/thread-history.tsx
 *
 * Sidebar panel listing prior agent threads from localStorage.
 * Uses ThreadRegistry / useThreadRegistry() — no props required.
 *
 * Usage:
 *   <ThreadHistory
 *     activeThreadId={threadId}
 *     onSelect={(id) => navigate({ to: '/chat', search: { threadId: id } })}
 *   />
 */

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import {
  useThreadRegistry,
  ThreadRegistry,
} from '../../lib/agent-shell/thread-registry';
import type { ThreadEntry } from '../../lib/agent-shell/thread-registry';
import { MODE_CONFIGS } from '../../lib/agent-shell/mode-config';

// ── Props ─────────────────────────────────────────────────────────────────────

export type ThreadHistoryProps = {
  /** Highlight the currently active thread */
  activeThreadId?: string | null;
  /** Called when the user clicks a thread row */
  onSelect: (entry: ThreadEntry) => void;
  className?: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ThreadHistory({
  activeThreadId,
  onSelect,
  className,
}: ThreadHistoryProps) {
  const threads = useThreadRegistry();

  return (
    <div
      className={cn('flex flex-col min-h-0', className)}
      aria-label="Thread history"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <span className="text-xs font-semibold tracking-wide uppercase text-[--text-muted,theme(colors.zinc.400)]">
          History
        </span>
        {threads.length > 0 && (
          <button
            type="button"
            onClick={() => ThreadRegistry.clear()}
            className={cn(
              'text-[10px] text-[--text-muted,theme(colors.zinc.500)]',
              'hover:text-[--text-default,theme(colors.zinc.200)] transition-colors'
            )}
          >
            Clear all
          </button>
        )}
      </div>

      {/* List */}
      <ul
        role="list"
        className="flex flex-col gap-0.5 overflow-y-auto px-1 pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
      >
        {threads.length === 0 && (
          <li className="px-3 py-4 text-xs text-center text-[--text-muted,theme(colors.zinc.500)]">
            No threads yet
          </li>
        )}

        {threads.map((entry) => (
          <ThreadRow
            key={entry.id}
            entry={entry}
            active={entry.id === activeThreadId}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

type ThreadRowProps = {
  entry: ThreadEntry;
  active: boolean;
  onSelect: (entry: ThreadEntry) => void;
};

function ThreadRow({ entry, active, onSelect }: ThreadRowProps) {
  const modeConfig = MODE_CONFIGS[entry.mode];
  const relTime = useRelativeTime(entry.updatedAt);

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    ThreadRegistry.remove(entry.id);
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(entry)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group w-full text-left rounded-lg px-3 py-2',
          'flex flex-col gap-0.5 transition-colors',
          active
            ? 'bg-white/10 text-[--text-default,theme(colors.zinc.100)]'
            : 'hover:bg-white/5 text-[--text-secondary,theme(colors.zinc.300)]'
        )}
      >
        {/* Top row: mode badge + timestamp + delete */}
        <div className="flex items-center gap-1.5">
          <ModeBadge label={modeConfig?.label ?? entry.mode} />
          <span className="flex-1" />
          <span className="text-[10px] text-[--text-muted,theme(colors.zinc.500)] shrink-0">
            {relTime}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            aria-label={`Delete thread ${entry.title}`}
            tabIndex={-1}
            className={cn(
              'ml-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
              'text-[--text-muted,theme(colors.zinc.500)] hover:text-red-400'
            )}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 2l8 8M10 2l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Title */}
        <span className="text-sm font-medium leading-snug line-clamp-1">
          {entry.title || entry.id}
        </span>

        {/* Preview */}
        {entry.preview && (
          <span
            className={cn(
              'text-xs leading-snug line-clamp-2',
              'text-[--text-muted,theme(colors.zinc.500)]'
            )}
          >
            {entry.preview}
          </span>
        )}
      </button>
    </li>
  );
}

// ── ModeBadge ─────────────────────────────────────────────────────────────────

function ModeBadge({ label }: { label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1 py-0.5',
        'text-[9px] font-semibold uppercase tracking-wider',
        'bg-white/10 text-[--text-muted,theme(colors.zinc.400)]'
      )}
    >
      {label}
    </span>
  );
}

// ── Relative time hook ────────────────────────────────────────────────────────

function useRelativeTime(isoTimestamp: string): string {
  const [label, setLabel] = React.useState(() => formatRelative(isoTimestamp));

  React.useEffect(() => {
    setLabel(formatRelative(isoTimestamp));
    // Refresh every 60 s so labels stay current
    const id = setInterval(
      () => setLabel(formatRelative(isoTimestamp)),
      60_000
    );
    return () => clearInterval(id);
  }, [isoTimestamp]);

  return label;
}

function formatRelative(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  if (isNaN(diff)) return '';
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoTimestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
