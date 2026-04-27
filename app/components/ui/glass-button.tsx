'use client';

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { GlassButton as SharedGlassButton } from '@vault/ui/atoms';

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  glowEffect?: boolean;
  asChild?: boolean;
}

const variantToneMap = {
  default: 'neutral',
  primary: 'sky',
  outline: 'neutral',
  ghost: 'neutral',
  destructive: 'rose',
} as const;

const sizeMap = {
  default: 'md',
  sm: 'sm',
  lg: 'lg',
  icon: 'icon',
} as const;

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'default',
    glowEffect = false,
    asChild: _asChild,
    children,
    ...props
  }, ref) => {
    return (
      <SharedGlassButton
        ref={ref}
        tone={variantToneMap[variant]}
        size={sizeMap[size]}
        glow={glowEffect}
        className={cn(
          variant === 'primary' &&
            'bg-linear-to-r from-cyan-500/80 via-blue-500/80 to-purple-500/80 text-white',
          variant === 'outline' && 'bg-transparent',
          variant === 'ghost' && 'bg-transparent border-transparent',
          variant === 'destructive' && 'text-red-100',
          className
        )}
        {...props}
      >
        {children}
      </SharedGlassButton>
    );
  }
);
GlassButton.displayName = 'GlassButton';

const glassButtonVariants = variantToneMap;

export { GlassButton, glassButtonVariants };
