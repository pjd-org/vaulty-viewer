import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useUIStore } from '../../../src/store/ui';
import { cn } from '../../../src/lib/utils';

interface ModalHostProps {
  /** Slot map: modal id → content to render */
  modals?: Record<string, React.ReactNode>;
}

interface UIState {
  activeModal: string | null;
  closeModal: () => void;
}

/**
 * Portal-based modal host. Driven by UIStore.activeModal.
 *
 * Usage:
 *   const { openModal } = useUIStore()
 *   openModal('confirm-action')
 *
 * Then wire content via the `modals` prop on <ModalHost>.
 * For programmatic/ad-hoc modals, children are rendered directly
 * when activeModal === 'custom'.
 */
export function ModalHost({ modals = {} }: ModalHostProps) {
  const activeModal = useUIStore((s: UIState) => s.activeModal);
  const closeModal = useUIStore((s: UIState) => s.closeModal);

  const content = activeModal ? (modals[activeModal] ?? null) : null;

  return (
    <Dialog.Root
      open={activeModal !== null}
      onOpenChange={(v) => !v && closeModal()}
    >
      {content && (
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className={cn(
              'fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2',
              'w-full max-w-md rounded-[20px] border border-black/10 bg-white/90 p-6 shadow-2xl backdrop-blur-xl',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
              'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]'
            )}
          >
            {content}
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close modal"
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
