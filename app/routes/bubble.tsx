import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import { EmptyState } from '../components/ui';
import { bubbleSearchParams } from '../../src/lib/routes/search-params';
import {
  getBubbleSurfaceQueryOptions,
  useBubbleSurface,
  type BubbleSurfacePayload,
} from '../lib/viewer-adapter';
import { UnauthenticatedError } from '../../src/utils/api';

export const Route = createFileRoute('/bubble')({
  validateSearch: bubbleSearchParams,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(getBubbleSurfaceQueryOptions());
  },
  component: BubbleRoute,
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MomentumBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100));
  const color =
    score >= 7
      ? 'bg-emerald-500'
      : score >= 4
        ? 'bg-amber-400'
        : 'bg-neutral-400';
  return (
    <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
      <div
        className={`h-2 rounded-full ${color} transition-all`}
        style={{ width: `${pct}%` }}
        data-testid="momentum-bar"
        aria-label={`Momentum ${score}/10`}
      />
    </div>
  );
}

function StatRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-neutral-100 last:border-0">
      <span className="text-xs text-neutral-500">{label}</span>
      <div className="text-right">
        <span className="text-sm font-medium text-neutral-800">{value}</span>
        {sub && <p className="text-xs text-neutral-400">{sub}</p>}
      </div>
    </div>
  );
}

function BubbleContent({ data }: { data: BubbleSurfacePayload }) {
  const { momentum, pressure, energy, rewards } = data;

  return (
    <div className="space-y-5" data-testid="bubble-content">
      {/* Momentum */}
      <section data-testid="bubble-momentum">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
          Momentum
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">
              {momentum.label}
            </span>
            <span
              className="text-xs text-neutral-400"
              data-testid="momentum-trend"
            >
              {momentum.trend === 'up'
                ? '↑'
                : momentum.trend === 'down'
                  ? '↓'
                  : '→'}
            </span>
          </div>
          <MomentumBar score={momentum.score} />
          <StatRow
            label="Streak"
            value={`${momentum.streakDays}d`}
            sub="consecutive days"
          />
          <StatRow
            label="Top task score"
            value={`${Math.round(momentum.topTaskScore * 100)}%`}
          />
        </div>
      </section>

      {/* Pressure */}
      <section data-testid="bubble-pressure">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
          Pressure
        </h3>
        <div className="space-y-1">
          <StatRow label="Level" value={pressure.label} />
          <StatRow label="Blocked tasks" value={pressure.blockedCount} />
          <StatRow label="Overdue" value={pressure.overdueCount} />
          <StatRow label="Stress" value={`${pressure.stressLevel}%`} />
        </div>
      </section>

      {/* Signals */}
      {data.signals.length > 0 && (
        <section data-testid="bubble-signals">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Signals
          </h3>
          <ul className="space-y-1">
            {data.signals.map((signal) => {
              const badgeClass =
                signal.severity === 'high' || signal.severity === 'critical'
                  ? 'bg-red-100 text-red-700'
                  : signal.severity === 'medium'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-neutral-100 text-neutral-500';
              return (
                <li
                  key={signal.id}
                  className="flex items-center justify-between gap-2 py-1.5 border-b border-neutral-100 last:border-0"
                >
                  <span className="text-sm text-neutral-800">
                    {signal.title}
                  </span>
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${badgeClass}`}
                  >
                    {signal.severity}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function BubbleAside({ data }: { data: BubbleSurfacePayload }) {
  const { energy, rewards } = data;

  return (
    <div className="space-y-5" data-testid="bubble-aside">
      {/* Energy */}
      <section data-testid="bubble-energy">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
          Energy
        </h3>
        <div className="space-y-1">
          <StatRow label="Level" value={`${energy.level}%`} />
          <StatRow label="Stress" value={`${energy.stress}%`} />
          <StatRow label="Focus band" value={energy.focusBand} />
          <StatRow label="Sleep" value={`${energy.sleepHours}h`} />
          <StatRow label="Time budget" value={`${energy.timeBudgetMin}min`} />
        </div>
      </section>

      {/* Rewards */}
      <section data-testid="bubble-rewards">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
          Rewards
        </h3>
        <div className="space-y-1">
          <StatRow label="Rank" value={rewards.rank} />
          <StatRow label="Level" value={rewards.level} />
          <StatRow label="XP" value={rewards.xp} />
          <StatRow label="Streak" value={`${rewards.streakDays}d`} />
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route component
// ---------------------------------------------------------------------------

function BubbleRoute() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useBubbleSurface();

  React.useEffect(() => {
    if (error instanceof UnauthenticatedError) {
      void navigate({ to: '/login' });
    }
  }, [error, navigate]);

  if (error instanceof UnauthenticatedError) return null;

  const summaryItems = data
    ? [
        {
          label: 'Momentum',
          value: data.momentum.label,
          detail: `Score ${data.momentum.score}/10`,
        },
        {
          label: 'Pressure',
          value: data.pressure.label,
          detail: `${data.pressure.blockedCount} blocked`,
        },
        {
          label: 'Energy',
          value: `${data.energy.level}%`,
          detail: data.energy.focusBand,
        },
        {
          label: 'XP',
          value: String(data.rewards.xp),
          detail: data.rewards.rank,
        },
      ]
    : [
        { label: 'Momentum', value: '—', detail: 'Loading…' },
        { label: 'Pressure', value: '—', detail: 'Loading…' },
        { label: 'Energy', value: '—', detail: 'Loading…' },
        { label: 'Rewards', value: '—', detail: 'Loading…' },
      ];

  return (
    <WorkspaceScaffold
      title="Bubble"
      subtitle="Behavioral control lane for pressure, drift, momentum, and rewards."
      summaryItems={summaryItems}
      primaryTitle="Bubble Workspace"
      primarySubtitle="Interpretation on the left, intervention on the right."
      primary={
        isLoading ? (
          <div className="space-y-3" data-testid="bubble-loading-state">
            <div className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-black/3" />
            <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-black/3" />
            <div className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-black/3" />
          </div>
        ) : error && !data ? (
          <EmptyState
            title="Bubble data temporarily unavailable."
            description="The shell is intact. Retry once the runtime responds again."
          />
        ) : data == null ? (
          <div data-testid="bubble-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No bubble data yet.
            </p>
            <p className="text-xs text-neutral-400">
              Adapter context is wired. Pressure, momentum, and reward surfaces
              will appear once the runtime connects.
            </p>
          </div>
        ) : (
          <BubbleContent data={data} />
        )
      }
      asideTitle="Intervention Panel"
      asideSubtitle="Energy and rewards at a glance."
      aside={
        data ? (
          <BubbleAside data={data} />
        ) : (
          <div data-testid="bubble-aside-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No item selected.
            </p>
            <p className="text-xs text-neutral-400">
              Energy, rewards, and behavioral context will appear here once the
              runtime connects.
            </p>
          </div>
        )
      }
    />
  );
}
