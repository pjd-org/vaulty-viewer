import React from 'react';
import type { PressureSignal } from '../../lib/viewer-adapter';
import { codActionBtnClass, codBadgeBaseClass } from './CodActionRow';

// ---------------------------------------------------------------------------
// Legacy V1 support
// ---------------------------------------------------------------------------

const VARIANT_COLOR: Record<string, string> = {
  ok: 'text-success',
  warn: 'text-warning',
  bad: 'text-danger',
};

interface CodSignalItem {
  label: string;
  value: string;
  variant?: 'ok' | 'warn' | 'bad';
}

// ---------------------------------------------------------------------------
// Severity badge — Genie accent tokens
// ---------------------------------------------------------------------------

const SEVERITY_STYLES: Record<string, React.CSSProperties> = {
  low: { background: 'var(--n-100)', color: 'var(--text-secondary)' },
  medium: {
    background: 'var(--a-sun)',
    color: 'var(--text-primary)',
    opacity: 0.9,
  },
  high: {
    background: 'color-mix(in srgb, var(--a-peach) 40%, transparent)',
    color: 'var(--text-primary)',
  },
  critical: {
    background: 'color-mix(in srgb, var(--a-rose) 40%, transparent)',
    color: 'var(--text-primary)',
  },
};

function SeverityBadge({ severity }: { severity: string }) {
  const style = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low;
  return (
    <span
      className={`${codBadgeBaseClass} uppercase tracking-[0.16em]`}
      style={style}
    >
      {severity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Signal card — Genie glass surface
// ---------------------------------------------------------------------------

function SignalCard({
  signal,
  onOpen,
  onAct,
  accentColor,
}: {
  signal: PressureSignal;
  onOpen?: () => void;
  onAct?: () => void;
  accentColor?: string;
}) {
  const accent = accentColor ?? 'var(--a-mint)';
  const surfaceTone =
    signal.severity === 'critical'
      ? 'danger'
      : signal.severity === 'high'
        ? 'warning'
        : signal.severity === 'medium'
          ? 'info'
          : 'success';
  return (
    <article className={`genie-card genie-card--${surfaceTone} flex flex-col gap-2`}>
      <div className="flex items-start justify-between gap-3">
        <h3
          className="min-w-0 flex-1 text-sm font-semibold line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {signal.title}
        </h3>
        <SeverityBadge severity={signal.severity} />
      </div>
      {signal.whySurfaced && (
        <p
          className="text-xs line-clamp-2 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {signal.whySurfaced}
        </p>
      )}
      {/* Signal metadata */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {signal.sourceType && (
          <span
            className="text-[11px] flex items-center gap-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <span
              className="font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Source type
            </span>
            <span>{signal.sourceType}</span>
          </span>
        )}
        {signal.confidence != null && (
          <span
            className="text-[11px] flex items-center gap-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <span
              className="font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Confidence
            </span>
            <span>{Math.round(signal.confidence * 100)}%</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 pt-1">
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className={codActionBtnClass}
            style={{
              border: '1px solid var(--border-soft)',
              background: 'var(--surf-glass)',
              color: 'var(--text-secondary)',
            }}
          >
            Open
          </button>
        )}
        {onAct && (
          <button
            type="button"
            onClick={onAct}
            className={codActionBtnClass}
            style={{
              border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
              background: `color-mix(in srgb, ${accent} 20%, transparent)`,
              color: 'var(--text-primary)',
            }}
          >
            Act
          </button>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CodSignalRowProps {
  /** V3: PressureSignal array */
  signals?: PressureSignal[];
  /** V3: per-signal callbacks — called with the signal object */
  onOpen?: (signal: PressureSignal) => void;
  onAct?: (signal: PressureSignal) => void;
  /** V1 legacy: metadata pairs rendered below signals */
  items?: CodSignalItem[];
  /** Override the Act button's primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

export function CodSignalRow({
  signals,
  onOpen,
  onAct,
  items,
  accentColor,
}: CodSignalRowProps) {
  return (
    <div className="flex flex-col gap-3">
      {signals && signals.length > 0 && (
        <div className="flex flex-col gap-3">
          {signals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onOpen={onOpen ? () => onOpen(signal) : undefined}
              onAct={onAct ? () => onAct(signal) : undefined}
              accentColor={accentColor}
            />
          ))}
        </div>
      )}

      {/* V1 legacy items rendered below signals */}
      {items && items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map(({ label, value, variant }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-2"
            >
              <span
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {label}
              </span>
              <span
                className={`text-sm font-medium ${variant ? VARIANT_COLOR[variant] : ''}`}
                style={!variant ? { color: 'var(--text-primary)' } : undefined}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
