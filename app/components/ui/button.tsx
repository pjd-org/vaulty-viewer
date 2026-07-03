import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium border transition-all duration-[var(--vault-duration-snappy)] ease-[var(--vault-easing-standard)] outline-none cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-primary to-primary-container text-white border-transparent rounded-pill hover:opacity-90",
        secondary:
          "bg-surface-container-low text-ink border-outline-variant rounded-sm hover:bg-surface-container-high",
        ghost:
          "bg-transparent text-ink border-transparent rounded-sm hover:bg-surface-container-low",
        danger:
          "bg-error text-white border-transparent rounded-sm hover:opacity-90 focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2",
        unstyled:
          "border-transparent bg-transparent rounded-none hover:bg-surface-container-low",
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary_shad:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost_shad:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2.5',
        icon: 'p-2 h-8 w-8',
        default: "h-10 px-4 py-2",
        sm_shad: "h-9 rounded-md px-3",
        lg_shad: "h-11 rounded-md px-8",
        icon_shad: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  unstyled?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      asChild = false,
      loading = false,
      unstyled = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // For unstyled mode, use minimal base classes + size (no variant styling)
    const canUseAsChild = asChild && !loading && React.isValidElement(children);
    const Comp = canUseAsChild ? Slot : "button";

    if (unstyled) {
      return (
        <Comp
          className={cn(
            "inline-flex items-center justify-center cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50",
            size === "sm" ? "px-3 py-1.5 text-xs" : size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm",
            className
          )}
          ref={ref}
          {...(canUseAsChild ? {} : { type: "button", disabled: isDisabled })}
          aria-disabled={isDisabled || undefined}
          {...props}
        >
          {loading ? (
            <svg
              className="animate-spin shrink-0"
              style={{
                width: size === "sm" ? 12 : size === "lg" ? 16 : 14,
                height: size === "sm" ? 12 : size === "lg" ? 16 : 14,
              }}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : canUseAsChild ? (
            children
          ) : (
            children
          )}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(canUseAsChild ? {} : { type: "button", disabled: isDisabled })}
        aria-disabled={isDisabled || undefined}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin shrink-0"
            style={{
              width: size === "sm" ? 12 : size === "lg" ? 16 : 14,
              height: size === "sm" ? 12 : size === "lg" ? 16 : 14,
            }}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : canUseAsChild ? (
          children
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
