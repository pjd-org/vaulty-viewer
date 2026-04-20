import type { ReactNode } from 'react';
import type { CSSProperties } from 'react';
import { cn } from '@/src/lib/utils';
import { Dock, DockIcon, DockLink, PromptInput } from '@vault/ui';
import { ChatRuntimeStatus, chatStatusPillClass } from './ChatRuntimeStatus';
import {
  CHAT_ACCENTS,
  CHAT_ACCENT_TOKENS,
  CHAT_RUNTIME_STATE_ACCENTS,
  type ChatAccentColor,
  type ChatRuntimeState,
} from './accent';
import { Paperclip, Sparkles, Square } from 'lucide-react';

type ComposerStyle = CSSProperties & {
  '--composer-accent'?: string;
};

const PALETTE_SWATCHES = CHAT_ACCENTS.map((name) => ({
  name,
  color: CHAT_ACCENT_TOKENS[name],
}));

export interface ChatComposerProps {
  value: string;
  placeholder?: string;
  isRunning?: boolean;
  accentColor?: ChatAccentColor;
  attachments?: ReactNode;
  onChange?: (value: string) => void;
  onSend?: () => void;
  onCancel?: () => void;
  onAttach?: () => void;
  onToolSelect?: (tool: string) => void;
  runtimeState?: ChatRuntimeState;
  runtimeDetail?: string;
  className?: string;
}

function ChatPaletteLegend({
  activeAccent,
}: {
  activeAccent: ChatAccentColor;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PALETTE_SWATCHES.map((swatch) => (
        <span
          key={swatch.name}
          className={cn(
            chatStatusPillClass,
            'bg-[var(--surf-elevated)] gap-1.5 px-2.5 text-[var(--text-tertiary)] shadow-sm transition-[background-color,box-shadow,color,transform]',
            swatch.name === activeAccent &&
              'scale-[1.02] text-[var(--text-primary)] shadow-md'
          )}
          style={{
            borderColor:
              swatch.name === activeAccent
                ? `color-mix(in srgb, ${swatch.color} 42%, var(--border-glass-soft))`
                : 'var(--border-glass-soft)',
            background:
              swatch.name === activeAccent
                ? `linear-gradient(180deg, color-mix(in srgb, ${swatch.color} 14%, var(--surf-elevated)) 0%, var(--surf-elevated) 100%)`
                : 'var(--surf-elevated)',
          }}
        >
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.65)]"
            style={{
              background: swatch.color,
              boxShadow:
                swatch.name === activeAccent
                  ? `0 0 0 4px color-mix(in srgb, ${swatch.color} 16%, transparent)`
                  : '0 0 0 3px color-mix(in srgb, var(--surf-elevated) 65%, transparent)',
            }}
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
  accentColor,
  runtimeState,
  runtimeDetail,
  className,
}: ChatComposerProps) {
  const canShowToolDock = Boolean(onToolSelect);
  const statusState = runtimeState ?? (isRunning ? 'running' : 'idle');
  const resolvedAccent = accentColor ?? CHAT_RUNTIME_STATE_ACCENTS[statusState];
  const accent = CHAT_ACCENT_TOKENS[resolvedAccent];
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
      style={
        {
          '--composer-accent': accent,
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--composer-accent) 16%, var(--surf-elevated)) 0%, var(--surf-elevated) 36%, var(--surf-canvas) 100%)',
          border: `1px solid color-mix(in srgb, var(--composer-accent) 22%, rgba(255,255,255,0.9))`,
          boxShadow:
            '0 18px 42px color-mix(in srgb, var(--composer-accent) 12%, rgba(17,21,29,0.12))',
        } as ComposerStyle
      }
      className={cn(
        'genie-surface genie-surface--overlay flex w-full flex-col items-stretch gap-2 rounded-[32px] px-3 py-3',
        className
      )}
    >
      {attachments && <div className="flex flex-wrap gap-2">{attachments}</div>}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChatRuntimeStatus
          state={statusState}
          detail={statusDetail}
          accentColor={resolvedAccent}
        />
        <ChatPaletteLegend activeAccent={resolvedAccent} />
      </div>

      <PromptInput
        value={value}
        placeholder={placeholder}
        loading={isRunning}
        disabled={isRunning}
        active={Boolean(value.trim()) || isRunning}
        accentColor={accent}
        leadingIcon="✦"
        onChange={(event) => onChange?.(event.target.value)}
        onSubmit={onSend}
        className="w-full"
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
