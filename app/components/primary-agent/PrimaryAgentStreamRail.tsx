import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useThread } from '@assistant-ui/react';
import {
  createPrimaryAgentStreamState,
  reduceViewerStreamEvent,
  type ViewerStreamNode,
  type ViewerStreamState,
} from '../../../src/lib/primary-agent-stream';
import {
  subscribePrimaryAgentStream,
  resetPrimaryAgentStreamThread,
} from '../../../src/lib/primary-agent-stream-bus';

function statusClass(status: ViewerStreamNode['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25';
    case 'failed':
      return 'bg-rose-500/15 text-rose-500 border-rose-500/25';
    case 'cancelled':
      return 'bg-amber-500/15 text-amber-500 border-amber-500/25';
    case 'running':
      return 'bg-sky-500/15 text-sky-500 border-sky-500/25';
    case 'queued':
      return 'bg-muted/50 text-muted-foreground border-border/60';
    default:
      return 'bg-muted/50 text-muted-foreground border-border/60';
  }
}

function levelLabel(level: ViewerStreamNode['level']): string {
  if (level === 'main') return 'Huey';
  if (level === 'cabinet') return 'Cabinet';
  return 'Specialist';
}

export function PrimaryAgentStreamRail({
  threadId,
}: {
  threadId: string;
}) {
  const thread = useThread();
  const [state, setState] = useState<ViewerStreamState>(() =>
    createPrimaryAgentStreamState()
  );
  const wasRunningRef = useRef(thread.isRunning);

  useEffect(() => {
    resetPrimaryAgentStreamThread(threadId);
    setState(createPrimaryAgentStreamState());
  }, [threadId]);

  useEffect(() => {
    if (thread.isRunning && !wasRunningRef.current) {
      resetPrimaryAgentStreamThread(threadId);
      setState(createPrimaryAgentStreamState());
    }
    wasRunningRef.current = thread.isRunning;
  }, [thread.isRunning, threadId]);

  useEffect(() => {
    return subscribePrimaryAgentStream(threadId, (event) => {
      setState((current) => reduceViewerStreamEvent(current, event));
    });
  }, [threadId]);

  const nodes = useMemo(
    () =>
      state.orderedNodeIds
        .map((id) => state.nodes[id])
        .filter((node): node is ViewerStreamNode => Boolean(node)),
    [state.nodes, state.orderedNodeIds]
  );

  const activeCount = nodes.filter((node) =>
    ['queued', 'running'].includes(node.status)
  ).length;

  return (
    <section className="rounded-[28px] border border-border/60 bg-card/60 p-4 backdrop-blur-sm shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Live stream
          </p>
          <p className="text-sm text-muted-foreground">
            Normalized Huey, cabinet, and specialist events
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {thread.isRunning ? 'Running' : 'Idle'}
          </p>
          <p className="text-xs text-muted-foreground">
            {activeCount} active node{activeCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
          Stream events will appear here when the current thread runs.
        </div>
      ) : (
        <div className="space-y-3">
          {nodes.map((node) => (
            <article
              key={node.id}
              className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-foreground">
                      {node.label}
                    </p>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {levelLabel(node.level)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{node.id}</p>
                </div>
                <span
                  className={[
                    'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]',
                    statusClass(node.status),
                  ].join(' ')}
                >
                  {node.status}
                </span>
              </div>

              {typeof node.progress === 'number' && (
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, node.progress))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {node.progress.toFixed(0)}%
                  </p>
                </div>
              )}

              {node.lastMessage && (
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                  {node.lastMessage}
                </p>
              )}

              {node.artifactRefs && node.artifactRefs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {node.artifactRefs.map((ref) => (
                    <span
                      key={ref}
                      className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              )}

              {state.messageBuffers[node.id] && (
                <div className="rounded-xl bg-muted/30 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap">
                  {state.messageBuffers[node.id]}
                </div>
              )}

              {state.toolActivity[node.id]?.length ? (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {state.toolActivity[node.id].map((entry, index) => (
                    <li key={`${entry.toolName}-${index}`} className="flex items-center gap-2">
                      <span className="rounded-full border border-border/60 px-2 py-0.5 uppercase tracking-[0.18em] text-[10px]">
                        {entry.status}
                      </span>
                      <span>{entry.toolName}</span>
                      {entry.preview && (
                        <span className="text-muted-foreground/80">
                          {entry.preview}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
