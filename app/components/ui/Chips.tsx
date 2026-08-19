import React from 'react';

export type ChipVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'sky'
  | 'violet'
  | 'indigo';

const variantClasses: Record<ChipVariant, string> = {
  default:
    'bg-[var(--surf-glass)] text-[var(--text-secondary)] border border-[var(--border-glass)] shadow-xs',
  primary:
    'bg-[linear-gradient(135deg,var(--n-950),var(--n-900))] text-[var(--n-0)] border border-[var(--border-glass-soft)] shadow-[var(--shadow-card)]',
  success:
    'bg-[color-mix(in_srgb,var(--a-mint)_45%,transparent)] text-slate-950 border border-[var(--border-glass)]',
  warning:
    'bg-[color-mix(in_srgb,var(--a-sun)_45%,transparent)] text-[var(--text-primary)] border border-[var(--border-glass)]',
  danger:
    'bg-[color-mix(in_srgb,var(--a-rose)_45%,transparent)] text-[var(--text-primary)] border border-[var(--border-glass)]',
  sky: '[background:color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))] [border-color:color-mix(in_srgb,var(--a-sky)_30%,transparent)] text-[var(--text-info)] border',
  violet:
    '[background:color-mix(in_srgb,var(--a-violet)_12%,var(--surf-elevated))] [border-color:color-mix(in_srgb,var(--a-violet)_30%,transparent)] [color:color-mix(in_srgb,var(--a-violet)_80%,var(--n-950))] border',
  indigo:
    '[background:color-mix(in_srgb,var(--color-primary)_12%,var(--surf-elevated))] [border-color:color-mix(in_srgb,var(--color-primary)_30%,transparent)] [color:color-mix(in_srgb,var(--color-primary)_80%,var(--n-950))] border',
};

export interface SoftChipProps {
  label?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  onRemove?: () => void;
  className?: string;
  variant?: ChipVariant;
}

export function SoftChip({
  label,
  children,
  icon,
  onRemove,
  className = '',
  variant = 'default',
}: SoftChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children ?? label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="ml-0.5 cursor-pointer rounded-full hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <svg
            className="w-3 h-3"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 3L3 9M3 3l6 6" />
          </svg>
        </button>
      )}
    </span>
  );
}

export type TaskStatus =
  | 'todo'
  | 'in-progress'
  | 'blocked'
  | 'done'
  | 'backlog';

const statusVariant: Record<TaskStatus, ChipVariant> = {
  todo: 'default',
  'in-progress': 'primary',
  blocked: 'danger',
  done: 'success',
  backlog: 'default',
};

const statusLabel: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
  backlog: 'Backlog',
};

export interface StatusPillProps {
  status: TaskStatus;
  className?: string;
}

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const variant = statusVariant[status];
  const mutedClass = status === 'backlog' ? 'opacity-70' : '';
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${variantClasses[variant]} ${mutedClass} ${className}`}
    >
      {statusLabel[status]}
    </span>
  );
}
