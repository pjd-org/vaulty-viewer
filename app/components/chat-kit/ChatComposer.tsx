import type { ReactNode } from 'react';
import { cn } from '@/src/lib/utils';
import { PromptInput } from '@vault/ui';
import { Dock, DockIcon, DockLink } from '@/app/components/ui';
import { ChatRuntimeStatus } from './ChatRuntimeStatus';
import type { ChatRuntimeStatusProps } from './ChatRuntimeStatus';
import { Paperclip, Sparkles, Square } from 'lucide-react';

const PALETTE_SWATCHES = [
  { name: 'mint', color: 'var(--a-mint)' },
  { name: 'lime', color: 'var(--a-lime)' },
  { name: 'aqua', color: 'var(--a-aqua)' },
  { name: 'sky', color: 'var(--a-sky)' },
  { name: 'lilac', color: 'var(--a-lilac)' },
  { name: 'peach', color: 'var(--a-peach)' },
  { name: 'rose', color: 'var(--a-rose)' },
  { name: 'sun', color: 'var(--a-sun)' },
] as const;

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
  runtimeState?: ChatRuntimeStatusProps['state'];
  runtimeDetail?: string;
  className?: string;
}

function ChatPaletteLegend() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PALETTE_SWATCHES.map((swatch) => (
        <span
          key={swatch.name}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-glass-soft)] bg-[rgba(255,255,255,0.8)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)] shadow-[0_4px_14px_rgba(17,21,29,0.06)]"
        >
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.65)]"
            style={{ background: swatch.color }}
          />
          {swatch.name}
        </span>
      ))}
    </div>
  );
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
  runtimeState,
  runtimeDetail,
  className,
}: ChatComposerProps) {
  const canShowToolDock = Boolean(onToolSelect);
  const statusState = runtimeState ?? (isRunning ? 'running' : 'idle');
  const statusDetail =
    runtimeDetail ??
    (statusState === 'running'
      ? 'Generating response'
      : statusState === 'degraded'
        ? 'Tool fallback active'
        : statusState === 'error'
          ? 'Attention needed'
          : 'No active thread');

  return (
    <Dock
      position="inline"
      className={cn(
        'genie-surface genie-surface--overlay flex w-full flex-col items-stretch gap-2 rounded-[32px] px-3 py-3',
        className
      )}
    >
      {attachments && <div className="flex flex-wrap gap-2">{attachments}</div>}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChatRuntimeStatus state={statusState} detail={statusDetail} />
        <ChatPaletteLegend />
      </div>

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
              tone="sky"
            />
          )}

          {canShowToolDock && (
            <>
              <DockLink
                label="Plan"
                onClick={() => onToolSelect?.('show_plan')}
                icon={<Sparkles className="size-3.5" />}
                tone="mint"
              />

              <DockLink
                label="Track"
                onClick={() => onToolSelect?.('show_progress')}
                tone="aqua"
              />

              <DockLink
                label="Approval"
                onClick={() => onToolSelect?.('approval-card')}
                tone="rose"
              />

              <DockLink
                label="Draft"
                onClick={() => onToolSelect?.('message-draft')}
                tone="lilac"
              />
            </>
          )}
        </div>

        {isRunning && onCancel && (
          <DockLink
            label="Stop"
            onClick={onCancel}
            icon={<Square className="size-3 fill-current" />}
            tone="sun"
          />
        )}
      </div>
    </Dock>
  );
}
