"use client";

import { createContext, useContext, useRef, useState } from "react";
import { useBeforeClose, useModal, useModals } from "react-easy-modals";
import { cn } from "@/src/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";

type ModalContextValue = {
  onAnimationEnd?: () => void;
};

const ModalContext = createContext<ModalContextValue>({});

const ModalClose = DialogClose;
const ModalDescription = DialogDescription;
const ModalFooter = DialogFooter;
const ModalHeader = DialogHeader;
const ModalOverlay = DialogOverlay;
const ModalPortal = DialogPortal;
const ModalTitle = DialogTitle;
const ModalTrigger = DialogTrigger;

type ModalContentProps = React.ComponentProps<typeof DialogContent>;

function ModalContent({
  children,
  className,
  onAnimationEnd,
  ...props
}: ModalContentProps) {
  const ctx = useContext(ModalContext);

  return (
    <DialogContent
      className={cn(className)}
      onAnimationEnd={(...e) => { onAnimationEnd?.(...e); ctx.onAnimationEnd?.() }}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

type ModalRootProps = {
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Dialog>, "open" | "onOpenChange">;

function Modal({ children, ...dialogProps }: ModalRootProps) {
  const modal = useModal();
  const modals = useModals();
  const [isVisible, setIsVisible] = useState(true);
  const canClose = useRef(false);
  const closableVariable = useRef<Parameters<typeof modal.close>[0]>(undefined);

  const currentModalIndex = modals.stack.findIndex((m) => m.id === modal.id);
  const isTopModal = modal.isNested || currentModalIndex === modals.stack.length - 1;
  const modalIsHidden = !modal.isNested && currentModalIndex !== -1 && !isTopModal;

  useBeforeClose<Parameters<typeof modal.close>[0]>((closeValue) => {
    closableVariable.current = closeValue;
    setIsVisible(false);
    return canClose.current;
  });

  function handleOpenChange(value: boolean) {
    if (!value && isTopModal) {
      setIsVisible(false);
    }
  }

  function handleAnimationEnd() {
    if (!isVisible) {
      canClose.current = true;
      modal.close(closableVariable.current);
      closableVariable.current = undefined;
    }
  }

  return (
    <ModalContext.Provider value={{ onAnimationEnd: handleAnimationEnd }}>
      <Dialog
        open={isVisible && !modalIsHidden}
        onOpenChange={handleOpenChange}
        {...dialogProps}
      >
        {children}
      </Dialog>
    </ModalContext.Provider>
  );
}

export {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
  ModalTrigger,
};
