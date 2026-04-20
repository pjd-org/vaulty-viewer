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
  /** Override the primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

export function TopCommandBar({ scopeEcho, accentColor }: TopCommandBarProps) {
  const accent = accentColor ?? 'var(--a-sky)';
  const router = useRouter();
  const toggleCommandPalette = useUIStore(
    (s: UIState) => s.toggleCommandPalette
  );
  const openModal = useUIStore((s: UIState) => s.openModal);

  return (
    <div className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="genie-surface genie-surface--overlay rounded-[24px] px-4 py-3 ring-1 ring-[var(--border-glass)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: sidebar toggle + title + optional scope echo */}
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger className="md:hidden shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Viewer V3
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  COD command center
                </p>
                {scopeEcho && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-[var(--text-info)]"
                    style={{
                      background: `color-mix(in srgb, ${accent} 25%, transparent)`,
                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 35%, transparent)`,
                    }}
                  >
                    {scopeEcho}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center: search */}
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-[var(--border-glass)] bg-[var(--surf-glass)] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] lg:max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Search
            </span>
            <input
              aria-label="Search viewer"
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none"
              placeholder="Find notes, projects, signals, and runs…"
              type="search"
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 2px color-mix(in srgb, ${accent} 70%, transparent)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            />
          </label>

          {/* Right: primary CTA cluster */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleCommandPalette()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surf-utility)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--border-glass)] hover:bg-[var(--surf-elevated)] transition-colors"
              title="Open command palette (⌘K)"
            >
              <span>⌘</span>
              <span>Quick Command</span>
            </button>
            <button
              type="button"
              onClick={() => router.navigate({ to: '/inbox' })}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-info)] transition-colors"
              style={{
                background: `color-mix(in srgb, ${accent} 15%, transparent)`,
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 30%, transparent)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `color-mix(in srgb, ${accent} 25%, transparent)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `color-mix(in srgb, ${accent} 15%, transparent)`;
              }}
            >
              Review Inbox
            </button>
            <button
              type="button"
              onClick={() => openModal('create')}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--n-0)] hover:opacity-90 transition-colors shadow-sm"
            >
              + Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
