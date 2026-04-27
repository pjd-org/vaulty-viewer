import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50 px-5 py-10 text-center shadow-sm">
      {icon && (
        <div className="text-4xl" style={{ color: 'var(--text-tertiary)' }}>
          {icon}
        </div>
      )}
      <h2
        className="mt-4 text-lg font-semibold tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
      {description && (
        <p
          className="mt-2 max-w-md text-sm leading-6"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
