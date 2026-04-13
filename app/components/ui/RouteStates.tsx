import React from 'react';

type RouteLoadingStateProps = {
  label?: string;
  rows?: number;
  className?: string;
};

export function RouteLoadingState({
  label = 'Loading live surface...',
  rows = 4,
  className = '',
}: RouteLoadingStateProps) {
  return (
    <div
      data-testid="route-loading-state"
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`space-y-3 ${className}`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          // index is stable enough for a static skeleton list
          key={`route-skeleton-${index}`}
          className="h-10 animate-pulse rounded-xl border border-slate-200/80 bg-black/3"
        />
      ))}
    </div>
  );
}

type RouteAsideEmptyStateProps = {
  title: string;
  description: string;
  testId?: string;
};

export function RouteAsideEmptyState({
  title,
  description,
  testId,
}: RouteAsideEmptyStateProps) {
  return (
    <div data-testid={testId} className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-600">{description}</p>
    </div>
  );
}
