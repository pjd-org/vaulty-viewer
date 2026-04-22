import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button, GlassSurface } from '@vault/ui';
import useAvatar from '../../../src/hooks/useAvatar';
import VitalsPanel from '../../../src/components/VitalsPanel';
import {
  deriveReadiness,
  isMetricReal,
  formatTimeBudget,
  isStale,
  type CapacityInput,
  type VitalsInput,
} from '../../../src/lib/readiness-logic';
import type { ApiStatus } from '../../../src/lib/avatar-logic';
import {
  ReadinessHeader,
  CapacityGroup,
  ActionGuidancePanel,
  ExecutionStats,
  ProgressionSummary,
  type ProfileData,
  type FlagsData,
  type ProgressionData,
} from '../ui';

export interface AvatarOverlayProps {
  onRequestClose?: () => void;
}

export function AvatarOverlay({ onRequestClose }: AvatarOverlayProps = {}) {
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
    <div
      className="fixed inset-0 z-[8500] flex items-start justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--vault-ink)_24%,transparent)] px-4 py-4 backdrop-blur-md sm:px-6 sm:py-6"
      onClick={closeOverlay}
    >
      <GlassSurface
        as="section"
        variant="overlay"
        radius="2xl"
        shadow="lg"
        className="relative w-full max-w-[760px] overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Avatar"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full border-transparent text-[var(--text-secondary)] hover:bg-[var(--surf-utility)] hover:text-[var(--text-primary)]"
          onClick={closeOverlay}
          aria-label="Close avatar"
        >
          ✕
        </Button>
        <main className="max-h-[calc(100dvh-2rem)] overflow-y-auto px-5 pb-5 pt-16 sm:px-6 sm:pb-6">
          <nav className="mb-4">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full px-3 text-xs text-[var(--text-secondary)]"
            >
              <Link to="/" search={{}}>
                ← Focus
              </Link>
            </Button>
          </nav>

          {error && (
            <GlassSurface
              as="div"
              variant="base"
              radius="lg"
              shadow="xs"
              border="default"
              className="mb-4 flex items-start gap-3 border-[color-mix(in_srgb,var(--a-rose)_24%,transparent)] bg-[color-mix(in_srgb,var(--a-rose)_12%,transparent)] px-4 py-3 text-sm text-[var(--text-danger)]"
              role="alert"
            >
              <p className="min-w-0 flex-1">{error}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={refresh}
                className="h-8 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-danger)]"
              >
                Retry
              </Button>
            </GlassSurface>
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
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-0 text-xs text-[var(--text-secondary)]"
                  >
                    <Link to="/note" search={{ p: 'notes/core/avatar/Avatar' }}>
                      Open avatar note →
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </GlassSurface>
    </div>
  );
}
