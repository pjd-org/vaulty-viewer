import React from 'react'
import { Link } from '@tanstack/react-router'

export function TopCommandBar() {
  return (
    <div className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="genie-surface genie-surface--overlay rounded-[24px] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Viewer V3
            </p>
            <p className="text-sm font-medium text-slate-100">
              COD command center
            </p>
          </div>

          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 lg:max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Search
            </span>
            <input
              aria-label="Search viewer"
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              placeholder="Find notes, projects, signals, and runs"
              type="search"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={'/actions' as never}
              className="btn-primary rounded-full px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              Quick Command
            </Link>
            <Link
              to={'/inbox' as never}
              className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-100"
            >
              Review Inbox
            </Link>
            <Link
              to={'/knowledge' as never}
              className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-100"
            >
              Create
            </Link>
            <Link
              to={'/huey' as never}
              className="btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-100"
            >
              Huey
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
