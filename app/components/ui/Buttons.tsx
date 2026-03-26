import React from 'react'

export interface ButtonBaseProps {
  onClick?: () => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export interface IconButtonProps extends Omit<ButtonBaseProps, 'children'> {
  icon: React.ReactNode
  label?: string
}

export function PrimaryButton({ onClick, disabled, className = '', children }: ButtonBaseProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-primary-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ onClick, disabled, className = '', children }: ButtonBaseProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`bg-neutral-100 text-neutral-700 rounded-xl px-4 py-2 text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}

export function IconButton({ onClick, disabled, className = '', icon, label }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {label && <span className="sr-only">{label}</span>}
      {icon}
    </button>
  )
}
