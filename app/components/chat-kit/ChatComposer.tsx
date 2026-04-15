import type { ReactNode } from 'react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { cn } from '@/src/lib/utils';

export interface ChatComposerProps {
  value: string;
  placeholder?: string;
  isRunning?: boolean;
  attachments?: ReactNode;
  onChange?: (value: string) => void;
  onSend?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ChatComposer({
  value,
  placeholder = 'Send a message...',
  isRunning = false,
  attachments,
  onChange,
  onSend,
  onCancel,
  className,
}: ChatComposerProps) {
  const canSend = value.trim().length > 0 && !isRunning;

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-2 rounded-3xl border border-[var(--border-glass)] bg-[var(--surf-glass)] p-3 shadow-[0_12px_24px_rgba(17,21,29,0.08)]',
        className
      )}
    >
      {attachments && <div className="flex flex-wrap gap-2">{attachments}</div>}

      <Textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className="min-h-24 resize-none border-0 bg-transparent px-1 py-1 text-sm shadow-none outline-none focus-visible:ring-0"
      />

      <div className="flex items-center justify-end gap-2">
        {isRunning ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Stop generating
          </Button>
        ) : (
          <Button type="button" disabled={!canSend} onClick={onSend}>
            Send message
          </Button>
        )}
      </div>
    </div>
  );
}
