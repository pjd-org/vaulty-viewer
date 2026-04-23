import React from 'react';
import { Link } from '@tanstack/react-router';
import { PrimaryButton, SecondaryButton } from '../ui';
import type { Recommendation } from '../../lib/viewer-adapter';

export const codActionBtnClass =
  'cursor-pointer rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30';

export const codBadgeBaseClass =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold';

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
  const surfaceTone =
    rec.reversibility === 'low'
      ? 'danger'
      : rec.reversibility === 'medium'
        ? 'warning'
        : 'success';
  const confidencePct = Math.max(1, Math.min(99, Math.round(rec.confidence * 100)));
  const revStyle = REVERSIBILITY_STYLES[rec.reversibility] ?? {
    background: 'var(--n-100)',
    color: 'var(--text-secondary)',
  };

  return (
    <article className={`genie-card genie-card--${surfaceTone} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--text-primary)]">
          {rec.title}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={`${codBadgeBaseClass} tabular-nums`}
            style={{
              background: 'var(--n-100)',
              color: 'var(--text-secondary)',
            }}
          >
            {confidencePct}%
          </span>
          <span
            className={`${codBadgeBaseClass} uppercase tracking-[0.12em]`}
            style={revStyle}
          >
            {rec.reversibility}
          </span>
        </div>
      </div>
      {rec.whyNow && (
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          {rec.whyNow}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {onExecute && (
          <button
            type="button"
            onClick={() => onExecute(rec.id)}
            className={codActionBtnClass}
            style={{
              border: '1px solid color-mix(in srgb, var(--a-lilac) 50%, transparent)',
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
            className={codActionBtnClass}
            style={{
              border: '1px solid color-mix(in srgb, var(--a-sun) 50%, transparent)',
              background: 'color-mix(in srgb, var(--a-sun) 25%, transparent)',
              color: 'var(--text-primary)',
            }}
          >
            Defer
          </button>
        )}
        <Link
          to="/actions"
          search={{
            sort: undefined,
            simulatableOnly: undefined,
            selectedId: undefined,
          }}
          className={codActionBtnClass}
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

const PRIMARY_ACTIONS = new Set([
  'Start 25m sprint',
  'Start full session',
  'Plan 90m',
]);
const CHECKIN_ACTIONS = new Set(['Check in']);
const BROWSE_ACTIONS = new Set(['Browse safe tasks']);

interface CodActionRowProps {
  recommendations?: Recommendation[];
  onExecute?: (id: string) => void;
  onSimulate?: (id: string) => void;
  onDefer?: (id: string) => void;
  actions?: string[];
  canWork?: boolean;
  maxSprintMin?: number;
  onCheckIn?: () => void;
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
    <div className="flex flex-col gap-3">
      {recommendations && recommendations.length > 0 && (
        <div className="flex flex-col gap-3">
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

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
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
                  className="inline-flex items-center rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
                >
                  {label}
                </Link>
              );
            }
            return (
              <span
                key={label}
                className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
              >
                {label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
