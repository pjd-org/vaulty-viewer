'use client';

/**
 * agent-shell/mode-switcher.tsx
 *
 * Toggle between AgentExecutionModes.
 * Uses getAvailableModes() — agent_runner is hidden when sandbox unavailable.
 */

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import {
  getAvailableModes,
  type ModeConfig,
} from '../../lib/agent-shell/mode-config';
import type { AgentExecutionMode } from '../../lib/agent-shell/types';

export type ModeSwitcherProps = {
  value: AgentExecutionMode;
  onChange: (mode: AgentExecutionMode) => void;
  sandboxAvailable?: boolean;
  disabled?: boolean;
  className?: string;
};

export function ModeSwitcher({
  value,
  onChange,
  sandboxAvailable = true,
  disabled = false,
  className,
}: ModeSwitcherProps) {
  const modes = getAvailableModes({ sandboxAvailable });

  return (
    <div
      role="radiogroup"
      aria-label="Execution mode"
      className={cn(
        'flex items-center gap-1 p-1 rounded-xl',
        'bg-muted/40 border border-border backdrop-blur-sm',
        className
      )}
    >
      {modes.map((cfg: ModeConfig) => {
        const selected = cfg.mode === value;
        return (
          <button
            key={cfg.mode}
            role="radio"
            aria-checked={selected}
            aria-label={cfg.description}
            disabled={disabled}
            onClick={() => onChange(cfg.mode)}
            className={cn(
              'relative px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              'disabled:pointer-events-none disabled:opacity-40',
              selected
                ? [
                    'bg-primary text-slate-950 border border-primary',
                    'shadow-[0_2px_8px_rgba(0,0,0,0.2)]',
                  ]
                : 'text-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
