import * as DialogPrimitive from '@radix-ui/react-dialog';

import { cn } from '@/src/lib/utils';
import { ChatShell } from './ChatShell';
import type { ChatShellProps } from './ChatShell';

export interface ChatThreadModalProps extends ChatShellProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dialogClassName?: string;
  panelClassName?: string;
}

export function ChatThreadModal({
  open = true,
  onOpenChange,
  dialogClassName,
  panelClassName,
  className,
  ...shellProps
}: ChatThreadModalProps) {
  const ariaLabel =
    typeof shellProps.title === 'string'
      ? shellProps.title
      : 'Primary Agent thread';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-[rgba(15,23,42,0.28)] backdrop-blur-[12px]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          aria-label={ariaLabel}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_24%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
            dialogClassName
          )}
        >
          <div
            className={cn(
              'genie-surface genie-surface--overlay relative flex h-[min(86vh,840px)] w-full max-w-[1320px] overflow-hidden rounded-[36px]',
              'border border-[var(--border-glass)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,253,0.9))]',
              'shadow-[0_40px_120px_rgba(15,23,42,0.22)] backdrop-blur-xl',
              panelClassName
            )}
          >
            <ChatShell
              {...shellProps}
              className={cn(
                'h-full w-full rounded-none border-0 bg-transparent shadow-none',
                className
              )}
            />

          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
