import React from 'react';
import { useRouter } from '@tanstack/react-router';
import { SidebarTrigger } from '@/app/components/ui/sidebar';
import { useUIStore } from '../../../src/store/ui';

interface UIState {
  toggleCommandPalette: () => void;
  openModal: (id: string) => void;
}

interface TopCommandBarProps {
  /** Optional scope label — e.g. project or context name — shown as a chip */
  scopeEcho?: string;
}

export function TopCommandBar({ scopeEcho }: TopCommandBarProps) {
  const router = useRouter();
  const toggleCommandPalette = useUIStore(
    (s: UIState) => s.toggleCommandPalette
  );
  const openModal = useUIStore((s: UIState) => s.openModal);

  return (
    <div className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="genie-surface genie-surface--overlay rounded-[24px] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: sidebar toggle + title + optional scope echo */}
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger className="md:hidden shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Viewer V3
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800">
                  COD command center
                </p>
                {scopeEcho && (
                  <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
                    {scopeEcho}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center: search */}
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-slate-300/80 bg-white/85 px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] lg:max-w-xl">
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

          {/* Right: primary CTA cluster */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleCommandPalette()}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-200 transition-colors"
              title="Open command palette (⌘K)"
            >
              <span>⌘</span>
              <span>Quick Command</span>
            </button>
            <button
              type="button"
              onClick={() => router.navigate({ to: '/inbox' })}
              className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-200 hover:bg-sky-100 transition-colors"
            >
              Review Inbox
            </button>
            <button
              type="button"
              onClick={() => openModal('create')}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              + Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
