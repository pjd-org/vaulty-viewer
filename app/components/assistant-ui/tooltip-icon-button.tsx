'use client';

import { ComponentPropsWithRef, forwardRef } from 'react';
import { Slot } from 'radix-ui';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/src/lib/utils';

export type TooltipIconButtonProps = ComponentPropsWithRef<typeof Button> & {
  tooltip: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
};

export const TooltipIconButton = forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(({ children, tooltip, side = 'bottom', className, ...rest }, ref) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
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
