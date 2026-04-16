import React from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '../../../src/lib/utils';

type SurfaceTone = 'neutral' | 'accent' | 'muted';

type ChipProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: SurfaceTone;
};

const chipToneClass: Record<SurfaceTone, string> = {
  neutral: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  accent:
    'border border-[color-mix(in_srgb,var(--a-sky)_35%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_14%,transparent)] text-[var(--a-sky)]',
  muted: 'border border-slate-200 bg-slate-100 text-slate-400',
};

const chipBaseClass =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]';

export function SurfaceChip({
  tone = 'neutral',
  className,
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(chipBaseClass, chipToneClass[tone], className)}
      {...props}
    />
  );
}

type SurfaceLinkChipProps = Omit<
  React.ComponentProps<typeof Link>,
  'search'
> & {
  tone?: SurfaceTone;
  className?: string;
  search?: any;
};

export function SurfaceLinkChip({
  tone = 'neutral',
  className,
  children,
  ...props
}: SurfaceLinkChipProps) {
  return (
    <Link
      className={cn(
        chipBaseClass,
        'transition-colors',
        chipToneClass[tone],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

type SurfaceButtonChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: SurfaceTone;
};

export function SurfaceButtonChip({
  tone = 'neutral',
  className,
  ...props
}: SurfaceButtonChipProps) {
  return (
    <button
      className={cn(
        chipBaseClass,
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        chipToneClass[tone],
        className
      )}
      {...props}
    />
  );
}

type MetricCardProps = React.HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
};

export function MetricCard({
  compact = false,
  className,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white/70 px-3 py-2 hover:bg-white/85',
        compact ? 'p-3' : 'p-4',
        className
      )}
      {...props}
    />
  );
}

type SurfaceSectionCardProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  subtitle?: string;
  tone?: SurfaceTone;
};

export function SurfaceSectionCard({
  title,
  subtitle,
  tone = 'muted',
  className,
  children,
  ...props
}: SurfaceSectionCardProps) {
  return (
    <div
      className={cn(
        'rounded-[18px] border p-4',
        chipToneClass[tone],
        className
      )}
      {...props}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {title}
      </p>
      {subtitle ? (
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      ) : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}
