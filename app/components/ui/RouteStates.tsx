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
      <p
        className="text-xs font-medium uppercase tracking-[0.14em]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </p>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          // index is stable enough for a static skeleton list
          key={`route-skeleton-${index}`}
          className="h-10 animate-pulse rounded-[var(--radius-card)]"
          style={{
            border: '1px solid var(--border-soft)',
            background: 'var(--n-100)',
          }}
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
      <p
        className="text-sm font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </p>
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
    </div>
  );
}
