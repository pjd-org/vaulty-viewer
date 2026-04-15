import type { ReactNode } from 'react';
import { cn } from '@/src/lib/utils';
import { PromptInput } from '@vault/ui';
import { Dock, DockIcon, DockLink } from '@/app/components/ui';
import { Paperclip, Sparkles, Square } from 'lucide-react';

export interface ChatComposerProps {
  value: string;
  placeholder?: string;
  isRunning?: boolean;
  attachments?: ReactNode;
  onChange?: (value: string) => void;
  onSend?: () => void;
  onCancel?: () => void;
  onAttach?: () => void;
  onToolSelect?: (tool: string) => void;
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
  onAttach,
  onToolSelect,
  className,
}: ChatComposerProps) {
  const canShowToolDock = Boolean(onToolSelect);

  return (
    <Dock
      position="inline"
      className={cn(
        'genie-surface genie-surface--overlay flex w-full flex-col items-stretch gap-2 rounded-[32px] px-3 py-3',
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
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          padding: '0 12px',
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {onAttach && (
            <DockIcon
              icon={<Paperclip className="size-4" />}
              onClick={onAttach}
              ariaLabel="Attach file"
            />
          )}

          {canShowToolDock && (
            <>
              <DockLink
                label="Plan"
                onClick={() => onToolSelect?.('show_plan')}
                icon={<Sparkles className="size-3.5" />}
              />

              <DockLink
                label="Track"
                onClick={() => onToolSelect?.('show_progress')}
              />

              <DockLink
                label="Approval"
                onClick={() => onToolSelect?.('approval-card')}
              />

              <DockLink
                label="Draft"
                onClick={() => onToolSelect?.('message-draft')}
              />
            </>
          )}
        </div>

        {isRunning && onCancel && (
          <DockLink
            label="Stop"
            onClick={onCancel}
            icon={<Square className="size-3 fill-current" />}
          />
        )}
      </div>
    </Dock>
  );
}
