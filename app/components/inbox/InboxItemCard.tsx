import React from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/src/lib/utils';
import type { InboxItemDisplay } from '../../types/display';
import { Card, CardContent } from '../ui/card';
import { PrimaryButton, SecondaryButton, IconButton, SoftChip } from '../ui';

interface InboxItemDetail {
  summary?: string;
  whySurfaced?: string | null;
  severity?: string | null;
  inboxBucket?: string;
  rejectionReason?: string | null;
  runId?: string | null;
  runAction?: string | null;
  /** Source ID for cross-linking to Work */
  sourceId?: string | null;
}

interface InboxItemCardProps {
  item: InboxItemDisplay;
  /** When provided the card supports inline expand/collapse */
  detail?: InboxItemDetail;
  isExpanded?: boolean;
  onToggle?: () => void;
  /** @deprecated use onToggle — kept for backwards compat */
  onInspect: () => void;
  onPromote?: () => void;
  onReject?: () => void;
}

export function InboxItemCard({
  item,
  detail,
  isExpanded = false,
  onToggle,
  onInspect,
  onPromote,
  onReject,
}: InboxItemCardProps) {
  const [confirmingReject, setConfirmingReject] = React.useState(false);

  // If onToggle is provided, the "Inspect" button expands inline.
  // If not, it falls back to the legacy onInspect behaviour.
  const handleInspect = onToggle ?? onInspect;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl',
        item.isBlocked && 'rounded-xl'
      )}
    >
      {item.isBlocked && (
        <div
          className="absolute inset-1 z-0 rounded-lg pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 2px, var(--border) 2px, var(--border) 4px)',
            opacity: 0.35,
          }}
        />
      )}
      <Card
        className={cn(
          'z-10 isolate transition-transform duration-200',
          !isExpanded && 'hover:-translate-y-0.5',
          item.isBlocked
            ? 'bg-transparent border-border border-2 shadow-none'
            : 'shadow-[0px_4px_0px_0px_var(--border)] animate-fade-in'
        )}
      >
        <CardContent className="p-4 space-y-2">
          {/* ── summary row ── */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-slate-800 flex-1 min-w-0 truncate">
              {item.title}
            </span>
            <SoftChip label={item.originLabel} variant="default" />
            {item.isBlocked && <SoftChip label="Blocked" variant="danger" />}
            {item.ageLabel && (
              <span
                className="text-xs text-slate-500 shrink-0"
                suppressHydrationWarning
              >
                {item.ageLabel}
              </span>
            )}
          </div>

          {item.contextSnippet && (
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
              {item.contextSnippet}
            </p>
          )}

          <div className="flex items-center gap-2">
            <SecondaryButton
              onClick={handleInspect}
              aria-expanded={onToggle ? isExpanded : undefined}
            >
              {onToggle ? (isExpanded ? 'Close' : 'Inspect') : 'Inspect'}
            </SecondaryButton>
            {item.actions.includes('promote') && onPromote && (
              <PrimaryButton onClick={onPromote}>Promote</PrimaryButton>
            )}
            {onReject &&
              (confirmingReject ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-red-600 font-medium">
                    Reject?
                  </span>
                  <IconButton
                    icon={
                      <span
                        aria-hidden="true"
                        className="text-base leading-none"
                      >
                        ✓
                      </span>
                    }
                    label="Confirm reject"
                    onClick={() => {
                      onReject();
                      setConfirmingReject(false);
                    }}
                    className="text-red-600 hover:text-red-700"
                  />
                  <IconButton
                    icon={
                      <span
                        aria-hidden="true"
                        className="text-base leading-none"
                      >
                        ✕
                      </span>
                    }
                    label="Cancel reject"
                    onClick={() => setConfirmingReject(false)}
                    className="text-slate-500 hover:text-slate-700"
                  />
                </div>
              ) : (
                <IconButton
                  icon={
                    <span aria-hidden="true" className="text-base leading-none">
                      ×
                    </span>
                  }
                  label="Reject"
                  onClick={() => setConfirmingReject(true)}
                  className="text-slate-500 hover:text-red-500"
                />
              ))}
          </div>

          {/* ── inline detail (expanded) ── */}
          {isExpanded && detail && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 text-sm animate-fade-in-fast">
              {detail.summary && (
                <p className="text-slate-600 leading-relaxed">
                  {detail.summary}
                </p>
              )}

              {detail.whySurfaced && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Why surfaced
                  </p>
                  <p className="mt-1 text-slate-600">{detail.whySurfaced}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {detail.severity && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Severity
                    </p>
                    <p className="mt-1 capitalize text-slate-700">
                      {detail.severity}
                    </p>
                  </div>
                )}
                {detail.inboxBucket && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Bucket
                    </p>
                    <p className="mt-1 text-slate-700">{detail.inboxBucket}</p>
                  </div>
                )}
                {detail.rejectionReason && (
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Rejection reason
                    </p>
                    <p className="mt-1 text-slate-700">
                      {detail.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {detail.runId && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Run
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-600">
                    {detail.runId}
                  </p>
                  {detail.runAction && (
                    <p className="text-xs text-slate-500">{detail.runAction}</p>
                  )}
                </div>
              )}

              {/* Cross-surface routing */}
              <div className="flex flex-wrap gap-2 pt-1">
                {detail.sourceId && (
                  <Link
                    to="/work"
                    search={{ selectedId: detail.sourceId }}
                    className="inline-flex items-center gap-1 rounded-full border border-sky-600/40 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 transition-colors hover:border-sky-600/70 hover:bg-sky-100"
                  >
                    Open in Work →
                  </Link>
                )}
                <Link
                  to="/huey"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-black/3 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600 transition-colors hover:bg-black/6"
                >
                  Ask Huey →
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
