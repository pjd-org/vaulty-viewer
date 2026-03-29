import React from 'react'

export function VerificationRailHost() {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-20 hidden max-w-xs xl:block">
      <div className="genie-surface genie-surface--overlay rounded-[22px] p-3 pointer-events-auto">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Verification Rail
        </p>
        <p className="mt-2 text-sm text-slate-200">
          Operational verification will surface here as actions complete.
        </p>
      </div>
    </div>
  )
}
