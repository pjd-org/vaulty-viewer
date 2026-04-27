"use client"

import type * as React from "react"
import { cn } from "@/src/lib/utils"
import { GlassBadge as SharedGlassBadge } from '@vault/ui/atoms';

const variantToneMap = {
  default: 'neutral',
  primary: 'sky',
  success: 'mint',
  warning: 'sun',
  destructive: 'rose',
  outline: 'neutral',
} as const;

export interface GlassBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantToneMap;
  size?: 'sm' | 'md' | 'lg';
}

function GlassBadge({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: GlassBadgeProps) {
  const tone = variantToneMap[variant];
  const sizeClass = size === 'lg' ? 'px-4 py-2 text-base' : undefined;

  return (
    <SharedGlassBadge
      tone={tone}
      size={size === 'lg' ? 'md' : size}
      className={cn(sizeClass, className)}
      {...props}
    />
  )
}

const glassBadgeVariants = variantToneMap

export { GlassBadge, glassBadgeVariants }
