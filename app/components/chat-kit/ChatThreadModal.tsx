import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from '@/app/components/ui/dialog';
import { cn } from '@/src/lib/utils';
import { GlassSurface } from '@vault/ui';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay
          className={cn(
            'fixed inset-0 z-50 bg-[rgba(15,23,42,0.28)] backdrop-blur-[12px]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogContent
          aria-label={ariaLabel}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_24%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
            dialogClassName
          )}
        >
          <GlassSurface
            variant="overlay"
            radius="2xl"
            shadow="lg"
            border="default"
            className={cn(
              'relative flex h-[min(86vh,840px)] w-full max-w-[1320px] overflow-hidden',
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
          </GlassSurface>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
