import React from 'react';
import { Link } from '@tanstack/react-router';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SurfaceEntryTile {
  label: string;
  /** Role description — what this domain does in the system */
  role: string;
  /** Live count of items in this domain surface */
  count: number;
  /** Where to navigate when the tile is clicked */
  to: string;
  /** Optional route search payload, used to preserve reset semantics */
  search?: Record<string, unknown>;
  /** Human-readable state line derived from count */
  stateLabel?: string;
  /** Next-step hint shown below the count */
  nextStep?: string;
}

interface SurfaceEntryGridProps {
  tiles: SurfaceEntryTile[];
  loading?: boolean;
  /** Override the primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
  /** Number of columns used by the grid (default: 2). */
  columns?: 2 | 3;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SurfaceEntryGrid({
  tiles,
  loading,
  accentColor,
  columns = 2,
}: SurfaceEntryGridProps) {
  const accent = accentColor ?? 'var(--a-sky)';
  const columnsClass = columns === 3 ? 'grid-cols-3' : 'grid-cols-2';
  return (
    <div className={`grid ${columnsClass} gap-3`}>
      {tiles.map((tile) => (
        <Link
          key={tile.label}
          to={tile.to as never}
          search={tile.search as never}
          className="group rounded-[18px] border border-[var(--border-glass)] bg-[var(--surf-utility)] p-4 transition hover:-translate-y-0.5 hover:bg-[var(--surf-elevated)] focus-visible:outline-none"
          onFocus={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.boxShadow =
              `0 0 0 2px color-mix(in srgb,${accent} 70%,transparent)`;
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '';
          }}
          aria-label={`${tile.label} — ${tile.role}`}
        >
          {/* Domain label */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            {tile.label}
          </p>

          {/* Live count */}
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">
            {loading ? '…' : tile.count > 0 ? tile.count : '—'}
          </p>

          {/* Role description */}
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
            {tile.role}
          </p>

          {/* Next-step hint — shown on hover or when non-zero */}
          {tile.nextStep && (
            <p className="mt-2 text-[11px] text-[var(--text-info)] opacity-0 group-hover:opacity-100 transition-opacity leading-snug">
              {tile.nextStep} →
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
