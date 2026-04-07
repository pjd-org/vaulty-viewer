import React from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import useAvatar from '../../src/hooks/useAvatar';
import VitalsPanel from '../../src/components/VitalsPanel';
import {
  deriveReadiness,
  deriveCapacityGuidance,
  formatTimeBudget,
  isMetricReal,
  isStale,
  type ReadinessState,
  type CapacityInput,
  type VitalsInput,
} from '../../src/lib/readiness-logic';
import { ReadinessCard } from '../components/avatar';
import { apiBadgeText } from '../../src/lib/avatar-logic';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfileData {
  name?: string;
  title?: string;
  archetype?: string;
  location?: string;
}

interface FlagsData {
  stagnation?: boolean;
  entropyWarning?: boolean;
}

interface ProgressionData {
  streakDays?: number;
  streakUpdated?: string;
}

// ---------------------------------------------------------------------------
// ReadinessHeader
// ---------------------------------------------------------------------------

function ReadinessHeader({
  profile,
  readiness,
  flags,
  stale,
  updated,
  loading,
  apiStatus,
  onRefresh,
  capacityLabel,
  timeBudgetLabel,
}: {
  profile: ProfileData;
  readiness: ReadinessState;
  flags: FlagsData;
  stale: boolean;
  updated?: string | null;
  loading: boolean;
  apiStatus: string;
  onRefresh: () => void;
  capacityLabel: string;
  timeBudgetLabel: string | null;
}) {
  const nameIsReal =
    profile.name && profile.name !== 'Unknown' && profile.name !== 'Vault User';
  const titleIsReal =
    profile.title &&
    profile.title !== 'Vault User' &&
    profile.title !== 'Unknown';

  const lastUpdatedStr = updated
    ? new Date(updated).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <header className="mb-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          {nameIsReal && (
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
              {profile.name}
            </h1>
          )}
          {titleIsReal && (
            <p className="mt-1 text-sm text-slate-500">{profile.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={[
              'rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]',
              apiStatus === 'online'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700',
            ].join(' ')}
          >
            {apiBadgeText(apiStatus as Parameters<typeof apiBadgeText>[0])}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh state"
            className="rounded-full border border-slate-200 bg-black/3 px-3 py-1 text-xs text-slate-600 transition hover:bg-black/5 disabled:opacity-40"
          >
            ↻
          </button>
        </div>
      </div>

      <ReadinessCard
        readiness={readiness}
        capacityLabel={capacityLabel}
        timeBudgetLabel={timeBudgetLabel}
      />

      <div className="flex flex-wrap gap-2">
        {flags.stagnation && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Stagnation detected
          </span>
        )}
        {flags.entropyWarning && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            High entropy
          </span>
        )}
        {stale && lastUpdatedStr && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
            State may be stale — {lastUpdatedStr}
          </span>
        )}
        {!stale && lastUpdatedStr && (
          <span className="text-xs text-slate-500">
            Updated {lastUpdatedStr}
          </span>
        )}
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// CapacityGroup
// ---------------------------------------------------------------------------

function CapacityGroup({ capacity }: { capacity: CapacityInput }) {
  const time = formatTimeBudget(capacity.timeBudgetMin);
  const guidance = deriveCapacityGuidance(capacity);
  const hasAny =
    isMetricReal(capacity.timeBudgetMin) ||
    isMetricReal(capacity.focusCostMax) ||
    isMetricReal(capacity.effortScoreMax);

  if (!hasAny && !guidance) return null;

  return (
    <section className="mb-5 space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
        Capacity
      </p>
      <div className="flex flex-wrap gap-2">
        {time && (
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700">
            {time} available
          </span>
        )}
        {isMetricReal(capacity.focusCostMax) && (
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-700">
            Focus ≤ {capacity.focusCostMax}
          </span>
        )}
        {isMetricReal(capacity.effortScoreMax) && (
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-700">
            Effort ≤ {capacity.effortScoreMax}
          </span>
        )}
      </div>
      {guidance && <p className="mt-1 text-xs text-slate-500">{guidance}</p>}
    </section>
  );
}

// ---------------------------------------------------------------------------
// ActionGuidancePanel
// ---------------------------------------------------------------------------

