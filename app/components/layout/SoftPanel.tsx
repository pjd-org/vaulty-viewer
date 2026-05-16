import React from 'react';
import { cn } from '@/src/lib/utils';
import { GlassSurface } from '@vault/ui';

const variantToGlass: Record<
  NonNullable<SoftPanelProps['variant']>,
  'base' | 'elevated' | 'canvas' | 'overlay'
> = {
  base: 'base',
  elevated: 'elevated',
  hero: 'elevated',
  utility: 'canvas',
  overlay: 'overlay',
};

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
    <GlassSurface
      as="section"
      variant={variantToGlass[variant]}
      radius="lg"
      blur="lg"
      border="default"
      shadow="sm"
      className={cn(
        'text-[var(--text-primary)]',
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
    </GlassSurface>
  );
}
