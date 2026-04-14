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
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="text-4xl" style={{ color: 'var(--text-tertiary)' }}>
          {icon}
        </div>
      )}
      <h2
        className="text-lg font-semibold mt-4"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
      {description && (
        <p
          className="text-sm mt-2 max-w-sm"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
