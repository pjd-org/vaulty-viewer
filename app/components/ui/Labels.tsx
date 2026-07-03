import React from 'react';

export type MetricVariant = 'default' | 'success' | 'warning' | 'danger';

const metricValueColor: Record<MetricVariant, string> = {
  default: 'text-success',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

// For 'default' we use a CSS var inline style instead of a Tailwind class
const metricValueStyle: Record<MetricVariant, React.CSSProperties> = {
  default: { color: 'var(--text-primary)' },
  success: {},
  warning: {},
  danger: {},
};

export interface MetricLabelProps {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  variant?: MetricVariant;
}

export function MetricLabel({
  label,
  value,
  sublabel,
  variant = 'default',
}: MetricLabelProps) {
  return (
    <div className="inline-block">
      <div
        className={`text-2xl font-semibold ${variant !== 'default' ? metricValueColor[variant] : ''}`}
        style={metricValueStyle[variant]}
      >
        {value}
      </div>
      <div
        className="text-xs uppercase tracking-wide mt-0.5"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </div>
      {sublabel && (
        <div
          className="text-xs mt-0.5"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}

export interface MetaItem {
  icon?: React.ReactNode;
  label: string;
}

export interface MetaRowProps {
  items: MetaItem[];
  className?: string;
}

export function MetaRow({ items, className = '' }: MetaRowProps) {
  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      {items.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          {item.icon && <span className="shrink-0">{item.icon}</span>}
          {item.label}
        </span>
      ))}
    </div>
  );
}

export interface ReasonTextProps {
  children: React.ReactNode;
  className?: string;
}

export function ReasonText({ children, className = '' }: ReasonTextProps) {
  return (
    <p
      className={`text-sm italic leading-relaxed ${className}`}
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </p>
  );
}
