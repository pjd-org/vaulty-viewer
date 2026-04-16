'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Slot } from 'radix-ui';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@vault/ui';
import { Button } from '@vault/ui';
import { cn } from '@/src/lib/utils';

export type TooltipIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tooltip: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  variant?: string;
  size?: string;
};

export const TooltipIconButton = forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(({
  children,
  tooltip,
  side = 'bottom',
  className,
  variant: _variant,
  size: _size,
  ...rest
}, ref) => {
  void _variant;
  void _size;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          unstyled
          {...rest}
          className={cn(
            'aui-button-icon size-8 rounded-full border border-[var(--border-glass-soft)] bg-[rgba(255,255,255,0.76)] p-1.5 text-[var(--text-secondary)] shadow-[0_8px_18px_rgba(17,21,29,0.08)] transition-colors hover:border-[var(--border-glass-default)] hover:bg-white hover:text-[var(--text-primary)]',
            className
          )}
          ref={ref}
        >
          <Slot.Slottable>{children}</Slot.Slottable>
          <span className="aui-sr-only sr-only">{tooltip}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
});

TooltipIconButton.displayName = 'TooltipIconButton';
