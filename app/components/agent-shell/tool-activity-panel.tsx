'use client';

/**
 * agent-shell/tool-activity-panel.tsx
 *
 * Log of tool calls: started → completed / error.
 * Shows tool name, node, args preview, result/error preview, duration.
 * Most-recent first.
 */

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { PanelShell, EmptySlot } from './todo-panel';
import type { ToolEvent, ToolEventStatus } from '../../lib/agent-shell/types';

export type ToolActivityPanelProps = {
  tools: ToolEvent[];
  className?: string;
};

const STATUS_STYLE: Record<ToolEventStatus, string> = {
  started: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  completed: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  error: 'bg-red-500/20 text-red-300 border border-red-500/30',
};

const STATUS_LABEL: Record<ToolEventStatus, string> = {
  started: 'Running',
  completed: 'Done',
  error: 'Error',
};

export function ToolActivityPanel({
  tools,
  className,
}: ToolActivityPanelProps) {
  // Most-recent first
  const sorted = [...tools].reverse();

  if (sorted.length === 0) {
    return (
      <PanelShell title="Tool Activity" count={0} className={className}>
        <EmptySlot label="No tool calls yet." />
      </PanelShell>
    );
  }

  return (
    <PanelShell
      title="Tool Activity"
      count={tools.length}
      className={className}
    >
      <div className="flex flex-col gap-2">
        {sorted.map((tool) => (
          <ToolRow key={tool.id} tool={tool} />
        ))}
      </div>
    </PanelShell>
  );
}

function ToolRow({ tool }: { tool: ToolEvent }) {
  const duration =
    tool.completedAt && tool.startedAt
      ? formatDuration(
          new Date(tool.completedAt).getTime() -
            new Date(tool.startedAt).getTime()
        )
      : null;

  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 px-3 py-2.5 rounded-xl',
        'bg-white/5 border border-white/8',
        tool.status === 'error' && 'border-red-500/20 bg-red-500/5'
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-medium text-white/80 font-mono truncate">
          {tool.toolName}
        </span>

        <span
          className={cn(
            'shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md',
            STATUS_STYLE[tool.status]
          )}
        >
          {STATUS_LABEL[tool.status]}
        </span>

        {duration && (
          <span className="shrink-0 text-[10px] text-white/30 tabular-nums">
            {duration}
          </span>
        )}
      </div>

      {/* Node */}
      {tool.nodeId && tool.nodeId !== 'huey' && (
        <span className="text-[10px] font-mono text-white/30">
          {tool.nodeId}
        </span>
      )}

      {/* Args preview */}
      {tool.argsPreview && (
        <pre className="text-[11px] text-white/40 leading-snug overflow-x-auto whitespace-pre-wrap break-all max-h-[60px] overflow-y-auto">
          {tool.argsPreview}
        </pre>
      )}

      {/* Result preview */}
      {tool.resultPreview && tool.status === 'completed' && (
        <pre className="text-[11px] text-emerald-300/60 leading-snug overflow-x-auto whitespace-pre-wrap break-all max-h-[60px] overflow-y-auto">
          {tool.resultPreview}
        </pre>
      )}

      {/* Error */}
      {tool.error && tool.status === 'error' && (
        <p className="text-[11px] text-red-300/80 leading-snug break-all">
          {tool.error}
        </p>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}
