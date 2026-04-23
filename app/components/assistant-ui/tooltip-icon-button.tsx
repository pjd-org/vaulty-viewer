'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Slottable } from '@radix-ui/react-slot';

import { Tooltip, TooltipContent, TooltipTrigger } from '@vault/ui';
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
>(
  (
    {
      children,
      tooltip,
      side = 'bottom',
      className,
      variant: _variant,
      size: _size,
      ...rest
    },
    ref
  ) => {
    void _variant;
    void _size;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            unstyled
            {...rest}
            className={cn(
              'aui-button-icon size-8 rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-elevated)] p-1.5 text-[var(--text-secondary)] shadow-sm transition-colors hover:border-[var(--border-glass-default)] hover:bg-[var(--surf-elevated)] hover:text-[var(--text-primary)]',
              className
            )}
            ref={ref}
          >
            <Slottable>{children}</Slottable>
            <span className="aui-sr-only sr-only">{tooltip}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }
);

TooltipIconButton.displayName = 'TooltipIconButton';
