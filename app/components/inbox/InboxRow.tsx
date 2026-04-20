import React from 'react';
import { toInboxItemDisplay } from '../../lib/display';
import type { InboxItem } from '../../lib/viewer-adapter';
import type { InboxNote } from '../../../src/lib/inbox-logic';
import { activateOnKeyboardEvent } from '../../../src/lib/keyboard';

const metaChipClass = 'text-[10px] text-text3';

// ---------------------------------------------------------------------------
// Local types (mirrored from inbox route)
// ---------------------------------------------------------------------------

export interface RunItem {
  path?: string;
  targetPath?: string;
  domainFields?: Record<string, unknown>;
}

export interface Run {
  runId: string;
  runType?: string;
  action?: string;
  itemCount: number;
  confidence?: number;
  templateRef?: string;
  items: RunItem[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Private helper — mirrors the local helper in inbox.tsx
// ---------------------------------------------------------------------------

function runToOriginSource(runType?: string): string {
  if (runType === 'signals_infer') return 'agent';
  if (runType === 'conversation') return 'llm';
  return runType ?? 'manual';
}

function inboxItemToDisplay(item: InboxItem, note?: InboxNote, run?: Run) {
  const createdAt = (note?.frontmatter?.created ??
    note?.frontmatter?.createdAt ??
    null) as string | null | undefined;
  const source =
    item.rejectionType === 'user'
      ? 'manual'
      : note?.source === 'extracted'
        ? 'agent'
        : run
          ? runToOriginSource(run.runType)
          : item.inboxBucket === 'deferred' ||
              item.inboxBucket === 'rejected_automated'
            ? 'agent'
            : 'manual';

  return toInboxItemDisplay({
    title: item.title,
    _source: source,
    _run_id: run?.runId,
    description: item.summary,
    createdAt: createdAt ?? item.surfacedAt,
    status:
      note?.status ??
      (item.severity === 'high' || item.severity === 'critical'
        ? 'blocked'
        : undefined),
  });
}

// ---------------------------------------------------------------------------
// InboxRow
// ---------------------------------------------------------------------------

export interface InboxRowProps {
  item: InboxItem;
  note?: InboxNote;
  run?: Run;
  onInspect: () => void;
  onPromote?: () => void;
  onReject?: () => void;
  actionInFlight?: boolean;
}

export function InboxRow({
  item,
  note,
  run,
  onInspect,
  onPromote,
  onReject,
  actionInFlight,
}: InboxRowProps) {
  const display = inboxItemToDisplay(item, note, run);

  const severityColor: Record<string, string> = {
    critical: 'bg-[color-mix(in_srgb,var(--a-rose)_80%,transparent)]',
    high: 'bg-[color-mix(in_srgb,var(--a-sun)_80%,transparent)]',
    medium: 'bg-[color-mix(in_srgb,var(--a-sun)_50%,transparent)]',
    low: 'bg-[var(--border-default)]',
  };
  const sevBar = item.severity
    ? (severityColor[item.severity] ?? 'bg-[var(--surf-utility)]')
    : undefined;

  const confidence = run?.confidence;
  const itemCount = run?.itemCount;

  const reversibilityLabel: Record<string, string> = {
    high: 'Reversible',
    medium: 'Partial',
    low: 'Irreversible',
  };
  const reversibilityColor: Record<string, string> = {
    high: 'text-[var(--text-success)] bg-[color-mix(in_srgb,var(--a-mint)_10%,transparent)] ring-[color-mix(in_srgb,var(--a-mint)_20%,transparent)]',
    medium:
      'text-[var(--text-warning)] bg-[color-mix(in_srgb,var(--a-sun)_10%,transparent)] ring-[color-mix(in_srgb,var(--a-sun)_20%,transparent)]',
    low: 'text-[var(--text-danger)] bg-[color-mix(in_srgb,var(--a-rose)_10%,transparent)] ring-[color-mix(in_srgb,var(--a-rose)_20%,transparent)]',
  };

  return (
    <div
      className="group relative flex items-start gap-3 rounded-xl border border-border bg-[var(--surf-elevated)] px-4 py-3.5 transition-[background-color,border-color,box-shadow,transform,color] duration-150 hover:border-borderSoft hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_24%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent cursor-pointer animate-fade-in"
      onClick={onInspect}
      role="button"
      tabIndex={0}
      aria-label={display.title}
      onKeyDown={(e) => activateOnKeyboardEvent(e, onInspect)}
    >
      {/* severity bar */}
      {sevBar && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${sevBar}`}
          aria-hidden="true"
        />
      )}

      {/* main content */}
      <div className="flex-1 min-w-0 pl-1">
        {/* row 1: title + chips */}
        <div className="flex items-start gap-2 min-w-0">
          <span className="flex-1 min-w-0 text-sm font-semibold text-text leading-snug line-clamp-1">
            {display.title}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center rounded-full bg-surface3 px-2 py-0.5 text-[10px] font-medium text-text2">
              {display.originLabel}
            </span>
            {item.reversibility && reversibilityLabel[item.reversibility] && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${reversibilityColor[item.reversibility]}`}
              >
                {reversibilityLabel[item.reversibility]}
              </span>
            )}
            {display.ageLabel && (
              <span
                className="text-[11px] text-text3 tabular-nums"
                suppressHydrationWarning
              >
                {display.ageLabel}
              </span>
            )}
          </div>
        </div>

        {/* row 2: why surfaced / summary */}
        {(item.whySurfaced || item.summary) && (
          <p className="mt-1 text-[12px] text-text2 line-clamp-1 leading-relaxed">
            {item.whySurfaced ?? item.summary}
          </p>
        )}

        {/* row 3: meta pills */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {run?.runType && (
            <span className="text-[10px] font-mono text-text3">
              {run.runType}
            </span>
          )}
          {confidence !== undefined && (
            <span className={metaChipClass}>
              conf{' '}
              <span className="font-medium text-text2">
                {(confidence * 100).toFixed(0)}%
              </span>
            </span>
          )}
          {itemCount !== undefined && (
            <span className={metaChipClass}>
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
          )}
          {run?.runId && (
            <span className="text-[10px] font-mono text-text3 truncate max-w-[120px]">
              {run.runId}
            </span>
          )}
        </div>
      </div>

      {/* hover actions — stop propagation so they don't open the modal */}
      <div
        className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {onReject && (
          <button
            type="button"
            disabled={actionInFlight}
            onClick={onReject}
            className="rounded-full border border-[color-mix(in_srgb,var(--a-rose)_25%,transparent)] bg-[var(--surf-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-danger)] hover:bg-[color-mix(in_srgb,var(--a-rose)_8%,transparent)] hover:border-[color-mix(in_srgb,var(--a-rose)_35%,transparent)] disabled:opacity-50 transition-colors"
          >
            Reject
          </button>
        )}
        {onPromote && (
          <button
            type="button"
            disabled={actionInFlight}
            onClick={onPromote}
            className="rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--n-0)] hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
          >
            Promote
          </button>
        )}
      </div>
    </div>
  );
}
