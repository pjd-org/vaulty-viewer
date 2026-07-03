'use client';

/**
 * agent-shell/subagent-panel.tsx
 *
 * Subagent hierarchy tree for deepagent mode.
 * Hidden (returns null) when mode has no subagent visibility.
 *
 * Node layout: huey (main) → cabinet → specialist
 * Status: idle / running / done / error
 */

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { PanelShell, EmptySlot } from './todo-panel';
import type { SubagentRun, RunStatus } from '../../lib/agent-shell/types';

export type SubagentPanelProps = {
  subagents: SubagentRun[];
  hasSubagentVisibility: boolean;
  className?: string;
};

const STATUS_DOT: Record<RunStatus, string> = {
  idle: 'bg-white/20',
  running: 'bg-cyan-400 animate-pulse',
  done: 'bg-emerald-400',
  error: 'bg-red-400',
};

const STATUS_LABEL: Record<RunStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  done: 'Done',
  error: 'Error',
};

type TreeNode = {
  run: SubagentRun;
  level: 'main' | 'cabinet' | 'specialist';
  children: TreeNode[];
};

export function SubagentPanel({
  subagents,
  hasSubagentVisibility,
  className,
}: SubagentPanelProps) {
  if (!hasSubagentVisibility) return null;

  if (subagents.length === 0) {
    return (
      <PanelShell title="Subagents" count={0} className={className}>
        <EmptySlot label="No subagents spawned." />
      </PanelShell>
    );
  }

  const tree = buildTree(subagents);

  return (
    <PanelShell
      title="Subagents"
      count={subagents.length}
      className={className}
    >
      <div className="flex flex-col gap-1">
        {tree.map((node) => (
          <SubagentNode key={node.run.nodeId} node={node} depth={0} />
        ))}
      </div>
    </PanelShell>
  );
}

function SubagentNode({ node, depth }: { node: TreeNode; depth: number }) {
  const { run } = node;

  return (
    <div className="flex flex-col">
      {/* Row */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl',
          'bg-white/5 border border-white/8',
          depth > 0 && 'ml-4 border-l-2 border-l-white/10 rounded-l-none'
        )}
        style={{ marginLeft: depth * 16 }}
      >
        {/* Status dot */}
        <span
          className={cn(
            'shrink-0 h-1.5 w-1.5 rounded-full',
            STATUS_DOT[run.status]
          )}
          aria-hidden="true"
        />

        {/* Label */}
        <span className="flex-1 text-sm text-white/80 truncate">
          {run.label}
        </span>

        {/* Status text */}
        <span className="shrink-0 text-[10px] text-white/30">
          {STATUS_LABEL[run.status]}
        </span>
      </div>

      {/* Summary */}
      {run.summary && run.status !== 'running' && (
        <p
          className="text-[11px] text-white/35 leading-snug px-3 pt-1 pb-0.5 truncate"
          style={{ marginLeft: depth * 16 }}
          title={run.summary}
        >
          {run.summary}
        </p>
      )}

      {/* Children */}
      {node.children.map((child) => (
        <SubagentNode key={child.run.nodeId} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

// ── Tree builder ──────────────────────────────────────────────────────────────

/**
 * nodeId convention: "huey" | "cabinet" | "cabinet/specialist"
 * Build a depth-2 tree from flat list.
 */
function buildTree(subagents: SubagentRun[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();

  // Classify nodes
  for (const run of subagents) {
    const parts = run.nodeId.split('/');
    const level: TreeNode['level'] =
      run.nodeId === 'huey'
        ? 'main'
        : parts.length === 1
          ? 'cabinet'
          : 'specialist';
    byId.set(run.nodeId, { run, level, children: [] });
  }

  const roots: TreeNode[] = [];

  for (const [nodeId, node] of byId) {
    if (node.level === 'main' || node.level === 'cabinet') {
      roots.push(node);
    } else {
      // specialist — parent is the cabinet segment
      const parts = nodeId.split('/');
      const parentId = parts.slice(0, -1).join('/');
      const parent = byId.get(parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node); // orphan — surface at root
      }
    }
  }

  // Sort: main first, then by startedAt
  roots.sort((a, b) => {
    if (a.level === 'main') return -1;
    if (b.level === 'main') return 1;
    return (
      new Date(a.run.startedAt).getTime() - new Date(b.run.startedAt).getTime()
    );
  });

  return roots;
}
