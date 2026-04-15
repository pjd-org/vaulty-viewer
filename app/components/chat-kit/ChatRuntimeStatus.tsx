import type { CSSProperties } from 'react';
import { cn } from '@/src/lib/utils';
import {
  CHAT_ACCENT_TOKENS,
  CHAT_RUNTIME_STATE_ACCENTS,
  type ChatAccentColor,
  type ChatRuntimeState,
} from './accent';

export interface ChatRuntimeStatusProps {
  state: ChatRuntimeState;
  detail?: string;
  className?: string;
  accentColor?: ChatAccentColor;
}

export function ChatRuntimeStatus({
  state,
  detail,
  className,
  accentColor,
}: ChatRuntimeStatusProps) {
  const resolvedAccent = CHAT_ACCENT_TOKENS[
    accentColor ?? CHAT_RUNTIME_STATE_ACCENTS[state]
  ];

  const stateTextColor =
    state === 'running'
      ? 'var(--text-info)'
      : state === 'degraded'
        ? 'var(--text-warning)'
        : state === 'error'
          ? 'var(--text-danger)'
          : 'var(--text-secondary)';

  const badgeStyle: CSSProperties = {
    borderColor: `color-mix(in srgb, ${resolvedAccent} 32%, transparent)`,
    background: `color-mix(in srgb, ${resolvedAccent} 14%, white)`,
    color: stateTextColor,
  };

  const dotStyle: CSSProperties = {
    background: resolvedAccent,
  };

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
        )}
        style={badgeStyle}
      >
        <span aria-hidden="true" className="size-2 rounded-full" style={dotStyle} />
        {state.toUpperCase()}
      </span>
      {detail && <span className="text-[var(--text-secondary)]">{detail}</span>}
    </div>
  );
}
