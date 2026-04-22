'use client';

/**
 * agent-shell/artifact-panel.tsx
 *
 * Grid of artifacts produced by the run.
 * Groups by kind. Each card shows title, kind badge, and a copy/open action.
 */

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { PanelShell, EmptySlot } from './todo-panel';
import type { Artifact, ArtifactKind } from '../../lib/agent-shell/types';

export type ArtifactPanelProps = {
  artifacts: Artifact[];
  className?: string;
};

const KIND_LABEL: Record<ArtifactKind, string> = {
  document: 'Doc',
  code: 'Code',
  data: 'Data',
  image: 'Image',
  reference: 'Ref',
  unknown: '—',
};

const KIND_STYLE: Record<ArtifactKind, string> = {
  document: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  code: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  data: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  image: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  reference: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  unknown: 'bg-white/10 text-white/40 border-white/10',
};

export function ArtifactPanel({ artifacts, className }: ArtifactPanelProps) {
  if (artifacts.length === 0) {
    return (
      <PanelShell title="Artifacts" count={0} className={className}>
        <EmptySlot label="No artifacts yet." />
      </PanelShell>
    );
  }

  return (
    <PanelShell
      title="Artifacts"
      count={artifacts.length}
      className={className}
    >
      <div className="grid grid-cols-1 gap-2">
        {artifacts.map((artifact) => (
          <ArtifactCard key={artifact.id} artifact={artifact} />
        ))}
      </div>
    </PanelShell>
  );
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    if (!artifact.content) return;
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silent fail
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 px-3 py-2.5 rounded-xl',
        'bg-white/5 border border-white/8',
        'group'
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        {/* Title */}
        <span className="flex-1 text-sm text-white/80 leading-snug break-words">
          {artifact.title}
        </span>

        {/* Kind badge */}
        <span
          className={cn(
            'shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md border',
            KIND_STYLE[artifact.kind]
          )}
        >
          {KIND_LABEL[artifact.kind]}
        </span>
      </div>

      {/* Node */}
      {artifact.nodeId && artifact.nodeId !== 'huey' && (
        <span className="text-[10px] font-mono text-white/30">
          {artifact.nodeId}
        </span>
      )}

      {/* Content preview (code/document) */}
      {artifact.content && artifact.kind !== 'image' && (
        <pre className="text-[11px] text-white/40 leading-snug overflow-x-auto whitespace-pre-wrap break-all max-h-[72px] overflow-y-auto">
          {artifact.content.slice(0, 400)}
          {artifact.content.length > 400 ? '…' : ''}
        </pre>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        {artifact.url && (
          <a
            href={artifact.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'text-[11px] text-white/40 hover:text-white/70 transition-colors',
              'underline underline-offset-2'
            )}
          >
            Open ↗
          </a>
        )}

        {artifact.content && (
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'text-[11px] transition-colors',
              copied ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'
            )}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}
