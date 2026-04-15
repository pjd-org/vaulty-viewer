import type { ReactNode } from 'react';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/src/lib/utils';
import { PromptInput } from '@vault/ui';

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
  return (
    <div
      className={cn(
        'genie-surface genie-surface--overlay flex w-full flex-col gap-3 rounded-[32px] px-4 py-4',
        className
      )}
    >
      {attachments && <div className="flex flex-wrap gap-2">{attachments}</div>}

      <PromptInput
        value={value}
        placeholder={placeholder}
        loading={isRunning}
        disabled={isRunning}
        active={Boolean(value.trim()) || isRunning}
        leadingIcon="✦"
        onChange={(event) => onChange?.(event.target.value)}
        onSubmit={onSend}
        className="w-full"
        style={{ width: '100%' }}
      />

      {isRunning && onCancel && (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-4 text-sm text-[var(--text-secondary)] shadow-none hover:bg-white"
          >
            Stop generating
          </Button>
        </div>
      )}
    </div>
  );
}
