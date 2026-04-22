import React from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import useAvatar from '../../src/hooks/useAvatar';
import VitalsPanel from '../../src/components/VitalsPanel';
import {
  deriveReadiness,
  isMetricReal,
  formatTimeBudget,
  isStale,
  type CapacityInput,
  type VitalsInput,
} from '../../src/lib/readiness-logic';
import type { ApiStatus } from '../../src/lib/avatar-logic';
import {
  ReadinessHeader,
  CapacityGroup,
  ActionGuidancePanel,
  ExecutionStats,
  ProgressionSummary,
  type ProfileData,
  type FlagsData,
  type ProgressionData,
} from '../components/ui';

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
        <main className="route-modal-scroll route-modal-body flex flex-col gap-2">
          <nav className="mb-4">
            <Link
              to="/"
              search={{}}
              className="text-xs text-muted-foreground transition hover:text-foreground"
            >
              ← Focus
            </Link>
          </nav>

          {error && (
            <div
              className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
              <button
                type="button"
                onClick={refresh}
                className="ml-2 cursor-pointer underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
            apiStatus={apiStatus as ApiStatus}
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
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : (
            <>
              <section className="mb-5 flex flex-col gap-2">
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  Vitals
                </p>
                <VitalsPanel vitals={vitals} />
              </section>

              <CapacityGroup capacity={capacity} />

              <ActionGuidancePanel readiness={readiness} capacity={capacity} />

              <ExecutionStats vitals={vitals} />

              <details className="group mb-4">
                <summary className="cursor-pointer select-none text-[11px] font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground">
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
                <div className="border-t border-border pt-4">
                  <Link
                    to="/note"
                    search={{ p: 'notes/core/avatar/Avatar' }}
                    className="text-xs text-muted-foreground transition hover:text-foreground"
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
