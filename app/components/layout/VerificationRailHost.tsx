import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button, GlassBadge, GlassSurface } from '@vault/ui';
import { useUIStore } from '../../../src/store/ui';
import {
  useHomeSurface,
  type VerificationOutcome,
} from '../../lib/viewer-adapter';
import { VERIFICATION_OUTCOMES_KEY } from '../../hooks/use-mutation-with-verification';
import { cn } from '../../../src/lib/utils';

const STATUS_BAR: Record<string, string> = {
  success: 'bg-[var(--a-mint)]',
  warning: 'bg-[var(--a-sun)]',
  failed: 'bg-[var(--a-rose)]',
  pending: 'bg-[var(--a-sky)]',
};

const STATUS_TONE: Record<string, 'mint' | 'sun' | 'rose' | 'sky'> = {
  success: 'mint',
  warning: 'sun',
  failed: 'rose',
  pending: 'sky',
};

export function VerificationRailHost({
  accentColor,
}: {
  accentColor?: string;
}) {
  const accent = accentColor ?? 'var(--a-sun)';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const verification = useUIStore((state) => state.verification);
  const { data: homeSurfaceData } = useHomeSurface();
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(
    () => new Set()
  );

  const cacheOutcomes =
    queryClient.getQueryData<VerificationOutcome[]>(
      VERIFICATION_OUTCOMES_KEY
    ) ?? [];

  const outcomes =
    cacheOutcomes.length > 0
      ? cacheOutcomes
      : (homeSurfaceData?.verificationRail ?? []);

  // Re-render when the query cache changes
  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === VERIFICATION_OUTCOMES_KEY[0]) {
        forceUpdate();
      }
    });
  }, [queryClient]);

  const visible =
    verification.visible || outcomes.some((o) => o.status !== 'pending');
  if (!visible) return null;

  const activeOutcomes = outcomes.filter((o) => !dismissedIds.has(o.id));
  if (
    activeOutcomes.length === 0 &&
    verification.phase === 'idle' &&
    !verification.visible
  )
    return null;

  const dismiss = (id: string) =>
    setDismissedIds((prev) => new Set([...prev, id]));

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-20 hidden w-[min(24rem,calc(100vw-2rem))] xl:block">
      <GlassSurface
        as="aside"
        variant="overlay"
        radius="2xl"
        shadow="lg"
        className="pointer-events-auto flex flex-col gap-4 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Verification Rail
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Operational checks and follow-ups
            </p>
          </div>
          {activeOutcomes.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setDismissedIds(new Set(activeOutcomes.map((o) => o.id)))
              }
              className="h-8 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]"
            >
              Clear all
            </Button>
          )}
        </div>

        {verification.phase === 'pending' && activeOutcomes.length === 0 && (
          <p className="text-sm text-[var(--text-info)]">Verifying…</p>
        )}
        {verification.phase === 'failed' && activeOutcomes.length === 0 && (
          <p className="text-sm text-[var(--text-danger)]">
            Verification failed.
          </p>
        )}

        {activeOutcomes.length > 0 && (
          <div className="flex flex-col gap-2">
            {activeOutcomes.map((item, idx) => {
              const isLatest = idx === 0;
              const bar =
                STATUS_BAR[item.status] ?? 'bg-[var(--border-default)]';
              const tone =
                STATUS_TONE[item.status] ?? ('neutral' as const);

              return (
                <GlassSurface
                  key={item.id}
                  as="article"
                  variant={isLatest ? 'elevated' : 'base'}
                  radius="xl"
                  shadow={isLatest ? 'sm' : 'xs'}
                  className="relative overflow-hidden p-3"
                >
                  <div
                    className={cn(
                      'absolute left-0 top-0 bottom-0 w-[3px]',
                      bar
                    )}
                    aria-hidden="true"
                  />

                  <div className="flex items-start justify-between gap-2 pl-2">
                    <p
                      className={cn(
                        'min-w-0 flex-1 text-sm leading-snug text-[var(--text-primary)]',
                        isLatest ? 'font-semibold' : 'font-medium'
                      )}
                    >
                      {item.summary}
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <GlassBadge
                        tone={tone}
                        dot
                        size="sm"
                        className="uppercase tracking-[0.18em]"
                      >
                        {item.status}
                      </GlassBadge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => dismiss(item.id)}
                        aria-label="Dismiss outcome"
                        className="h-7 w-7 rounded-full border-transparent text-[var(--text-tertiary)] hover:bg-[var(--surf-utility)] hover:text-[var(--text-primary)]"
                      >
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 8 8"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M1 1l6 6M7 1L1 7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pl-2 text-[11px] text-[var(--text-tertiary)]">
                    {item.improved && (
                      <span className="font-medium text-[var(--text-success)]">
                        ↑ Improved
                      </span>
                    )}
                    {item.followUpNeeded && (
                      <span className="font-medium text-[var(--text-warning)]">
                        Follow-up needed
                      </span>
                    )}
                    {item.resolvedAt && (
                      <span className="tabular-nums">
                        {new Date(item.resolvedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>

                  {item.followUpNeeded && (
                    <div className="pl-2 pt-0.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          dismiss(item.id);
                          navigate({ to: '/inbox' });
                        }}
                        className="rounded-full px-2.5 py-1 text-[11px] font-medium text-[var(--text-warning)]"
                        style={{
                          background: `color-mix(in srgb, ${accent} 14%, transparent)`,
                          borderColor: `color-mix(in srgb, ${accent} 26%, transparent)`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `color-mix(in srgb, ${accent} 22%, transparent)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `color-mix(in srgb, ${accent} 14%, transparent)`;
                        }}
                      >
                        Review in Inbox →
                      </Button>
                    </div>
                  )}
                </GlassSurface>
              );
            })}
          </div>
        )}

        {activeOutcomes.length === 0 &&
          verification.phase !== 'pending' &&
          verification.phase !== 'failed' && (
            <p className="text-sm text-[var(--text-tertiary)]">
              Operational verification will surface here.
            </p>
          )}

        <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
          <span>{verification.pinned ? 'Pinned' : 'Ephemeral'}</span>
          {verification.latestId ? (
            <GlassBadge tone="neutral" size="sm">
              {verification.latestId}
            </GlassBadge>
          ) : null}
        </div>
      </GlassSurface>
    </div>
  );
}
