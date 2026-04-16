import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  tone?: 'default' | 'muted' | 'accent';
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
  tone = 'default',
}: SectionHeaderProps) {
  const titleColor =
    tone === 'accent'
      ? 'var(--a-sky)'
      : tone === 'muted'
        ? 'var(--text-tertiary)'
        : 'var(--text-secondary)';
  return (
    <div
      className={['flex items-center justify-between mb-4', className ?? '']
        .join(' ')
        .trim()}
    >
      <div>
        <h2
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: titleColor }}
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
