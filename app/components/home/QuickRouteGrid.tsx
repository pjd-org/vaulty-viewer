import React from 'react'
import { Link } from '@tanstack/react-router'

export function QuickRouteGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        to="/projects"
        className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-[#4f8cff]/30 hover:shadow-sm transition-all block"
      >
        <div className="text-xl mb-2">📁</div>
        <p className="text-sm font-semibold text-slate-900">Projects</p>
        <p className="text-xs text-slate-500 mt-0.5">Execution containers</p>
      </Link>

      <Link
        to="/inbox"
        search={{ view: undefined }}
        className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-[#4f8cff]/30 hover:shadow-sm transition-all block"
      >
        <div className="text-xl mb-2">📥</div>
        <p className="text-sm font-semibold text-slate-900">Inbox</p>
        <p className="text-xs text-slate-500 mt-0.5">Triage queue</p>
      </Link>

      <Link
        to="/huey"
        className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-[#4f8cff]/30 hover:shadow-sm transition-all block"
      >
        <div className="text-xl mb-2">🤖</div>
        <p className="text-sm font-semibold text-slate-900">Huey</p>
        <p className="text-xs text-slate-500 mt-0.5">Guided assistant</p>
      </Link>

      <Link
        to="/knowledge"
        className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-[#4f8cff]/30 hover:shadow-sm transition-all block"
      >
        <div className="text-xl mb-2">🔍</div>
        <p className="text-sm font-semibold text-slate-900">Knowledge</p>
        <p className="text-xs text-slate-500 mt-0.5">Browse &amp; discover</p>
      </Link>
    </div>
  )
}
