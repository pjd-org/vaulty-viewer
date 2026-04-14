import React from 'react';

export type ChipVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';

const variantClasses: Record<ChipVariant, string> = {
  default:
    'bg-[var(--surf-glass)] text-[var(--text-secondary)] border border-[var(--border-glass)] shadow-[0_4px_12px_rgba(15,23,42,0.04)]',
  primary:
    'bg-[linear-gradient(135deg,#11151d,#1c2230)] text-white border border-[var(--border-glass-soft)] shadow-[var(--shadow-card)]',
  success:
    'bg-[color-mix(in_srgb,var(--a-mint)_45%,transparent)] text-[var(--text-primary)] border border-[var(--border-glass)]',
  warning:
    'bg-[color-mix(in_srgb,var(--a-sun)_45%,transparent)] text-[var(--text-primary)] border border-[var(--border-glass)]',
  danger:
    'bg-[color-mix(in_srgb,var(--a-rose)_45%,transparent)] text-[var(--text-primary)] border border-[var(--border-glass)]',
};

export interface SoftChipProps {
  label: string;
  icon?: React.ReactNode;
  onRemove?: () => void;
  className?: string;
  variant?: ChipVariant;
}

export function SoftChip({
  label,
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
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="ml-0.5 rounded-full hover:opacity-70 transition-opacity"
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
