import * as React from 'react';
import { cn } from '@/src/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowEffect?: boolean;
  variant?: 'dark' | 'light';
  children: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    { className, glowEffect = true, variant = 'dark', children, ...props },
    ref
  ) => {
    const isLight = variant === 'light';

    return (
      <div className="relative">
        {glowEffect && !isLight && (
          <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 blur-xl opacity-70" />
        )}
        <div
          ref={ref}
          className={cn(
            'relative rounded-2xl border',
            isLight
              ? 'border-[var(--border-glass-soft)] bg-[var(--surf-utility)] shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
              : 'border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]',
            'before:absolute before:inset-0 before:rounded-2xl',
            isLight
              ? 'before:bg-transparent'
              : 'before:bg-linear-to-b before:from-white/20 before:to-transparent before:pointer-events-none',
            'after:absolute after:inset-px after:rounded-[calc(1rem-1px)]',
            isLight
              ? 'after:shadow-none'
              : 'after:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] after:pointer-events-none',
            className
          )}
          {...props}
        >
          <div className="relative z-10">{children}</div>
        </div>
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1.5 p-6', className)}
    {...props}
  />
));
GlassCardHeader.displayName = 'GlassCardHeader';

const GlassCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
GlassCardTitle.displayName = 'GlassCardTitle';

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-[var(--text-secondary)]', className)}
    {...props}
  />
));
GlassCardDescription.displayName = 'GlassCardDescription';

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
GlassCardContent.displayName = 'GlassCardContent';

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
GlassCardFooter.displayName = 'GlassCardFooter';

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
};
