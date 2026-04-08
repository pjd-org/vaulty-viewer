import React from 'react';

export interface ButtonBaseProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface IconButtonProps extends Omit<ButtonBaseProps, 'children'> {
  icon: React.ReactNode;
  label?: string;
}

export function PrimaryButton({
  onClick,
  disabled,
  className = '',
  children,
}: ButtonBaseProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-primary rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  onClick,
  disabled,
  className = '',
  children,
}: ButtonBaseProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  onClick,
  disabled,
  className = '',
  icon,
  label,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`p-2 rounded-xl text-slate-500 hover:bg-black/5 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`}
    >
      {label && <span className="sr-only">{label}</span>}
      {icon}
    </button>
  );
}
