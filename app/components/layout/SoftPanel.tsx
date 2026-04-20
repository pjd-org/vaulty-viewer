import React from 'react';
import { cn } from '@/src/lib/utils';

interface SoftPanelProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: 'base' | 'elevated' | 'hero' | 'utility' | 'overlay';
  tone?: 'default' | 'muted' | 'accent';
  className?: string;
  /** When true, removes the default p-6 padding from the content wrapper. */
  noPadding?: boolean;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<
  NonNullable<SoftPanelProps['variant']>,
  string
> = {
  base: 'genie-surface',
  elevated: 'genie-surface genie-surface--elevated',
  hero: 'genie-surface genie-surface--hero',
  utility: 'genie-surface genie-surface--utility',
  overlay: 'genie-surface genie-surface--overlay',
};

export function SoftPanel({
  title,
  subtitle,
  actions,
  variant = 'base',
  tone = 'default',
  className,
  noPadding = false,
  children,
}: SoftPanelProps) {
  const hasHeader = title || subtitle || actions;
  const toneClass =
    tone === 'accent'
      ? 'border-[color-mix(in_srgb,var(--a-sky)_26%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_8%,transparent)]'
      : tone === 'muted'
        ? 'border-border bg-[var(--surf-utility)]'
        : '';

  return (
    <section
      className={cn(
        'rounded-[22px] border text-[var(--text-primary)] shadow-sm',
        VARIANT_CLASSES[variant],
        toneClass,
        className
      )}
    >
      {hasHeader && (
        <div className="flex flex-row items-start justify-between gap-4 p-6 pb-2">
          <div className="flex flex-col gap-1">
            {title && (
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div
        className={cn(!noPadding && 'p-6', hasHeader && !noPadding && 'pt-2')}
      >
        {children}
      </div>
    </section>
  );
}
