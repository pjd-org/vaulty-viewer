import React from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/src/lib/utils';
import type { InboxItemDisplay } from '../../types/display';
import { Card, CardContent } from '../ui/card';
import { PrimaryButton, SecondaryButton, IconButton, SoftChip } from '../ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '../ui/dialog';

interface InboxItemDetail {
  summary?: string;
  whySurfaced?: string | null;
  severity?: string | null;
  inboxBucket?: string;
  rejectionReason?: string | null;
  runId?: string | null;
  runAction?: string | null;
  sourceId?: string | null;
}

interface InboxItemCardProps {
  item: InboxItemDisplay;
  detail?: InboxItemDetail;
  isExpanded?: boolean;
  onToggle?: () => void;
  /** @deprecated use onToggle — kept for backwards compat */
  onInspect: () => void;
  onPromote?: () => void;
  onReject?: () => void;
}

/* ── severity config ── */
const SEVERITY_CONFIG: Record<
  string,
  { bar: string; badge: string; dot: string; label: string }
> = {
  critical: {
    bar: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    label: 'Critical',
  },
  high: {
    bar: 'bg-orange-400',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-400',
    label: 'High',
  },
  medium: {
    bar: 'bg-yellow-400',
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-400',
    label: 'Medium',
  },
  low: {
    bar: 'bg-slate-300',
    badge: 'bg-slate-50 text-slate-500 border-slate-200',
    dot: 'bg-slate-300',
    label: 'Low',
  },
};

function getSeverityConfig(severity?: string | null) {
  if (!severity) return null;
  return (
    SEVERITY_CONFIG[severity] ?? {
      bar: 'bg-slate-200',
      badge: 'bg-slate-50 text-slate-500 border-slate-200',
      dot: 'bg-slate-300',
      label: severity,
    }
  );
}

