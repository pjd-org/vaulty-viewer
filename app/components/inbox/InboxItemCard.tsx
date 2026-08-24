import React from 'react';
import { cn } from '@/src/lib/utils';
import type { InboxItemDisplay } from '../../types/display';
import { SoftChip } from '../ui';
import type { InboxItemDetail } from './InboxInspectModal';

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
  actionInFlight?: boolean;
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

/* ── Main card ── */

export function InboxItemCard({
  item,
  detail,
  isExpanded: _isExpanded,
  onToggle: _onToggle,
  onInspect,
  onPromote,
  onReject,
  actionInFlight: _actionInFlight,
  convertPanel,
  accentColor,
}: InboxItemCardProps) {
  const accent = accentColor ?? 'var(--a-sky)';

  const sev = getSeverityConfig(detail?.severity);

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
              {item.isBlocked && <SoftChip label="Blocked" variant="danger" />}
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
              {detail.whySurfaced && detail.whySurfaced !== detail.summary && (
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

          {/* ── row 4: actions ── */}
          <div className="mt-auto flex items-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => onInspect()}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 cursor-pointer',
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
  );
}
