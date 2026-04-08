import React from 'react';
import { cn } from '@/src/lib/utils';

interface SoftPanelProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: 'base' | 'elevated' | 'hero' | 'utility' | 'overlay';
  className?: string;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<
  NonNullable<SoftPanelProps['variant']>,
  string
> = {
  base: '',
  elevated: 'shadow-md',
  hero: 'shadow-lg',
  utility: 'bg-muted/40',
  overlay: 'bg-background/80 backdrop-blur',
};

export function SoftPanel({
  title,
  subtitle,
  actions,
  variant = 'base',
  className,
  children,
}: SoftPanelProps) {
  const hasHeader = title || subtitle || actions;

  return (
    <section
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        VARIANT_CLASSES[variant],
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
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={cn('p-6', hasHeader && 'pt-2')}>{children}</div>
    </section>
  );
}
