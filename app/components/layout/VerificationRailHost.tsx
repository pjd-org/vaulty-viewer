import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../../src/store/ui';
import {
  useHomeSurface,
  type VerificationOutcome,
} from '../../lib/viewer-adapter';
import { VERIFICATION_OUTCOMES_KEY } from '../../hooks/use-mutation-with-verification';
import { cn } from '../../../src/lib/utils';

const STATUS_COLOR: Record<string, string> = {
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  failed: 'text-red-500',
  pending: 'text-sky-500',
};

const STATUS_BAR: Record<string, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-400',
  failed: 'bg-red-500',
  pending: 'bg-sky-400',
};

export function VerificationRailHost() {
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
    <div className="pointer-events-none fixed bottom-4 right-4 z-20 hidden max-w-xs xl:block">
      <div className="genie-surface genie-surface--overlay rounded-[22px] p-3 pointer-events-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Verification Rail
          </p>
          {activeOutcomes.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setDismissedIds(new Set(activeOutcomes.map((o) => o.id)))
              }
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Phase indicator — only when no outcomes yet */}
        {verification.phase === 'pending' && activeOutcomes.length === 0 && (
          <p className="text-sm text-sky-600">Verifying…</p>
        )}
        {verification.phase === 'failed' && activeOutcomes.length === 0 && (
          <p className="text-sm text-red-400">Verification failed.</p>
        )}

        {activeOutcomes.length > 0 && (
          <div className="space-y-2">
            {activeOutcomes.map((item, idx) => {
              const isLatest = idx === 0;
              const bar = STATUS_BAR[item.status] ?? 'bg-slate-300';
              return (
                <div
                  key={item.id}
                  className={cn(
                    'relative overflow-hidden rounded-[14px] border bg-black/5 p-3 space-y-1.5',
                    isLatest ? 'border-slate-300 shadow-sm' : 'border-slate-200'
                  )}
                >
                  {/* severity/status bar — left edge */}
                  <div
                    className={cn(
                      'absolute left-0 top-0 bottom-0 w-[3px]',
                      bar
                    )}
                    aria-hidden="true"
                  />

                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 pl-2">
                    <p
                      className={cn(
                        'text-sm font-medium text-slate-800 leading-snug flex-1 min-w-0',
                        isLatest && 'font-semibold'
                      )}
                    >
                      {item.summary}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={cn(
                          'text-[11px] font-semibold uppercase tracking-[0.18em]',
                          STATUS_COLOR[item.status] ?? 'text-slate-400'
                        )}
                      >
                        {item.status}
                      </span>
                      {/* Dismiss button */}
                      <button
                        type="button"
                        onClick={() => dismiss(item.id)}
                        className="size-4 flex items-center justify-center rounded-full text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        aria-label="Dismiss"
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
                      </button>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2 pl-2 text-[11px] text-slate-500">
                    {item.improved && (
                      <span className="text-emerald-600 font-medium">
                        ↑ Improved
                      </span>
                    )}
                    {item.followUpNeeded && (
                      <span className="text-amber-600 font-medium">
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

                  {/* Follow-up CTA */}
                  {item.followUpNeeded && (
                    <div className="pl-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          dismiss(item.id);
                          navigate({ to: '/inbox' });
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        Review in Inbox →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeOutcomes.length === 0 &&
          verification.phase !== 'pending' &&
          verification.phase !== 'failed' && (
            <p className="text-sm text-slate-400">
              Operational verification will surface here.
            </p>
          )}

        <p className="text-xs text-slate-600">
          {verification.pinned ? 'Pinned' : 'Ephemeral'}
          {verification.latestId ? ` · ${verification.latestId}` : ''}
        </p>
      </div>
    </div>
  );
}
