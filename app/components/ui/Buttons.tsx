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
      className={`bg-[#4f8cff] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#3d7de8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
      className={`bg-slate-100 text-slate-700 rounded-xl px-4 py-2 text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
      className={`p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {label && <span className="sr-only">{label}</span>}
      {icon}
    </button>
  )
}
