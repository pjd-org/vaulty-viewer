import React from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/src/lib/utils';
import type { InboxItemDisplay } from '../../types/display';
import { PrimaryButton, SoftChip } from '../ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@vault/ui';

interface InboxItemDetail {
  summary?: string;
  whySurfaced?: string | null;
  severity?: string | null;
  inboxBucket?: string;
  rejectionReason?: string | null;
  runId?: string | null;
  runAction?: string | null;
  sourceId?: string | null;
  reversibility?: 'low' | 'medium' | 'high' | null;
}

interface InboxItemCardProps {
  item: InboxItemDisplay;
  detail?: InboxItemDetail;
  /** @deprecated no-op, kept for backwards compat */
  isExpanded?: boolean;
  /** @deprecated no-op, kept for backwards compat */
  onToggle?: () => void;
  onInspect: () => void;
  onPromote?: () => void;
  onReject?: () => void;
  /** Optional slot rendered in the modal footer (e.g. "Convert to task" button) */
  convertPanel?: React.ReactNode;
  /** Override the primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

/* ── severity config ── */
const SEVERITY_CONFIG: Record<
  string,
  { bar: string; badge: string; dot: string; label: string }
> = {
  critical: {
    bar: 'bg-[color-mix(in_srgb,var(--a-rose)_80%,transparent)]',
    badge:
      'bg-[color-mix(in_srgb,var(--a-rose)_10%,transparent)] text-[var(--text-danger)] border-[color-mix(in_srgb,var(--a-rose)_20%,transparent)]',
    dot: 'bg-[color-mix(in_srgb,var(--a-rose)_80%,transparent)]',
    label: 'Critical',
  },
  high: {
    bar: 'bg-[color-mix(in_srgb,var(--a-sun)_80%,transparent)]',
    badge:
      'bg-[color-mix(in_srgb,var(--a-sun)_10%,transparent)] text-[var(--text-warning)] border-[color-mix(in_srgb,var(--a-sun)_20%,transparent)]',
    dot: 'bg-[color-mix(in_srgb,var(--a-sun)_80%,transparent)]',
    label: 'High',
  },
  medium: {
    bar: 'bg-[color-mix(in_srgb,var(--a-sun)_50%,transparent)]',
    badge:
      'bg-[color-mix(in_srgb,var(--a-sun)_10%,transparent)] text-[var(--text-warning)] border-[color-mix(in_srgb,var(--a-sun)_20%,transparent)]',
    dot: 'bg-[color-mix(in_srgb,var(--a-sun)_50%,transparent)]',
    label: 'Medium',
  },
  low: {
    bar: 'bg-[var(--surf-utility)]',
    badge:
      'bg-[var(--surf-utility)] text-[var(--text-tertiary)] border-[var(--border-glass)]',
    dot: 'bg-[var(--surf-utility)]',
    label: 'Low',
  },
};

function getSeverityConfig(severity?: string | null) {
  if (!severity) return null;
  return (
    SEVERITY_CONFIG[severity] ?? {
      bar: 'bg-[var(--surf-utility)]',
      badge:
        'bg-[var(--surf-utility)] text-[var(--text-tertiary)] border-[var(--border-glass)]',
      dot: 'bg-[var(--surf-utility)]',
      label: severity,
    }
  );
}

/* ── bucket display ── */
function formatBucket(bucket?: string) {
  if (!bucket) return null;
  return bucket.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── reversibility chip config ── */
const REVERSIBILITY_CONFIG: Record<
  'low' | 'medium' | 'high',
  { label: string; className: string }
> = {
  high: {
    label: 'Reversible',
    className:
      'bg-[color-mix(in_srgb,var(--a-mint)_10%,transparent)] text-[var(--text-success)] ring-[color-mix(in_srgb,var(--a-mint)_20%,transparent)]',
  },
  medium: {
    label: 'Partially reversible',
    className:
      'bg-[color-mix(in_srgb,var(--a-sun)_10%,transparent)] text-[var(--text-warning)] ring-[color-mix(in_srgb,var(--a-sun)_20%,transparent)]',
  },
  low: {
    label: 'Irreversible',
    className:
      'bg-[color-mix(in_srgb,var(--a-rose)_10%,transparent)] text-[var(--text-danger)] ring-[color-mix(in_srgb,var(--a-rose)_20%,transparent)]',
  },
};

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
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        {label}
      </span>
      <span
        className={cn(
          'text-sm text-[var(--text-secondary)] leading-snug',
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
  convertPanel,
  accentColor,
}: {
  open: boolean;
  onClose: () => void;
  item: InboxItemDisplay;
  detail?: InboxItemDetail;
  onPromote?: () => void;
  onReject?: () => void;
  convertPanel?: React.ReactNode;
  accentColor?: string;
}) {
  const accent = accentColor ?? 'var(--a-sky)';
  const sev = getSeverityConfig(detail?.severity);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* darker scrim — 55% opacity */}
      <DialogContent
        className={cn(
          'w-full max-w-[520px] rounded-2xl border-0 p-0 overflow-hidden',
          'shadow-lg',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'duration-200'
        )}
        style={{ background: 'var(--surf-elevated)' }}
        /* Override the default overlay to get correct scrim opacity */
      >
        {/* ── Hero header ── */}
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-b from-[var(--surf-utility)] to-[var(--surf-elevated)] border-b border-[var(--border-glass-soft)]">
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
              <DialogTitle className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug">
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
                  className="text-[11px] text-[var(--text-tertiary)]"
                  suppressHydrationWarning
                >
                  {item.ageLabel}
                </span>
              )}
            </div>
          </DialogHeader>

          {/* close — clean rounded button */}
          <DialogClose
            className="absolute right-4 top-4 size-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surf-utility)] transition-colors focus-visible:outline-none"
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = `0 0 0 2px color-mix(in srgb, ${accent} 40%, transparent)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = '';
            }}
          >
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
            <p className="font-mono text-[11px] text-[var(--text-tertiary)] leading-relaxed truncate">
              {shortPath(item.contextSnippet) ?? item.contextSnippet}
            </p>
          )}

          {detail?.summary && detail.summary !== item.contextSnippet && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {detail.summary}
            </p>
          )}

          {/* metadata grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 rounded-xl bg-[var(--surf-utility)] border border-[var(--border-glass-soft)] px-4 py-3.5">
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
                    <span className="block text-[11px] text-[var(--text-tertiary)] mt-0.5 font-sans">
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
                style={{
                  background: `color-mix(in srgb, ${accent} 10%, transparent)`,
                  borderColor: `color-mix(in srgb, ${accent} 20%, transparent)`,
                }}
                className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium text-[var(--text-info)] transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `color-mix(in srgb, ${accent} 18%, transparent)`;
                  e.currentTarget.style.borderColor = `color-mix(in srgb, ${accent} 30%, transparent)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `color-mix(in srgb, ${accent} 10%, transparent)`;
                  e.currentTarget.style.borderColor = `color-mix(in srgb, ${accent} 20%, transparent)`;
                }}
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
              to="/primary-agent"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surf-elevated)] border border-[var(--border-glass)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surf-utility)] hover:border-[var(--border-glass-soft)] transition-colors"
            >
              Ask Primary Agent
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
        {(onPromote || onReject || convertPanel) && (
          <div className="border-t border-[var(--border-glass-soft)] bg-[var(--surf-utility)] px-6 py-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">{convertPanel}</div>
            <div className="flex items-center gap-2">
              {onReject && (
                <button
                  type="button"
                  className="rounded-full border border-[color-mix(in_srgb,var(--a-rose)_20%,transparent)] bg-[var(--surf-elevated)] px-4 py-2 text-xs font-medium text-[var(--text-danger)] hover:bg-[color-mix(in_srgb,var(--a-rose)_8%,transparent)] hover:border-[color-mix(in_srgb,var(--a-rose)_30%,transparent)] transition-colors"
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
  isExpanded: _isExpanded,
  onToggle: _onToggle,
  onInspect,
  onPromote,
  onReject,
  convertPanel,
  accentColor,
}: InboxItemCardProps) {
  const accent = accentColor ?? 'var(--a-sky)';
  const [overlayOpen, setOverlayOpen] = React.useState(false);

  const sev = getSeverityConfig(detail?.severity);

  const handleInspect = () => {
    setOverlayOpen(true);
    onInspect?.();
  };

  const handleClose = () => {
    setOverlayOpen(false);
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
        convertPanel={convertPanel}
        accentColor={accentColor}
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

        <div
          className={cn(
            'genie-card z-10 isolate transition-all duration-150 group',
            'min-h-[212px] rounded-2xl',
            !item.isBlocked && [
              'bg-[var(--surf-elevated)]',
              'hover:-translate-y-[2px] hover:border-[var(--border-glass)]',
              'hover:shadow-md',
              'shadow-sm',
              'animate-fade-in',
            ],
            item.isBlocked &&
              'bg-transparent border-[var(--border-glass)] border-2 shadow-none'
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

          <div className="flex h-full flex-col px-4 py-3.5 pl-5">
            {/* ── row 1: title + chips + age ── */}
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-sm font-semibold text-[var(--text-primary)] flex-1 min-w-0 line-clamp-2 leading-snug">
                {item.title}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <SoftChip label={item.originLabel} variant="default" />
                {item.isBlocked && (
                  <SoftChip label="Blocked" variant="danger" />
                )}
                {item.ageLabel && (
                  <span
                    className="text-[11px] text-[var(--text-tertiary)] tabular-nums"
                    suppressHydrationWarning
                  >
                    {item.ageLabel}
                  </span>
                )}
              </div>
            </div>

            {/* ── row 2: short path ── */}
            {item.contextSnippet && (
              <p className="mt-1 text-[11px] text-[var(--text-tertiary)] leading-relaxed line-clamp-1 font-mono">
                {shortPath(item.contextSnippet) ?? item.contextSnippet}
              </p>
            )}

            {/* ── row 3: why surfaced + reversibility chip ── */}
            {(detail?.whySurfaced || detail?.reversibility) && (
              <div className="mt-2 flex items-start gap-2 min-w-0">
                {detail.whySurfaced && (
                  <p className="flex-1 min-w-0 text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {detail.whySurfaced}
                  </p>
                )}
                {detail.reversibility &&
                  REVERSIBILITY_CONFIG[detail.reversibility] && (
                    <span
                      className={cn(
                        'shrink-0 inline-flex items-center rounded-full px-2 py-0.5',
                        'text-[10px] font-semibold ring-1 ring-inset',
                        REVERSIBILITY_CONFIG[detail.reversibility].className
                      )}
                    >
                      {REVERSIBILITY_CONFIG[detail.reversibility].label}
                    </span>
                  )}
              </div>
            )}

            {detail?.summary && (
              <p className="mt-3 text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                {detail.summary}
              </p>
            )}

            {/* ── row 3: actions ── */}
            <div className="mt-auto flex items-center gap-2 pt-4">
              {/* Inspect — opens modal */}
              <button
                type="button"
                onClick={handleInspect}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5',
                  'text-xs font-medium transition-all duration-150',
                  'border-[var(--border-glass)] bg-[var(--surf-elevated)] text-[var(--text-secondary)] shadow-sm',
                  'hover:border-[var(--border-glass-soft)] hover:text-[var(--text-primary)] hover:bg-[var(--surf-utility)]',
                  'focus-visible:outline-none'
                )}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 2px color-mix(in srgb, ${accent} 40%, transparent)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  fill="none"
                  aria-hidden="true"
                  className="text-[var(--text-tertiary)]"
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
