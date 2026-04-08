import React from 'react';
import { SidebarTrigger } from '@/app/components/ui/sidebar';

export function TopCommandBar() {
  return (
    <div className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="genie-surface genie-surface--overlay rounded-[24px] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile-only sidebar toggle — hidden on desktop where the rail is always visible */}
            <SidebarTrigger className="md:hidden shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Viewer V3
              </p>
              <p className="text-sm font-semibold text-slate-800">
                COD command center
              </p>
            </div>
          </div>

          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-slate-200 bg-black/5 px-4 py-2 lg:max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Search
            </span>
            <input
              aria-label="Search viewer"
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              placeholder="Find notes, projects, signals, and runs…"
              type="search"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
