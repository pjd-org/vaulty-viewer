import React from 'react';
import { type ReadinessState } from '../../../src/lib/readiness-logic';
import { apiBadgeText, type ApiStatus } from '../../../src/lib/avatar-logic';
import { ReadinessCard } from './ReadinessCard';
import { SoftChip } from './Chips';
import { IconButton } from './Buttons';

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
  apiStatus: ApiStatus;
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
          <SoftChip
            variant={apiStatus === 'online' ? 'success' : 'danger'}
            label={apiBadgeText(apiStatus)}
          />
          <IconButton
            icon="↻"
            label="Refresh state"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh state"
          />
        </div>
      </div>

      <ReadinessCard
        readiness={readiness}
        capacityLabel={capacityLabel}
        timeBudgetLabel={timeBudgetLabel}
      />

      <div className="flex flex-wrap gap-2">
        {flags.stagnation && (
          <SoftChip variant="warning" label="Stagnation detected" />
        )}
        {flags.entropyWarning && (
          <SoftChip variant="danger" label="High entropy" />
        )}
        {stale && lastUpdatedStr && (
          <SoftChip
            variant="warning"
            label={`State may be stale — ${lastUpdatedStr}`}
          />
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
