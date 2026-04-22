'use client';

/**
 * agent-shell/todo-panel.tsx
 *
 * Displays the todo list from AgentRunState.todos.
 * Groups by nodeId when multiple nodes are present.
 * Status badges: pending / in_progress / done / cancelled
 */

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import type { TodoItem, TodoStatus } from '../../lib/agent-shell/types';

export type TodoPanelProps = {
  todos: TodoItem[];
  className?: string;
};

const STATUS_LABEL: Record<TodoStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

const STATUS_STYLE: Record<TodoStatus, string> = {
  pending: 'bg-white/10 text-white/50',
  in_progress: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  done: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  cancelled: 'bg-white/5 text-white/25 line-through',
};

const STATUS_DOT: Record<TodoStatus, string> = {
  pending: 'bg-white/30',
  in_progress: 'bg-cyan-400 animate-pulse',
  done: 'bg-emerald-400',
  cancelled: 'bg-white/20',
};

export function TodoPanel({ todos, className }: TodoPanelProps) {
  if (todos.length === 0) {
    return (
      <PanelShell title="Tasks" count={0} className={className}>
        <EmptySlot label="No tasks yet." />
      </PanelShell>
    );
  }

  // Group by nodeId
  const nodeIds = Array.from(new Set(todos.map((t) => t.nodeId)));
  const grouped = nodeIds.map((nodeId) => ({
    nodeId,
    items: todos.filter((t) => t.nodeId === nodeId),
  }));

  return (
    <PanelShell title="Tasks" count={todos.length} className={className}>
      <div className="flex flex-col gap-3">
        {grouped.map(({ nodeId, items }) => (
          <div key={nodeId} className="flex flex-col gap-1.5">
            {nodeIds.length > 1 && (
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider px-1">
                {nodeId}
              </span>
            )}
            {items.map((todo) => (
              <TodoRow key={todo.id} todo={todo} />
            ))}
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function TodoRow({ todo }: { todo: TodoItem }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 px-3 py-2 rounded-xl',
        'bg-white/5 border border-white/8',
        todo.status === 'cancelled' && 'opacity-40'
      )}
    >
      {/* Dot */}
      <span
        className={cn(
          'mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full',
          STATUS_DOT[todo.status]
        )}
        aria-hidden="true"
      />

      {/* Text */}
      <span
        className={cn(
          'flex-1 text-sm leading-snug',
          todo.status === 'cancelled'
            ? 'line-through text-white/30'
            : 'text-white/80'
        )}
      >
        {todo.text}
      </span>

      {/* Badge */}
      <span
        className={cn(
          'shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md',
          STATUS_STYLE[todo.status]
        )}
      >
        {STATUS_LABEL[todo.status]}
      </span>
    </div>
  );
}

// ── Shared panel shell ────────────────────────────────────────────────────────

function PanelShell({
  title,
  count,
  children,
  className,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        'flex flex-col gap-3 p-4 rounded-2xl',
        'bg-white/3 border border-white/8',
        className
      )}
    >
      <PanelHeader title={title} count={count} />
      {children}
    </section>
  );
}

function PanelHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
        {title}
      </h3>
      {count > 0 && (
        <span className="text-xs text-white/30 tabular-nums">{count}</span>
      )}
    </div>
  );
}

function EmptySlot({ label }: { label: string }) {
  return <p className="text-xs text-white/25 italic px-1">{label}</p>;
}

export { PanelShell, PanelHeader, EmptySlot };
