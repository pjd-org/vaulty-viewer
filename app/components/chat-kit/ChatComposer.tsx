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
        'genie-surface genie-surface--overlay flex w-full flex-col gap-3 rounded-[32px] px-4 py-4',
        className
      )}
    >
      {attachments && <div className="flex flex-wrap gap-2">{attachments}</div>}

      <div className="rounded-[24px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
        <Textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange?.(event.target.value)}
          className="min-h-24 resize-none border-0 bg-transparent px-0 py-0 text-sm leading-6 shadow-none outline-none focus-visible:ring-0"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        {isRunning ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-4 text-sm text-[var(--text-secondary)] shadow-none hover:bg-white"
          >
            Stop generating
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!canSend}
            onClick={onSend}
            className="rounded-full bg-[var(--n-900)] px-5 text-sm text-white shadow-[0_10px_24px_rgba(17,21,29,0.16)] hover:bg-[var(--n-800)]"
          >
            Send message
          </Button>
        )}
      </div>
    </div>
  );
}
