import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={['flex items-center justify-between mb-4', className ?? '']
        .join(' ')
        .trim()}
    >
      <div>
        <h2
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text-secondary)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
