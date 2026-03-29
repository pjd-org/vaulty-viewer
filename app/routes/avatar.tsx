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
import { ReadinessCard } from '../components/avatar'
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
    ? new Date(updated).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <header className="os-header">
      <div className="os-header__identity">
        {nameIsReal && <h1 className="os-header__name">{profile.name}</h1>}
        {titleIsReal && <p className="os-header__title">{profile.title}</p>}
      </div>

      <div className="os-header__readiness">
        <ReadinessCard readiness={readiness} capacityLabel={capacityLabel} timeBudgetLabel={timeBudgetLabel} />
        {flags.stagnation && (
          <span className="os-flag os-flag--warning">Stagnation detected</span>
        )}
        {flags.entropyWarning && (
          <span className="os-flag os-flag--danger">High entropy</span>
        )}
      </div>

      <div className="os-header__meta">
        {stale && lastUpdatedStr && (
          <span className="os-stale">
            State may be stale — {lastUpdatedStr}
          </span>
        )}
        {!stale && lastUpdatedStr && (
          <span className="os-updated">Updated {lastUpdatedStr}</span>
        )}
        <span className={`api-badge api-badge--${apiStatus}`}>
          {apiBadgeText(apiStatus as Parameters<typeof apiBadgeText>[0])}
        </span>
        <button
          className="os-refresh"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh state"
        >
          ↻
        </button>
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
    <section className="os-section">
      <p className="os-section__label">Capacity</p>
      <div className="capacity-chips">
        {time && (
          <span className="chip chip--capacity-time">{time} available</span>
        )}
        {isMetricReal(capacity.focusCostMax) && (
          <span className="chip chip--capacity-focus">
            Focus ≤ {capacity.focusCostMax}
          </span>
        )}
        {isMetricReal(capacity.effortScoreMax) && (
          <span className="chip chip--capacity-effort">
            Effort ≤ {capacity.effortScoreMax}
          </span>
        )}
      </div>
      {guidance && <p className="os-guidance">{guidance}</p>}
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
    <section className="os-section action-guidance">
      <p className="os-section__label">What to do now</p>
      <p className="action-guidance__text">{readiness.description}</p>
      <div className="action-guidance__ctas">
        <Link
          to="/"
          search={{ session: '1' }}
          className="na-card__btn na-card__btn--start"
        >
          Start {readiness.sessionType} session
          {budget > 0 && ` (${formatTimeBudget(Math.min(budget, 90))})`}
        </Link>
        <Link to={tasksHref} className="na-card__btn na-card__btn--done">
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
    <section className="os-section">
      <p className="os-section__label">Today</p>
      <div className="exec-stats">
        <div className="exec-stat">
          <span className="exec-stat__value">{tasksToday}</span>
          <span className="exec-stat__label">tasks done</span>
        </div>
        <div className="exec-stat">
          <span className="exec-stat__value">{sessionsWeek}</span>
          <span className="exec-stat__label">sessions this week</span>
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
    <div className="progression-summary">
      {streakDays > 0 && (
        <span className={`chip ${isStreakActive ? 'chip--score' : ''}`}>
          {isStreakActive ? '🔥' : '○'} {streakDays}d streak
        </span>
      )}
      {level > 0 && (
        <span className="chip chip--tag">
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
  onRequestClose?: () => void
}

export function AvatarRoute({ onRequestClose }: AvatarRouteProps = {}) {
  const navigate = useNavigate()
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
      onRequestClose()
      return
    }

    void navigate({ to: '/' })
  }, [navigate, onRequestClose])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOverlay()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeOverlay])

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
        <button type="button" className="route-modal-close" onClick={closeOverlay} aria-label="Close avatar">
          ✕
        </button>
        <main className="avatar-os-page route-modal-scroll route-modal-body">
          <nav className="breadcrumb">
            <Link to="/" className="back-link">
              ← Focus
            </Link>
          </nav>

          {error && (
            <div className="focus-offline">
              {error}
              <button
                onClick={refresh}
                className="os-refresh ml-2"
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
              const parts: string[] = []
              if (isMetricReal(capacity.focusCostMax)) parts.push(`Focus ≤ ${capacity.focusCostMax}`)
              if (isMetricReal(capacity.effortScoreMax)) parts.push(`Effort ≤ ${capacity.effortScoreMax}`)
              return parts.join(' · ') || 'No capacity set'
            })()}
            timeBudgetLabel={formatTimeBudget(capacity.timeBudgetMin)}
          />

          {loading ? (
            <div className="focus-loading">Loading…</div>
          ) : (
            <>
              <section className="os-section">
                <p className="os-section__label">Vitals</p>
                <VitalsPanel vitals={vitals} />
              </section>

              <CapacityGroup capacity={capacity} />

              <ActionGuidancePanel readiness={readiness} capacity={capacity} />

              <ExecutionStats vitals={vitals} />

              <details className="avatar-progression">
                <summary className="avatar-progression__summary">
                  Progression
                </summary>
                <ProgressionSummary
                  level={level}
                  currentXp={currentXp}
                  xpToNext={xpToNext}
                  progression={progression}
                />
              </details>

              {avatar.updated && (
                <div className="avatar-footer">
                  <a
                    href="/note/notes%2Fcore%2Favatar%2FAvatar"
                    className="avatar-link"
                  >
                    Open avatar note →
                  </a>
                </div>
              )}
            </>
          )}
        </main>
      </section>
    </div>
  );
}
