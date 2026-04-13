import React from 'react';
import type { PressureSignal } from '../../lib/viewer-adapter';

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
// Severity badge
// ---------------------------------------------------------------------------

const SEVERITY_CLASSES: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

function SeverityBadge({ severity }: { severity: string }) {
  const cls = SEVERITY_CLASSES[severity] ?? 'bg-slate-100 text-slate-600';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${cls}`}
    >
      {severity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Signal card
// ---------------------------------------------------------------------------

function SignalCard({
  signal,
  onOpen,
  onAct,
}: {
  signal: PressureSignal;
  onOpen?: () => void;
  onAct?: () => void;
}) {
  return (
    <article className="rounded-[18px] border border-slate-200 bg-white/70 p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-sm font-semibold text-slate-800 line-clamp-2">
          {signal.title}
        </h3>
        <SeverityBadge severity={signal.severity} />
      </div>
      {signal.whySurfaced && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {signal.whySurfaced}
        </p>
      )}
      {/* Signal metadata */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {signal.sourceType && (
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-medium text-slate-600">Source type</span>
            <span>{signal.sourceType}</span>
          </span>
        )}
        {signal.confidence != null && (
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-medium text-slate-600">Confidence</span>
            <span>{Math.round(signal.confidence * 100)}%</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 pt-1">
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-50"
          >
            Open
          </button>
        )}
        {onAct && (
          <button
            type="button"
            onClick={onAct}
            className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 hover:bg-sky-100"
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
}

export function CodSignalRow({
  signals,
  onOpen,
  onAct,
  items,
}: CodSignalRowProps) {
  return (
    <div className="flex flex-col gap-3">
      {signals && signals.length > 0 && (
        <div className="space-y-3">
          {signals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onOpen={onOpen ? () => onOpen(signal) : undefined}
              onAct={onAct ? () => onAct(signal) : undefined}
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
              <span className="text-sm text-slate-600">{label}</span>
              <span
                className={`text-sm font-medium ${variant ? VARIANT_COLOR[variant] : 'text-slate-800'}`}
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
