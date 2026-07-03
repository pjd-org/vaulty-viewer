import React from 'react';
import { Button as VaultButton } from './button';
import type { ButtonProps } from './button';

export interface ButtonBaseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export interface IconButtonProps extends Omit<ButtonBaseProps, 'children'> {
  icon: React.ReactNode;
  label?: string;
}

/**
 * PrimaryButton - wraps @vault/ui Button with primary variant + GENIE_CSS btn-primary class.
 * Uses Vault Button for accessibility, motion, and semantic correctness.
 * Adds btn-primary class for GENIE_CSS token compatibility with genie-card system.
 */
export function PrimaryButton({
  type = 'button',
  onClick,
  disabled,
  className = '',
  children,
  ...props
}: ButtonBaseProps) {
  return (
    <VaultButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant="primary"
      className={`btn-primary rounded-full ${className}`}
      {...props}
    >
      {children}
    </VaultButton>
  );
}

/**
 * SecondaryButton - wraps @vault/ui Button with secondary variant + GENIE_CSS btn-secondary class.
 * Uses Vault Button for accessibility, motion, and semantic correctness.
 * Adds btn-secondary class for GENIE_CSS token compatibility with genie-card system.
 */
export function SecondaryButton({
  type = 'button',
  onClick,
  disabled,
  className = '',
  children,
  ...props
}: ButtonBaseProps) {
  return (
    <VaultButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant="secondary"
      className={`btn-secondary rounded-full ${className}`}
      {...props}
    >
      {children}
    </VaultButton>
  );
}

/**
 * IconButton - wraps @vault/ui Button with icon size.
 * Uses Vault Button for accessibility, motion, and semantic correctness.
 * Adds glass styling for GENIE_CSS token compatibility with genie-card system.
 */
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
    <VaultButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      size="icon"
      aria-label={label}
      className={`w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border-glass)] bg-[var(--surf-glass)] backdrop-blur-md text-text2 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--n-0)_60%,transparent)] transition-all hover:bg-[var(--surf-elevated)] hover:shadow-sm ${className}`}
      {...props}
    >
      {label && <span className="sr-only">{label}</span>}
      <span className="w-4 h-4 flex items-center justify-center leading-none text-base">
        {icon}
      </span>
    </VaultButton>
  );
}
