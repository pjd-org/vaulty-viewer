import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { GlassBadge, GlassSurface } from '@vault/ui';
import { Button } from '@/app/components/ui';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

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

    if (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined' &&
      document.referrer &&
      window.history.length > 1
    ) {
      try {
        const referrer = new URL(document.referrer);
        if (referrer.origin === window.location.origin) {
          window.history.back();
          return;
        }
      } catch {
        // Fall through to the home fallback.
      }
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
    <Dialog open onOpenChange={(open) => !open && closeOverlay()}>
      <DialogContent
        aria-label="Avatar"
        aria-modal="true"
        className="!max-w-[min(980px,calc(100vw-2rem))] !overflow-hidden !border !border-[var(--border-glass)] !bg-[var(--surf-overlay)] !p-0 !shadow-2xl"
      >
        <div className="max-h-[min(90vh,920px)] overflow-y-auto">
          <div className="border-b border-[var(--border-glass-soft)] px-6 py-5">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl">Avatar</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-[var(--text-primary)]">
                Readiness, vitals, and the working envelope for the current
                avatar state.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <GlassBadge tone="sky" size="md" className="justify-between px-3">
                <span className="uppercase tracking-[0.2em]">Readiness</span>
                <strong>{readiness.label}</strong>
              </GlassBadge>
              <GlassBadge tone="mint" size="md" className="justify-between px-3">
                <span className="uppercase tracking-[0.2em]">Energy</span>
                <strong>{Math.round(vitals.energy ?? 0)}%</strong>
              </GlassBadge>
              <GlassBadge tone="sun" size="md" className="justify-between px-3">
                <span className="uppercase tracking-[0.2em]">Stress</span>
                <strong>{Math.round(vitals.stress ?? 0)}%</strong>
              </GlassBadge>
              <GlassBadge tone="lilac" size="md" className="justify-between px-3">
                <span className="uppercase tracking-[0.2em]">Time</span>
                <strong>{formatTimeBudget(capacity.timeBudgetMin) || '—'}</strong>
              </GlassBadge>
            </div>
          </div>

          <div className="px-6 py-5 [--text-secondary:var(--text-primary)] [--text-tertiary:var(--text-primary)]">
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
                  <p className="text-[11px] font-medium uppercase tracking-widest text-foreground">
                    Vitals
                  </p>
                  <VitalsPanel vitals={vitals} />
                </section>

                <CapacityGroup capacity={capacity} />

                <ActionGuidancePanel readiness={readiness} capacity={capacity} />

                <ExecutionStats vitals={vitals} />

                <details className="group mb-4">
                  <summary className="cursor-pointer select-none text-[11px] font-medium uppercase tracking-widest text-foreground">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
