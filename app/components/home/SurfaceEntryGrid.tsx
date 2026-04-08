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
  /** Human-readable state line derived from count */
  stateLabel?: string;
  /** Next-step hint shown below the count */
  nextStep?: string;
}

interface SurfaceEntryGridProps {
  tiles: SurfaceEntryTile[];
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SurfaceEntryGrid({ tiles, loading }: SurfaceEntryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((tile) => (
        <Link
          key={tile.label}
          to={tile.to as never}
          className="group rounded-[18px] border border-slate-200 bg-black/3 p-4 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
          aria-label={`${tile.label} — ${tile.role}`}
        >
          {/* Domain label */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {tile.label}
          </p>

          {/* Live count */}
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-800">
            {loading ? '…' : tile.count > 0 ? tile.count : '—'}
          </p>

          {/* Role description */}
          <p className="mt-1 text-xs text-slate-500">{tile.role}</p>

          {/* Next-step hint — shown on hover or when non-zero */}
          {tile.nextStep && (
            <p className="mt-2 text-[11px] text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity leading-snug">
              {tile.nextStep} →
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
