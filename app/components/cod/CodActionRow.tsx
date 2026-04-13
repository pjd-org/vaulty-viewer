import React from 'react';
import { Link } from '@tanstack/react-router';
import { PrimaryButton, SecondaryButton } from '../ui';
import type { Recommendation } from '../../lib/viewer-adapter';

// ---------------------------------------------------------------------------
// V3: Recommendation card
// ---------------------------------------------------------------------------

const REVERSIBILITY_CHIP: Record<string, string> = {
  low: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-green-100 text-green-700',
};

function RecommendationCard({
  rec,
  onExecute,
  onSimulate,
  onDefer,
}: {
  rec: Recommendation;
  onExecute?: (id: string) => void;
  onSimulate?: (id: string) => void;
  onDefer?: (id: string) => void;
}) {
  const confidencePct = Math.max(
    1,
    Math.min(99, Math.round(rec.confidence * 100))
  );
  const revClass =
    REVERSIBILITY_CHIP[rec.reversibility] ?? 'bg-slate-100 text-slate-600';

  return (
    <article className="rounded-[18px] border border-slate-200 bg-white/70 p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-sm font-semibold text-slate-800 line-clamp-2">
          {rec.title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-700">
            {confidencePct}%
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${revClass}`}
          >
            {rec.reversibility}
          </span>
        </div>
      </div>
      {rec.whyNow && (
        <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
          {rec.whyNow}
        </p>
      )}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {onExecute && (
          <button
            type="button"
            onClick={() => onExecute(rec.id)}
            className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 hover:bg-sky-100"
          >
            Execute
          </button>
        )}
        {onSimulate && (
          <button
            type="button"
            onClick={() => onSimulate(rec.id)}
            className="rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 hover:bg-violet-100"
          >
            Simulate
          </button>
        )}
        {onDefer && (
          <button
            type="button"
            onClick={() => onDefer(rec.id)}
            className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 hover:bg-amber-100"
          >
            Defer
          </button>
        )}
        <Link
          to="/actions"
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 hover:bg-slate-50"
        >
          Inspect in Actions
        </Link>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// V1 legacy support
// ---------------------------------------------------------------------------

const PRIMARY_ACTIONS = new Set([
  'Start 25m sprint',
  'Start full session',
  'Plan 90m',
]);
const CHECKIN_ACTIONS = new Set(['Check in']);
const BROWSE_ACTIONS = new Set(['Browse safe tasks']);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CodActionRowProps {
  /** V3: Recommendation array */
  recommendations?: Recommendation[];
  /** V3 callbacks */
  onExecute?: (id: string) => void;
  onSimulate?: (id: string) => void;
  onDefer?: (id: string) => void;
  /** V1 legacy */
  actions?: string[];
  canWork?: boolean;
  maxSprintMin?: number;
  onCheckIn?: () => void;
}

export function CodActionRow({
  recommendations,
  onExecute,
  onSimulate,
  onDefer,
  actions,
  canWork,
  onCheckIn,
}: CodActionRowProps) {
  return (
    <div className="space-y-3">
      {/* V3: recommendation cards */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onExecute={onExecute}
              onSimulate={onSimulate}
              onDefer={onDefer}
            />
          ))}
        </div>
      )}

      {/* V1 legacy: action label buttons */}
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {actions.map((label) => {
            if (PRIMARY_ACTIONS.has(label)) {
              return (
                <PrimaryButton key={label} disabled={!canWork}>
                  {label}
                </PrimaryButton>
              );
            }
            if (CHECKIN_ACTIONS.has(label)) {
              return (
                <SecondaryButton key={label} onClick={onCheckIn}>
                  {label}
                </SecondaryButton>
              );
            }
            if (BROWSE_ACTIONS.has(label)) {
              return (
                <Link
                  key={label}
                  to="/"
                  className="text-primary hover:text-primary-2 underline-offset-2 hover:underline inline-block"
                >
                  {label}
                </Link>
              );
            }
            return <SecondaryButton key={label}>{label}</SecondaryButton>;
          })}
        </div>
      )}
    </div>
  );
}
