import React from 'react';
import {
  type ReadinessState,
  type CapacityInput,
} from '../../../src/lib/readiness-logic';
import { apiBadgeText } from '../../../src/lib/avatar-logic';
import { ReadinessCard } from './ReadinessCard';

export interface ProfileData {
  name?: string;
  title?: string;
  archetype?: string;
  location?: string;
}

export interface FlagsData {
  stagnation?: boolean;
  entropyWarning?: boolean;
}

export interface ReadinessHeaderProps {
  profile: ProfileData;
  readiness: ReadinessState;
  flags: FlagsData;
  stale: boolean;
  updated?: string | null;
  loading: boolean;
  apiStatus: string;
  onRefresh: () => void;
  capacityLabel: string;
  timeBudgetLabel: string | null;
}

export function ReadinessHeader({
  profile,
  readiness,
  flags,
  stale,
  updated,
  loading,
  apiStatus,
  onRefresh,
  capacityLabel,
  timeBudgetLabel,
}: ReadinessHeaderProps) {
  const nameIsReal =
    profile.name && profile.name !== 'Unknown' && profile.name !== 'Vault User';
  const titleIsReal =
    profile.title &&
    profile.title !== 'Vault User' &&
    profile.title !== 'Unknown';

  const lastUpdatedStr = updated
    ? new Date(updated).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <header className="mb-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          {nameIsReal && (
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
              {profile.name}
            </h1>
          )}
          {titleIsReal && (
            <p className="mt-1 text-sm text-slate-500">{profile.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={[
              'rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]',
              apiStatus === 'online'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700',
            ].join(' ')}
          >
            {apiBadgeText(apiStatus as Parameters<typeof apiBadgeText>[0])}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh state"
            className="rounded-full border border-slate-200 bg-black/3 px-3 py-1 text-xs text-slate-600 transition hover:bg-black/5 disabled:opacity-40"
          >
            ↻
          </button>
        </div>
      </div>

      <ReadinessCard
        readiness={readiness}
        capacityLabel={capacityLabel}
        timeBudgetLabel={timeBudgetLabel}
      />

      <div className="flex flex-wrap gap-2">
        {flags.stagnation && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Stagnation detected
          </span>
        )}
        {flags.entropyWarning && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            High entropy
          </span>
        )}
        {stale && lastUpdatedStr && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
            State may be stale — {lastUpdatedStr}
          </span>
        )}
        {!stale && lastUpdatedStr && (
          <span className="text-xs text-slate-500">
            Updated {lastUpdatedStr}
          </span>
        )}
      </div>
    </header>
  );
}