function ActionGuidancePanel({
  readiness,
  capacity,
}: {
  readiness: ReadinessState;
  capacity: CapacityInput;
}) {
  const focusParam = readiness.maxFocusCost;
  const effortParam = readiness.maxEffortScore;
  const budget = capacity.timeBudgetMin ?? 60;

  const tasksHref =
    focusParam !== undefined || effortParam !== undefined
      ? `/?maxFocusCost=${focusParam ?? ''}&maxEffort=${effortParam ?? ''}`
      : '/';

  return (
    <section className="mb-5 space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
        What to do now
      </p>
      <p className="text-sm text-slate-600">{readiness.description}</p>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/"
          search={{ session: '1' }}
          className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-200"
        >
          Start {readiness.sessionType} session
          {budget > 0 && ` (${formatTimeBudget(Math.min(budget, 90))})`}
        </Link>
        <Link
          to={tasksHref}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-black/5"
        >
          See matched tasks
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// ExecutionStats
// ---------------------------------------------------------------------------

function ExecutionStats({ vitals }: { vitals: Record<string, unknown> }) {
  const tasksToday = (vitals.tasksCompletedToday as number) ?? 0;
  const sessionsWeek = (vitals.sessionsCompletedThisWeek as number) ?? 0;

  if (tasksToday === 0 && sessionsWeek === 0) return null;

  return (
    <section className="mb-5 space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
        Today
      </p>
      <div className="flex gap-6">
        <div className="text-center">
          <span className="block text-2xl font-semibold tabular-nums text-slate-800">
            {tasksToday}
          </span>
          <span className="text-xs text-slate-500">tasks done</span>
        </div>
        <div className="text-center">
          <span className="block text-2xl font-semibold tabular-nums text-slate-800">
            {sessionsWeek}
          </span>
          <span className="text-xs text-slate-500">sessions this week</span>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// ProgressionSummary (tertiary)
// ---------------------------------------------------------------------------

function ProgressionSummary({
  level,
  currentXp,
  xpToNext,
  progression,
}: {
  level: number;
  currentXp: number;
  xpToNext: number;
  progression: ProgressionData;
}) {
  const streakDays = progression.streakDays ?? 0;
  const streakUpdated = progression.streakUpdated;
  const isStreakActive =
    streakUpdated &&
    (() => {
      const diff =
        (Date.now() - new Date(streakUpdated).getTime()) /
        (1000 * 60 * 60 * 24);
      return diff <= 1;
    })();

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {streakDays > 0 && (
        <span
          className={[
            'rounded-full px-3 py-1 text-xs',
            isStreakActive
              ? 'bg-amber-100 text-amber-700'
              : 'bg-black/5 text-slate-600',
          ].join(' ')}
        >
          {isStreakActive ? '🔥' : '○'} {streakDays}d streak
        </span>
      )}
      {level > 0 && (
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-slate-600">
          Level {level} · {currentXp.toLocaleString()} /{' '}
          {xpToNext.toLocaleString()} XP
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/avatar')({
  component: () => <AvatarRoute />,
});

interface AvatarRouteProps {
  onRequestClose?: () => void;
}

export function AvatarRoute({ onRequestClose }: AvatarRouteProps = {}) {
  const navigate = useNavigate();
  const {
    avatar,
    loading,
    error,
    refresh,
    level,
    currentXp,
    xpToNext,
    apiStatus,
  } = useAvatar();

  const vitals = (avatar.vitals ?? {}) as VitalsInput & Record<string, unknown>;
  const capacity = (avatar.capacity ?? {}) as CapacityInput;
  const progression = (avatar.progression ?? {}) as ProgressionData;
  const profile = (avatar.profile ?? {}) as ProfileData;
  const flags = (avatar.flags ?? {}) as FlagsData;

  const readiness = deriveReadiness(vitals, capacity);
  const stale = isStale(avatar.updated);
  const closeOverlay = React.useCallback(() => {
    if (onRequestClose) {
      onRequestClose();
      return;
    }

    void navigate({ to: '/', search: {} });
  }, [navigate, onRequestClose]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOverlay();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeOverlay]);

  return (
    <div className="route-modal-overlay" onClick={closeOverlay}>
      <section
        className="route-modal-card route-modal-card--avatar genie-surface genie-surface--overlay"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Avatar"
      >
        <button
          type="button"
          className="route-modal-close"
          onClick={closeOverlay}
          aria-label="Close avatar"
        >
          ✕
        </button>
        <main className="route-modal-scroll route-modal-body space-y-2">
          <nav className="mb-4">
            <Link
              to="/"
              search={{}}
              className="text-xs text-slate-500 transition hover:text-slate-700"
            >
              ← Focus
            </Link>
          </nav>

          {error && (
            <div
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
              <button
                type="button"
                onClick={refresh}
                className="ml-2 underline underline-offset-2 hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          <ReadinessHeader
            profile={profile}
            readiness={readiness}
            flags={flags}
            stale={stale}
            updated={avatar.updated}
            loading={loading}
            apiStatus={apiStatus}
            onRefresh={refresh}
            capacityLabel={(() => {
              const parts: string[] = [];
              if (isMetricReal(capacity.focusCostMax))
                parts.push(`Focus ≤ ${capacity.focusCostMax}`);
              if (isMetricReal(capacity.effortScoreMax))
                parts.push(`Effort ≤ ${capacity.effortScoreMax}`);
              return parts.join(' · ') || 'No capacity set';
            })()}
            timeBudgetLabel={formatTimeBudget(capacity.timeBudgetMin)}
          />

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
          ) : (
            <>
              <section className="mb-5 space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
                  Vitals
                </p>
                <VitalsPanel vitals={vitals} />
              </section>

              <CapacityGroup capacity={capacity} />

              <ActionGuidancePanel readiness={readiness} capacity={capacity} />

              <ExecutionStats vitals={vitals} />

              <details className="group mb-4">
                <summary className="cursor-pointer select-none text-[11px] font-medium uppercase tracking-widest text-slate-500 hover:text-slate-700">
                  Progression
                </summary>
                <div className="mt-2">
                  <ProgressionSummary
                    level={level}
                    currentXp={currentXp}
                    xpToNext={xpToNext}
                    progression={progression}
                  />
                </div>
              </details>

              {avatar.updated && (
                <div className="border-t border-slate-200 pt-4">
                  <Link
                    to="/note"
                    search={{ p: 'notes/core/avatar/Avatar' }}
                    className="text-xs text-slate-500 transition hover:text-slate-700"
                  >
                    Open avatar note →
                  </Link>
                </div>
              )}
            </>
          )}
        </main>
      </section>
    </div>
  );
}
