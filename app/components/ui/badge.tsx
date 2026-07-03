import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-surface-2 text-ink border border-subtle",
        secondary:
          "bg-surface-2 text-ink border border-subtle",
        accent:
          "bg-[var(--vault-accent)] text-white border-transparent",
        success:
          "bg-[var(--vault-status-pass)] text-white border-transparent",
        warning:
          "bg-[var(--vault-status-warn)] text-white border-transparent",
        danger:
          "bg-[var(--vault-status-fail)] text-white border-transparent",
        muted:
          "bg-surface-3 text-muted border border-faint",
        online:
          "bg-[var(--vault-status-online)] text-white border-transparent",
        offline:
          "bg-[var(--vault-status-offline)] text-white border-transparent",
        loading:
          "bg-[var(--vault-status-loading)] text-white border-transparent",
        unknown:
          "bg-surface-3 text-muted border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pill?: boolean;
  size?: 'sm' | 'md';
}

function Badge({
  className,
  variant,
  dot = false,
  pill = true,
  size = 'sm',
  children,
  ...props
}: BadgeProps) {
  const sizeClass =
    size === 'md' ? 'px-3 py-1 text-sm gap-1.5' : 'px-2.5 py-0.5 text-xs gap-1';

  const radiusClass = pill
    ? 'rounded-[var(--vault-radius-pill)]'
    : 'rounded-[var(--vault-radius-sm)]';

  const dotSizeClass = size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5';

  const dotClass =
    variant && ['online', 'offline', 'loading'].includes(variant)
      ? variant === 'loading'
        ? 'animate-pulse'
        : ''
      : null;

  return (
    <div
      className={cn(
        badgeVariants({ variant }),
        sizeClass,
        radiusClass,
        className
      )}
      {...props}
    >
      {dot && dotClass && (
        <span
          className={cn(
            'shrink-0 rounded-full bg-current',
            dotSizeClass,
            dotClass
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
