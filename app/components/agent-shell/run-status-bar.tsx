'use client';

/**
 * agent-shell/run-status-bar.tsx
 *
 * Compact status strip: mode badge, run status, optional token info.
 * Mounts below the chat input or at the top of the shell.
 */

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import type {
  AgentExecutionMode,
  RunStatus,
} from '../../lib/agent-shell/types';
import { MODE_CONFIGS } from '../../lib/agent-shell/mode-config';

export type RunStatusBarProps = {
  mode: AgentExecutionMode;
  status: RunStatus;
  threadId?: string | null;
  error?: string | null;
  className?: string;
};

const STATUS_LABEL: Record<RunStatus, string> = {
  idle: 'Idle',
  running: 'Running…',
  done: 'Done',
  error: 'Error',
};

const STATUS_DOT: Record<RunStatus, string> = {
  idle: 'bg-white/30',
  running: 'bg-cyan-400 animate-pulse',
  done: 'bg-emerald-400',
  error: 'bg-red-400',
};

export function RunStatusBar({
  mode,
  status,
  threadId,
  error,
  className,
}: RunStatusBarProps) {
  const modeLabel = MODE_CONFIGS[mode]?.label ?? mode;

  return (
    <div
      aria-live="polite"
      aria-label={`Agent run status: ${STATUS_LABEL[status]}`}
      className={cn(
        'flex items-center gap-3 px-3 py-1.5 rounded-lg',
        'bg-white/5 border border-white/10',
        'text-xs text-white/50',
        className
      )}
    >
      {/* Mode badge */}
      <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/70 font-medium">
        {modeLabel}
      </span>

      {/* Status indicator */}
      <span className="flex items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
        <span>{STATUS_LABEL[status]}</span>
      </span>

      {/* Error text */}
      {error && status === 'error' && (
        <span
          className="ml-auto text-red-400 truncate max-w-[240px]"
          title={error}
        >
          {error}
        </span>
      )}

      {/* Thread id — dimmed, trailing */}
      {threadId && !error && (
        <span className="ml-auto font-mono opacity-40 truncate max-w-[120px]">
          {threadId}
        </span>
      )}
    </div>
  );
}
