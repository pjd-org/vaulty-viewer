import React from 'react';
import { toInboxItemDisplay } from '../../lib/display';
import type { InboxItem } from '../../lib/viewer-adapter';
import type { InboxNote } from '../../../src/lib/inbox-logic';

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
    critical: 'bg-red-500',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-slate-300',
  };
  const sevBar = item.severity
    ? (severityColor[item.severity] ?? 'bg-slate-200')
    : undefined;

  const confidence = run?.confidence;
  const itemCount = run?.itemCount;

  const reversibilityLabel: Record<string, string> = {
    high: 'Reversible',
    medium: 'Partial',
    low: 'Irreversible',
  };
  const reversibilityColor: Record<string, string> = {
    high: 'text-emerald-700 bg-emerald-50 ring-emerald-200',
    medium: 'text-yellow-700 bg-yellow-50 ring-yellow-200',
    low: 'text-red-700 bg-red-50 ring-red-200',
  };

  return (
    <div
      className="group relative flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-all duration-150 hover:border-slate-300 hover:shadow-[0_4px_14px_-8px_rgba(15,23,42,0.2)] cursor-pointer animate-fade-in"
      onClick={onInspect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onInspect()}
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
          <span className="flex-1 min-w-0 text-sm font-semibold text-slate-800 leading-snug line-clamp-1">
            {display.title}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
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
                className="text-[11px] text-slate-400 tabular-nums"
                suppressHydrationWarning
              >
                {display.ageLabel}
              </span>
            )}
          </div>
        </div>

        {/* row 2: why surfaced / summary */}
        {(item.whySurfaced || item.summary) && (
          <p className="mt-1 text-[12px] text-slate-500 line-clamp-1 leading-relaxed">
            {item.whySurfaced ?? item.summary}
          </p>
        )}

        {/* row 3: meta pills */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {run?.runType && (
            <span className="text-[10px] font-mono text-slate-400">
              {run.runType}
            </span>
          )}
          {confidence !== undefined && (
            <span className="text-[10px] text-slate-400">
              conf{' '}
              <span className="font-medium text-slate-600">
                {(confidence * 100).toFixed(0)}%
              </span>
            </span>
          )}
          {itemCount !== undefined && (
            <span className="text-[10px] text-slate-400">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
          )}
          {run?.runId && (
            <span className="text-[10px] font-mono text-slate-300 truncate max-w-[120px]">
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
            className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-colors"
          >
            Reject
          </button>
        )}
        {onPromote && (
          <button
            type="button"
            disabled={actionInFlight}
            onClick={onPromote}
            className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            Promote
          </button>
        )}
      </div>
    </div>
  );
}
