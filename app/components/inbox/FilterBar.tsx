import React from 'react';

type SortKey = 'newest' | 'oldest' | 'confidence' | 'itemCount';

export interface FilterBarProps {
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
  runType: string;
  onRunTypeChange: (v: string) => void;
  reversibility: string;
  onReversibilityChange: (v: string) => void;
  severity: string;
  onSeverityChange: (v: string) => void;
  loading: boolean;
  anyInFlight: boolean;
  onRefresh: () => void;
}

export function FilterBar({
  sort,
  onSortChange,
  runType,
  onRunTypeChange,
  reversibility,
  onReversibilityChange,
  severity,
  onSeverityChange,
  loading,
  anyInFlight,
  onRefresh,
}: FilterBarProps) {
  const selectCls =
    'rounded-full border border-[var(--border-default)] bg-[var(--surf-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--a-sky)_50%,transparent)] focus:ring-offset-1 transition-colors hover:border-[var(--border-default)]';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)] shrink-0">
        Sort
      </span>
      <select
        aria-label="Sort inbox items"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortKey)}
        className={selectCls}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="confidence">Confidence ↑</option>
        <option value="itemCount">Item count ↓</option>
      </select>

      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-tertiary)] shrink-0 ml-2">
        Filter
      </span>
      <select
        aria-label="Filter inbox by run type"
        value={runType}
        onChange={(e) => onRunTypeChange(e.target.value)}
        className={selectCls}
      >
        <option value="">Run type: All</option>
        <option value="signals_infer">Signals infer</option>
        <option value="conversation">Conversation</option>
        <option value="manual">Manual</option>
      </select>
      <select
        aria-label="Filter inbox by reversibility"
        value={reversibility}
        onChange={(e) => onReversibilityChange(e.target.value)}
        className={selectCls}
      >
        <option value="">Reversibility: All</option>
        <option value="high">Reversible</option>
        <option value="medium">Partial</option>
        <option value="low">Irreversible</option>
      </select>
      <select
        aria-label="Filter inbox by severity"
        value={severity}
        onChange={(e) => onSeverityChange(e.target.value)}
        className={selectCls}
      >
        <option value="">Severity: All</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <div className="ml-auto">
        <button
          type="button"
          className="rounded-full border border-[var(--border-default)] bg-[var(--surf-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surf-utility)] disabled:opacity-60 transition-colors"
          onClick={onRefresh}
          disabled={loading || anyInFlight}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}
