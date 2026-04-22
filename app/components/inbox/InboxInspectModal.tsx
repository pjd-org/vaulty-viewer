import React from 'react';
import { Link } from '@tanstack/react-router';
import type { ModalProps } from 'react-easy-modals';
import { cn } from '@/src/lib/utils';
import type { InboxItemDisplay } from '../../types/display';
import { PrimaryButton, SoftChip } from '../ui';
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '../ui/modal';

// ─── types ───────────────────────────────────────────────────────────────────

export type InboxInspectCloseValue = 'promote' | 'reject' | undefined;

export interface InboxItemDetail {
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

export interface InboxInspectModalOwnProps {
  item: InboxItemDisplay;
  detail?: InboxItemDetail;
  onPromote?: () => void;
  onReject?: () => void;
  convertPanel?: React.ReactNode;
  accentColor?: string;
}

export type InboxInspectModalProps = ModalProps<InboxInspectCloseValue> &
  InboxInspectModalOwnProps;

// ─── severity config ──────────────────────────────────────────────────────────

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

function formatBucket(bucket?: string) {
  if (!bucket) return null;
  return bucket.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortPath(path?: string | null) {
  if (!path) return null;
  const parts = path.replace(/\.md$/, '').split('/');
  return parts.slice(-2).join(' / ');
}

// ─── MetaRow ─────────────────────────────────────────────────────────────────

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

// ─── Modal component ──────────────────────────────────────────────────────────

export function InboxInspectModal({
  close,
  item,
  detail,
  onPromote,
  onReject,
  convertPanel,
  accentColor,
}: InboxInspectModalProps) {
  const accent = accentColor ?? 'var(--a-sky)';
  const sev = getSeverityConfig(detail?.severity);

  return (
    <Modal>
      <ModalContent
        className={cn(
          'w-full max-w-[520px] rounded-2xl border-0 p-0 overflow-hidden',
          'shadow-lg',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'duration-200'
        )}
        style={{ background: 'var(--surf-elevated)' }}
      >
        {/* ── Hero header ── */}
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-b from-[var(--surf-utility)] to-[var(--surf-elevated)] border-b border-[var(--border-glass-soft)]">
          {sev && (
            <div
              className={cn('absolute left-0 top-0 bottom-0 w-[3px]', sev.bar)}
              aria-hidden="true"
            />
          )}

          <ModalHeader className="pl-2">
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
              <ModalTitle className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug">
                {item.title}
              </ModalTitle>
            </div>

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
          </ModalHeader>

          <ModalClose
            className="absolute right-4 top-4 size-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surf-utility)] transition-colors focus-visible:outline-none cursor-pointer"
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
          </ModalClose>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 flex flex-col gap-4">
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

          <div className="flex flex-wrap gap-2 pt-0.5">
            {detail?.sourceId && (
              <Link
                to="/note"
                search={{ p: detail.sourceId.replace(/\.md$/i, '') }}
                onClick={() => close(undefined)}
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
              onClick={() => close(undefined)}
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

        {/* ── Footer ── */}
        {(onPromote || onReject || convertPanel) && (
          <div className="border-t border-[var(--border-glass-soft)] bg-[var(--surf-utility)] px-6 py-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">{convertPanel}</div>
            <div className="flex items-center gap-2">
              {onReject && (
                <button
                  type="button"
                  className="cursor-pointer rounded-full border border-[color-mix(in_srgb,var(--a-rose)_20%,transparent)] bg-[var(--surf-elevated)] px-4 py-2 text-xs font-medium text-[var(--text-danger)] hover:bg-[color-mix(in_srgb,var(--a-rose)_8%,transparent)] hover:border-[color-mix(in_srgb,var(--a-rose)_30%,transparent)] transition-colors"
                  onClick={() => {
                    onReject();
                    close('reject');
                  }}
                >
                  Reject
                </button>
              )}
              {onPromote && (
                <PrimaryButton
                  onClick={() => {
                    onPromote();
                    close('promote');
                  }}
                >
                  Promote
                </PrimaryButton>
              )}
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
