import React from 'react';

export interface ButtonBaseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export interface IconButtonProps extends Omit<ButtonBaseProps, 'children'> {
  icon: React.ReactNode;
  label?: string;
}

export function PrimaryButton({
  type = 'button',
  onClick,
  disabled,
  className = '',
  children,
  ...props
}: ButtonBaseProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-primary rounded-full px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--a-mint)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  type = 'button',
  onClick,
  disabled,
  className = '',
  children,
  ...props
}: ButtonBaseProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-secondary rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--a-mint)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`}
      style={{ color: 'var(--text-secondary)' }}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  type = 'button',
  onClick,
  disabled,
  className = '',
  icon,
  label,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border-glass)] bg-[var(--surf-glass)] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all hover:bg-[var(--surf-elevated)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_8px_rgba(15,23,42,0.08)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--a-mint)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`}
      style={{ color: 'var(--text-secondary)' }}
      {...props}
    >
      {label && <span className="sr-only">{label}</span>}
      <span className="w-4 h-4 flex items-center justify-center leading-none text-base">
        {icon}
      </span>
    </button>
  );
}
