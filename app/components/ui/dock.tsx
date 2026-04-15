"use client";

import { ChevronDown } from 'lucide-react';
import React from 'react';

import { cn } from '@/src/lib/utils';

type DockTone =
  | 'neutral'
  | 'mint'
  | 'lime'
  | 'aqua'
  | 'sky'
  | 'lilac'
  | 'peach'
  | 'rose'
  | 'sun';

const dockToneClassName: Record<DockTone, string> = {
  neutral:
    'border border-white/80 bg-white/75 text-neutral-700 shadow-[0_1px_1px_rgba(15,23,42,0.04),0_8px_18px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:bg-white',
  mint:
    'border border-[color-mix(in_srgb,var(--a-mint)_40%,transparent)] bg-[color-mix(in_srgb,var(--a-mint)_20%,white)] text-[var(--n-800)] shadow-[0_1px_1px_rgba(15,23,42,0.04),0_8px_18px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--a-mint)_28%,white)]',
  lime:
    'border border-[color-mix(in_srgb,var(--a-lime)_40%,transparent)] bg-[color-mix(in_srgb,var(--a-lime)_20%,white)] text-[var(--n-800)] shadow-[0_1px_1px_rgba(15,23,42,0.04),0_8px_18px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--a-lime)_28%,white)]',
  aqua:
    'border border-[color-mix(in_srgb,var(--a-aqua)_40%,transparent)] bg-[color-mix(in_srgb,var(--a-aqua)_20%,white)] text-[var(--n-800)] shadow-[0_1px_1px_rgba(15,23,42,0.04),0_8px_18px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--a-aqua)_28%,white)]',
  sky:
    'border border-[color-mix(in_srgb,var(--a-sky)_40%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_18%,white)] text-[var(--n-800)] shadow-[0_1px_1px_rgba(15,23,42,0.04),0_8px_18px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--a-sky)_26%,white)]',
  lilac:
    'border border-[color-mix(in_srgb,var(--a-lilac)_40%,transparent)] bg-[color-mix(in_srgb,var(--a-lilac)_18%,white)] text-[var(--n-800)] shadow-[0_1px_1px_rgba(15,23,42,0.04),0_8px_18px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--a-lilac)_26%,white)]',
  peach:
    'border border-[color-mix(in_srgb,var(--a-peach)_40%,transparent)] bg-[color-mix(in_srgb,var(--a-peach)_18%,white)] text-[var(--n-800)] shadow-[0_1px_1px_rgba(15,23,42,0.04),0_8px_18px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--a-peach)_26%,white)]',
  rose:
    'border border-[color-mix(in_srgb,var(--a-rose)_40%,transparent)] bg-[color-mix(in_srgb,var(--a-rose)_18%,white)] text-[var(--n-800)] shadow-[0_1px_1px_rgba(15,23,42,0.04),0_8px_18px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--a-rose)_26%,white)]',
  sun:
    'border border-[color-mix(in_srgb,var(--a-sun)_42%,transparent)] bg-[color-mix(in_srgb,var(--a-sun)_20%,white)] text-[var(--n-800)] shadow-[0_1px_1px_rgba(15,23,42,0.04),0_8px_18px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--a-sun)_28%,white)]',
};

export interface DockProps {
  children: React.ReactNode;
  bottomOffset?: string;
  className?: string;
  position?: 'fixed' | 'inline';
  style?: React.CSSProperties;
}

export function Dock({
  children,
  bottomOffset = '60px',
  className,
  position = 'fixed',
  style,
}: DockProps) {
  const shell = (
    <div
      className={cn(
        'relative flex items-center justify-center gap-[3px] overflow-hidden rounded-[25px] border border-[#E0E0E0]',
        'bg-white/90 p-[3px] shadow-[0_18px_36px_rgba(15,23,42,0.12)] backdrop-blur-md',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );

  if (position === 'inline') {
    return <div className="flex w-full justify-center">{shell}</div>;
  }

  return (
    <nav
      className="fixed bottom-[60px] left-0 z-50 hidden w-full md:block"
      style={{ bottom: bottomOffset }}
    >
      <div className="flex justify-center px-4">{shell}</div>
    </nav>
  );
}

Dock.displayName = 'Dock';

export interface DockIconProps {
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  tone?: DockTone;
}

export function DockIcon({
  icon,
  href,
  onClick,
  className,
  ariaLabel,
  tone = 'neutral',
}: DockIconProps) {
  const sharedClassName = cn(
    'flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full transition-transform duration-200',
    dockToneClassName[tone],
    className
  );

  if (href) {
    return (
      <a
        href={href}
        aria-label={ariaLabel}
        className={sharedClassName}
      >
        <span className="inline-flex items-center justify-center">
          {icon}
        </span>
      </a>
    );
  }

  return (
    <button
      type="button"
      className={sharedClassName}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="inline-flex items-center justify-center">{icon}</span>
    </button>
  );
}

DockIcon.displayName = 'DockIcon';

export interface DockLinkProps {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  external?: boolean;
  onClick?: () => void;
  className?: string;
  tone?: DockTone;
}

export function DockLink({
  label,
  href,
  icon,
  external,
  onClick,
  className,
  tone = 'neutral',
}: DockLinkProps) {
  const baseClassName = cn(
    'flex h-[42px] items-center gap-1 rounded-full px-[18px] text-[14px] leading-[10px] transition-all duration-200',
    dockToneClassName[tone],
    className
  );

  const content = (
    <>
      {label}
      {icon && <span className="inline-flex">{icon}</span>}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={baseClassName}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={baseClassName}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

DockLink.displayName = 'DockLink';

export interface DockItemProps {
  children: React.ReactNode;
  label: string;
  className?: string;
}

export function DockItem({ children, label, className }: DockItemProps) {
  return (
    <div
      className={cn(
        'flex h-[42px] items-center gap-1 rounded-full border border-white/80 bg-white/70 px-[18px] text-[14px] leading-[10px] text-black shadow-[0_1px_1px_rgba(15,23,42,0.04),0_8px_18px_rgba(15,23,42,0.08)]',
        className
      )}
    >
      <span>{label}</span>
      <ChevronDown size={16} />
      <div className="sr-only">{children}</div>
    </div>
  );
}

DockItem.displayName = 'DockItem';

export interface DockDropdownItemProps {
  href?: string;
  label: string;
  image?: string;
  onClick?: () => void;
  className?: string;
}

export function DockDropdownItem({
  href,
  label,
  onClick,
  className,
}: DockDropdownItemProps) {
  const baseClassName = cn(
    'block text-left text-[14px] leading-[10px] text-neutral-500 transition-colors',
    className
  );

  if (href) {
    return (
      <a
        href={href}
        className={baseClassName}
      >
        {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={baseClassName}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

DockDropdownItem.displayName = 'DockDropdownItem';

export default Dock;
