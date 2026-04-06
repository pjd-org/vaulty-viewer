import React from 'react';
import { useUIStore } from '../../../src/store/ui';
import { useHomeSurface } from '../../lib/viewer-adapter';

const STATUS_COLOR: Record<string, string> = {
  success: 'text-emerald-300',
  warning: 'text-amber-300',
  failed: 'text-red-400',
  pending: 'text-sky-300',
};

export function VerificationRailHost() {
  const verification = useUIStore((state) => state.verification);
  const { data: surface } = useHomeSurface();

  if (!verification.visible) return null;

  const outcomes = surface?.verificationRail ?? [];

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-20 hidden max-w-xs xl:block">
      <div className="genie-surface genie-surface--overlay rounded-[22px] p-3 pointer-events-auto space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Verification Rail
        </p>

        {verification.phase === 'pending' && (
          <p className="text-sm text-sky-300">Verifying…</p>
        )}
        {verification.phase === 'failed' && (
          <p className="text-sm text-red-400">Verification failed.</p>
        )}

        {outcomes.length > 0 ? (
          <div className="space-y-2">
            {outcomes.map((item) => (
              <div
                key={item.id}
                className="rounded-[14px] border border-white/8 bg-white/5 p-3 space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-100 leading-snug">
                    {item.summary}
                  </p>
                  <span
                    className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] ${STATUS_COLOR[item.status] ?? 'text-slate-400'}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  {item.improved && <span>Improved</span>}
                  {item.followUpNeeded && <span>Follow-up needed</span>}
                  {item.resolvedAt && <span>{item.resolvedAt}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          verification.phase !== 'pending' && (
            <p className="text-sm text-slate-400">
              Operational verification will surface here.
            </p>
          )
        )}

        <p className="text-xs text-slate-600">
          {verification.pinned ? 'Pinned' : 'Ephemeral'}
          {verification.latestId ? ` · ${verification.latestId}` : ''}
        </p>
      </div>
    </div>
  );
}
