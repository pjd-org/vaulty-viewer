import React from 'react';
import {
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import { EmptyState } from '../components/ui';
import { bubbleSearchParams } from '../../src/lib/routes/search-params';
import {
  getBubbleSurfaceQueryOptions,
  useBubbleSurface,
  type BubbleSurfacePayload,
} from '../lib/viewer-adapter';
import { UnauthenticatedError } from '../../src/utils/api';
import { buildAuthTransitionPath } from '../../src/lib/auth-transition';
import { getAuthFailureKind } from '../hooks/use-login-redirect';

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
      ? 'bg-success'
      : score >= 4
        ? 'bg-warning'
        : 'bg-muted-foreground';
  return (
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
        className={`h-2 rounded-full ${color} transition-[width] duration-300`}
          style={{ width: `${pct}%` }}
          data-testid="momentum-bar"
          aria-label={`Momentum ${score}/10`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={score}
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
    <div className="flex items-start justify-between gap-2 border-b border-border py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-sm font-medium text-foreground">{value}</span>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function BubbleContent({ data }: { data: BubbleSurfacePayload }) {
  const { momentum, pressure, energy, rewards } = data;

  return (
    <div className="flex flex-col gap-5" data-testid="bubble-content">
      {/* Momentum */}
      <section data-testid="bubble-momentum" className="rounded-2xl border border-border bg-card/70 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Momentum
        </h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {momentum.label}
            </span>
            <span
              className="text-xs text-muted-foreground"
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
      <section data-testid="bubble-pressure" className="rounded-2xl border border-border bg-card/70 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pressure
        </h3>
        <div className="flex flex-col gap-1">
          <StatRow label="Level" value={pressure.label} />
          <StatRow label="Blocked tasks" value={pressure.blockedCount} />
          <StatRow label="Overdue" value={pressure.overdueCount} />
          <StatRow label="Stress" value={`${pressure.stressLevel}%`} />
        </div>
      </section>

      {/* Signals */}
      {data.signals.length > 0 && (
        <section data-testid="bubble-signals" className="rounded-2xl border border-border bg-card/70 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Signals
          </h3>
          <ul className="flex flex-col gap-1">
            {data.signals.map((signal) => {
              const badgeClass =
                signal.severity === 'high' || signal.severity === 'critical'
                  ? 'bg-destructive/10 text-destructive'
                  : signal.severity === 'medium'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-muted text-muted-foreground';
              return (
                <li
                  key={signal.id}
                  className="flex items-center justify-between gap-2 border-b border-border py-1.5 last:border-0"
                >
                  <span className="text-sm text-foreground">
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
    <div className="flex flex-col gap-5" data-testid="bubble-aside">
      {/* Energy */}
      <section data-testid="bubble-energy" className="rounded-2xl border border-border bg-card/70 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Energy
        </h3>
        <div className="flex flex-col gap-1">
          <StatRow label="Level" value={`${energy.level}%`} />
          <StatRow label="Stress" value={`${energy.stress}%`} />
          <StatRow label="Focus band" value={energy.focusBand} />
          <StatRow label="Sleep" value={`${energy.sleepHours}h`} />
          <StatRow label="Time budget" value={`${energy.timeBudgetMin}min`} />
        </div>
      </section>

      {/* Rewards */}
      <section data-testid="bubble-rewards" className="rounded-2xl border border-border bg-card/70 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Rewards
        </h3>
        <div className="flex flex-col gap-1">
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
  const location = useLocation();
  const { data, isLoading, error } = useBubbleSurface();
  const authFailureKind = getAuthFailureKind(error);

  React.useEffect(() => {
    if (error instanceof UnauthenticatedError) {
      void navigate({
        to: buildAuthTransitionPath(
          `${location.pathname}${location.search}`
        ),
      });
    }
  }, [error, location.pathname, location.search, navigate]);

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
          <div className="flex flex-col gap-3" data-testid="bubble-loading-state">
            <div className="h-16 animate-pulse rounded-2xl border border-border bg-muted/40" />
            <div className="h-20 animate-pulse rounded-2xl border border-border bg-muted/40" />
            <div className="h-16 animate-pulse rounded-2xl border border-border bg-muted/40" />
          </div>
        ) : authFailureKind === 'forbidden' ? (
          <EmptyState
            title="Bubble access forbidden"
            description="You are signed in, but this account cannot read the bubble surface."
          />
        ) : error && !data ? (
          <EmptyState
            title="Bubble data temporarily unavailable."
            description="The shell is intact. Retry once the runtime responds again."
          />
        ) : data == null ? (
          <div data-testid="bubble-empty-state" className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              No bubble data yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Adapter context is wired. Pressure, momentum, and reward surfaces
              will appear once the runtime connects.
            </p>
          </div>
        ) : (
          <BubbleContent data={data} />
        )
      }
    />
  );
}
