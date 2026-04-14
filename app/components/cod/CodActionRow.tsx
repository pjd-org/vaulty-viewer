import React from 'react';
import { Link } from '@tanstack/react-router';
import { PrimaryButton, SecondaryButton } from '../ui';
import type { Recommendation } from '../../lib/viewer-adapter';

// ---------------------------------------------------------------------------
// V3: Recommendation card
// ---------------------------------------------------------------------------

const REVERSIBILITY_STYLES: Record<string, React.CSSProperties> = {
  low: {
    background: 'color-mix(in srgb, var(--a-rose) 35%, transparent)',
    color: 'var(--text-primary)',
  },
  medium: {
    background: 'color-mix(in srgb, var(--a-sun) 45%, transparent)',
    color: 'var(--text-primary)',
  },
  high: {
    background: 'color-mix(in srgb, var(--a-mint) 35%, transparent)',
    color: 'var(--text-primary)',
  },
};

function RecommendationCard({
  rec,
  onExecute,
  onSimulate,
  onDefer,
  accentColor,
}: {
  rec: Recommendation;
  onExecute?: (id: string) => void;
  onSimulate?: (id: string) => void;
  onDefer?: (id: string) => void;
  accentColor?: string;
}) {
  const accent = accentColor ?? 'var(--a-mint)';
  const confidencePct = Math.max(
    1,
    Math.min(99, Math.round(rec.confidence * 100))
  );
  const revStyle = REVERSIBILITY_STYLES[rec.reversibility] ?? {
    background: 'var(--n-100)',
    color: 'var(--text-secondary)',
  };

  return (
    <article className="genie-card space-y-2">
      <div className="flex items-start justify-between gap-3">
        <h3
          className="min-w-0 flex-1 text-sm font-semibold line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {rec.title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums"
            style={{
              background: 'var(--n-100)',
              color: 'var(--text-secondary)',
            }}
          >
            {confidencePct}%
          </span>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={revStyle}
          >
            {rec.reversibility}
          </span>
        </div>
      </div>
      {rec.whyNow && (
        <p
          className="text-xs line-clamp-1 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {rec.whyNow}
        </p>
      )}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {onExecute && (
          <button
            type="button"
            onClick={() => onExecute(rec.id)}
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:opacity-80"
            style={{
              border: `1px solid color-mix(in srgb, ${accent} 50%, transparent)`,
              background: `color-mix(in srgb, ${accent} 20%, transparent)`,
              color: 'var(--text-primary)',
            }}
          >
            Execute
          </button>
        )}
        {onSimulate && (
          <button
            type="button"
            onClick={() => onSimulate(rec.id)}
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:opacity-80"
            style={{
              border:
                '1px solid color-mix(in srgb, var(--a-lilac) 50%, transparent)',
              background: 'color-mix(in srgb, var(--a-lilac) 20%, transparent)',
              color: 'var(--text-primary)',
            }}
          >
            Simulate
          </button>
        )}
        {onDefer && (
          <button
            type="button"
            onClick={() => onDefer(rec.id)}
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:opacity-80"
            style={{
              border:
                '1px solid color-mix(in srgb, var(--a-sun) 50%, transparent)',
              background: 'color-mix(in srgb, var(--a-sun) 25%, transparent)',
              color: 'var(--text-primary)',
            }}
          >
            Defer
          </button>
        )}
        <Link
          to="/actions"
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:opacity-80"
          style={{
            border: '1px solid var(--border-soft)',
            background: 'var(--surf-glass)',
            color: 'var(--text-secondary)',
          }}
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
  /** Override the Execute button's primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

export function CodActionRow({
  recommendations,
  onExecute,
  onSimulate,
  onDefer,
  actions,
  canWork,
  onCheckIn,
  accentColor,
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
              accentColor={accentColor}
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
