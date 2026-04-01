import React from 'react';
import { useUIStore } from '../../../src/store/ui';

export function VerificationRailHost() {
  const verification = useUIStore((state) => state.verification);

  if (!verification.visible) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-20 hidden max-w-xs xl:block">
      <div className="genie-surface genie-surface--overlay rounded-[22px] p-3 pointer-events-auto">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Verification Rail
        </p>
        <p className="mt-2 text-sm text-slate-200">
          {verification.phase === 'pending'
            ? 'Verification is in progress.'
            : verification.phase === 'resolved'
              ? 'Verification resolved.'
              : verification.phase === 'failed'
                ? 'Verification failed.'
                : 'Operational verification will surface here as actions complete.'}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {verification.pinned ? 'Pinned' : 'Ephemeral'}
          {verification.latestId ? ` · ${verification.latestId}` : ''}
        </p>
      </div>
    </div>
  );
}