/* ── bucket display ── */
function formatBucket(bucket?: string) {
  if (!bucket) return null;
  return bucket.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── path shortener — show only the last 2 segments ── */
function shortPath(path?: string | null) {
  if (!path) return null;
  const parts = path.replace(/\.md$/, '').split('/');
  return parts.slice(-2).join(' / ');
}

/* ── MetaRow ── */
function MetaRow({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <span
        className={cn(
          'text-sm text-slate-700 leading-snug',
          mono && 'font-mono text-xs'
        )}
      >
        {children}
      </span>
    </div>
  );
}

/* ── Inspect overlay ── */
function InspectOverlay({
  open,
  onClose,
  item,
  detail,
  onPromote,
  onReject,
}: {
  open: boolean;
  onClose: () => void;
  item: InboxItemDisplay;
  detail?: InboxItemDetail;
  onPromote?: () => void;
  onReject?: () => void;
}) {
  const sev = getSeverityConfig(detail?.severity);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* darker scrim — 55% opacity */}
      <DialogContent
        className={cn(
          'w-full max-w-[520px] rounded-2xl border-0 p-0 overflow-hidden',
          'shadow-[0_24px_64px_rgba(15,23,42,0.28),0_4px_16px_rgba(15,23,42,0.12)]',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'duration-200'
        )}
        style={{ background: 'white' }}
        /* Override the default overlay to get correct scrim opacity */
      >
        {/* ── Hero header ── */}
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          {/* severity bar — left edge */}
          {sev && (
            <div
              className={cn('absolute left-0 top-0 bottom-0 w-[3px]', sev.bar)}
              aria-hidden="true"
            />
          )}

          <DialogHeader className="pl-2">
            <div className="flex items-start gap-2.5 pr-8">
              {sev && (
                <span
                  className={cn(
                    'mt-0.5 inline-block size-2 rounded-full shrink-0',
                    sev.dot
                  )}
                  aria-hidden="true"
                />
              )}
              <DialogTitle className="text-[15px] font-semibold text-slate-900 leading-snug">
                {item.title}
              </DialogTitle>
            </div>

            {/* meta chips row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pl-[18px]">
              <SoftChip label={item.originLabel} variant="default" />
              {item.isBlocked && <SoftChip label="Blocked" variant="danger" />}
              {sev && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5',
                    'text-[10px] font-semibold uppercase tracking-[0.14em] border',
                    sev.badge
                  )}
                >
                  {sev.label}
                </span>
              )}
              {item.ageLabel && (
                <span
                  className="text-[11px] text-slate-400"
                  suppressHydrationWarning
                >
                  {item.ageLabel}
                </span>
              )}
            </div>
          </DialogHeader>

          {/* close — clean rounded button */}
          <DialogClose className="absolute right-4 top-4 size-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 1l10 10M11 1L1 11"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-4">
          {item.contextSnippet && (
            <p className="font-mono text-[11px] text-slate-400 leading-relaxed truncate">
              {shortPath(item.contextSnippet) ?? item.contextSnippet}
            </p>
          )}

          {detail?.summary && detail.summary !== item.contextSnippet && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {detail.summary}
            </p>
          )}

          {/* metadata grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3.5">
            {detail?.whySurfaced && (
              <div className="col-span-2">
                <MetaRow label="Why surfaced">{detail.whySurfaced}</MetaRow>
              </div>
            )}
            {detail?.rejectionReason && (
              <div className="col-span-2">
                <MetaRow label="Rejection reason">
                  {detail.rejectionReason}
                </MetaRow>
              </div>
            )}
            {detail?.inboxBucket && (
              <MetaRow label="Bucket">
                {formatBucket(detail.inboxBucket)}
              </MetaRow>
            )}
            {detail?.sourceId && (
              <MetaRow label="Source" mono>
                {shortPath(detail.sourceId)}
              </MetaRow>
            )}
            {detail?.runId && (
              <div className="col-span-2">
                <MetaRow label="Run" mono>
                  {detail.runId}
                  {detail.runAction && (
                    <span className="block text-[11px] text-slate-400 mt-0.5 font-sans">
                      {detail.runAction}
                    </span>
                  )}
                </MetaRow>
              </div>
            )}
          </div>

          {/* cross-surface actions */}
          <div className="flex flex-wrap gap-2 pt-0.5">
            {detail?.sourceId && (
              <Link
                to="/note"
                search={{ p: detail.sourceId.replace(/\.md$/i, '') }}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-colors"
              >
                Open note
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 8l6-6M8 8V2H2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            )}
            <Link
              to="/huey"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              Ask Huey
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 8l6-6M8 8V2H2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── Footer actions (only when promote/reject available) ── */}
        {(onPromote || onReject) && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-3.5 flex items-center justify-end gap-2">
            {onReject && (
              <button
                type="button"
                className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                onClick={() => {
                  onReject();
                  onClose();
                }}
              >
                Reject
              </button>
            )}
            {onPromote && (
              <PrimaryButton
                onClick={() => {
                  onPromote();
                  onClose();
                }}
              >
                Promote
              </PrimaryButton>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Main card ── */

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
  const [overlayOpen, setOverlayOpen] = React.useState(false);

  const sev = getSeverityConfig(detail?.severity);

  const handleInspect = () => {
    setOverlayOpen(true);
    onInspect?.();
  };

  const handleClose = () => {
    setOverlayOpen(false);
    if (onToggle && isExpanded) onToggle();
  };

  return (
    <>
      <InspectOverlay
        open={overlayOpen}
        onClose={handleClose}
        item={item}
        detail={detail}
        onPromote={onPromote}
        onReject={onReject}
      />

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
            'z-10 isolate transition-all duration-150 group',
            'border border-slate-200 min-h-[212px] rounded-2xl',
            !item.isBlocked && [
              'bg-gradient-to-b from-white to-slate-50/50',
              'hover:-translate-y-[2px] hover:border-slate-300',
              'hover:shadow-[0_14px_28px_-20px_rgba(15,23,42,0.45)]',
              'shadow-[0_4px_14px_-12px_rgba(15,23,42,0.3)]',
              'animate-fade-in',
            ],
            item.isBlocked &&
              'bg-transparent border-border border-2 shadow-none'
          )}
        >
          {/* severity accent bar */}
          {!item.isBlocked && sev && (
            <div
              className={cn(
                'absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-150',
                sev.bar,
                'group-hover:w-[4px]'
              )}
              aria-hidden="true"
            />
          )}

          <CardContent className="flex h-full flex-col px-4 py-3.5 pl-5">
            {/* ── row 1: title + chips + age ── */}
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-sm font-semibold text-slate-800 flex-1 min-w-0 line-clamp-2 leading-snug">
                {item.title}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <SoftChip label={item.originLabel} variant="default" />
                {item.isBlocked && (
                  <SoftChip label="Blocked" variant="danger" />
                )}
                {item.ageLabel && (
                  <span
                    className="text-[11px] text-slate-400 tabular-nums"
                    suppressHydrationWarning
                  >
                    {item.ageLabel}
                  </span>
                )}
              </div>
            </div>

            {/* ── row 2: short path ── */}
            {item.contextSnippet && (
              <p className="mt-1 text-[11px] text-slate-400 leading-relaxed line-clamp-1 font-mono">
                {shortPath(item.contextSnippet) ?? item.contextSnippet}
              </p>
            )}

            {detail?.summary && (
              <p className="mt-3 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                {detail.summary}
              </p>
            )}

            {/* ── row 3: actions ── */}
            <div className="mt-auto flex items-center gap-2 pt-4">
              {/* Inspect — styled to suggest "opens detail" */}
              <button
                type="button"
                onClick={handleInspect}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5',
                  'text-xs font-medium transition-all duration-150',
                  'border-slate-200 bg-white text-slate-600 shadow-sm',
                  'hover:border-slate-400 hover:text-slate-800 hover:bg-slate-50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50'
                )}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  fill="none"
                  aria-hidden="true"
                  className="text-slate-400"
                >
                  <circle
                    cx="5"
                    cy="5"
                    r="3.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M7.5 7.5L9.5 9.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                Inspect
              </button>

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
                      <span
                        aria-hidden="true"
                        className="text-base leading-none"
                      >
                        ×
                      </span>
                    }
                    label="Reject"
                    onClick={() => setConfirmingReject(true)}
                    className="text-slate-400 hover:text-red-500"
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
