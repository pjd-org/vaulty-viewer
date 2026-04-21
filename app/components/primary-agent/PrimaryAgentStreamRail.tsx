import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThread } from '@assistant-ui/react';
import {
  Badge,
  Button,
  Card,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  DialogDescription,
  DialogTitle,
  ProgressBar,
  ScrollArea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@vault/ui';
import { cn } from '@/src/lib/utils';
import {
  createPrimaryAgentStreamState,
  reduceViewerStreamEvent,
  type ViewerAgentStatus,
  type ViewerStreamNode,
  type ViewerStreamState,
} from '../../../src/lib/primary-agent-stream';
import {
  subscribePrimaryAgentStream,
  resetPrimaryAgentStreamThread,
} from '../../../src/lib/primary-agent-stream-bus';

type ViewMode = 'all' | 'async' | 'cabinet' | 'specialist';

function splitNodeId(nodeId: string): string[] {
  return nodeId.split('/').map((segment) => segment.trim()).filter(Boolean);
}

function isAsyncRunNode(nodeId: string): boolean {
  return splitNodeId(nodeId).length >= 3;
}

function nodeDepth(nodeId: string): number {
  return splitNodeId(nodeId).length;
}

function nodeLevelLabel(level: ViewerStreamNode['level']): string {
  if (level === 'main') return 'Huey';
  if (level === 'cabinet') return 'Cabinet';
  return 'Specialist';
}

function statusTone(status: ViewerAgentStatus): 'default' | 'success' | 'warning' | 'danger' | 'loading' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'danger';
    case 'cancelled':
      return 'warning';
    case 'queued':
    case 'running':
      return 'loading';
    default:
      return 'default';
  }
}

function statusLabel(status: ViewerAgentStatus): string {
  return status.replace(/_/g, ' ');
}

function nodeDomId(nodeId: string): string {
  return `primary-agent-node-${nodeId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function formatCompactTime(timestamp: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

function copyText(value: string): void {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return;
  void navigator.clipboard.writeText(value);
}

function matchesViewMode(node: ViewerStreamNode, mode: ViewMode): boolean {
  if (mode === 'all') return true;
  if (mode === 'async') return isAsyncRunNode(node.id);
  if (mode === 'cabinet') return node.level === 'cabinet';
  return node.level === 'specialist';
}

function buildRunSummary(node: ViewerStreamNode): string {
  const parts = [node.label, node.id, node.status];
  if (node.progress !== undefined) parts.push(`${Math.round(node.progress)}%`);
  if (node.artifactRefs?.length) parts.push(`${node.artifactRefs.length} artifact refs`);
  return parts.join(' · ');
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
  const [commandOpen, setCommandOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const wasRunningRef = useRef(thread.isRunning);

  useEffect(() => {
    resetPrimaryAgentStreamThread(threadId);
    setState(createPrimaryAgentStreamState());
    setSelectedNodeId(null);
  }, [threadId]);

  useEffect(() => {
    if (thread.isRunning && !wasRunningRef.current) {
      resetPrimaryAgentStreamThread(threadId);
      setState(createPrimaryAgentStreamState());
      setSelectedNodeId(null);
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

  const filteredNodes = useMemo(
    () => nodes.filter((node) => matchesViewMode(node, viewMode)),
    [nodes, viewMode]
  );

  useEffect(() => {
    if (filteredNodes.length === 0) {
      setSelectedNodeId(null);
      return;
    }

    if (!selectedNodeId || !filteredNodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(filteredNodes[0]?.id ?? null);
    }
  }, [filteredNodes, selectedNodeId]);

  const selectedNode =
    filteredNodes.find((node) => node.id === selectedNodeId) ??
    filteredNodes[0] ??
    null;

  const activeNodes = nodes.filter((node) => node.status === 'queued' || node.status === 'running');
  const asyncActiveNodes = activeNodes.filter((node) => isAsyncRunNode(node.id));
  const completedNodes = nodes.filter((node) => node.status === 'completed');
  const failedNodes = nodes.filter((node) => node.status === 'failed');
  const doneNodes = nodes.filter((node) =>
    ['completed', 'failed', 'cancelled'].includes(node.status)
  );

  const streamState =
    nodes.length === 0
      ? thread.isRunning
        ? {
            tone: 'loading' as const,
            title: 'Quiet connection',
            description: 'The thread is active, but no stream nodes have appeared yet.',
          }
        : {
            tone: 'default' as const,
            title: 'No current stream yet',
            description: 'Start a Primary Agent run to populate the live hierarchy.',
          }
      : thread.isRunning || activeNodes.length > 0
        ? {
            tone: 'loading' as const,
            title: 'Live orchestration',
            description: 'Hierarchy, specialist progress, and scoped logs are updating now.',
          }
        : {
            tone: 'success' as const,
            title: 'Run complete',
            description: 'Summaries remain available below.',
          };

  const jumpToNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    if (typeof document === 'undefined') return;
    const element = document.getElementById(nodeDomId(nodeId));
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const copyArtifactRefs = useCallback((node: ViewerStreamNode) => {
    if (!node.artifactRefs?.length) return;
    copyText(node.artifactRefs.join('\n'));
  }, []);

  const visibleNodes = useMemo(
    () =>
      filteredNodes.filter((node) => matchesViewMode(node, viewMode)),
    [filteredNodes, viewMode]
  );

  return (
    <section
      data-slot="primary-agent-stream-rail"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm"
    >
      <div
        data-slot="primary-agent-stream-rail-header"
        className="sticky top-0 z-20 border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85"
      >
        <div className="flex items-start justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Live stream
            </p>
            <h2 className="mt-1 text-base font-semibold text-foreground">
              Huey Stream
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Normalized Huey, cabinet, and specialist events
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={streamState.tone === 'success' ? 'success' : streamState.tone === 'loading' ? 'loading' : 'muted'} dot>
              {streamState.title}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCommandOpen(true)}
            >
              Actions
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-4 pb-4">
          <Badge variant="accent" dot>
            {activeNodes.length} active
          </Badge>
          <Badge variant="loading" dot>
            {asyncActiveNodes.length} async
          </Badge>
          <Badge variant="success" dot>
            {completedNodes.length} completed
          </Badge>
          <Badge variant="danger" dot>
            {failedNodes.length} failed
          </Badge>
          <Badge variant="muted">
            {visibleNodes.length}/{nodes.length} visible
          </Badge>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          <Card
            data-slot="primary-agent-stream-state"
            padding={false}
            className="overflow-hidden border border-border/60 bg-background/70 shadow-none"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Stream state
                </p>
                <h3 className="mt-1 text-sm font-semibold text-foreground">
                  {streamState.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {streamState.description}
                </p>
              </div>
              <Badge variant={streamState.tone === 'success' ? 'success' : streamState.tone === 'loading' ? 'loading' : 'default'} dot>
                {thread.isRunning ? 'Running' : 'Idle'}
              </Badge>
            </div>
            <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Active nodes" value={String(activeNodes.length)} />
              <Stat label="Async runs" value={String(asyncActiveNodes.length)} />
              <Stat label="Completed" value={String(completedNodes.length)} />
              <Stat label="Failed" value={String(failedNodes.length)} />
            </div>
          </Card>

          <Card
            data-slot="primary-agent-stream-hierarchy"
            padding={false}
            className="overflow-hidden border border-border/60 bg-background/70 shadow-none"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Live hierarchy
                </p>
                <p className="text-sm text-muted-foreground">
                  Root, cabinet, specialist, and async run nodes
                </p>
              </div>
              <Badge variant="muted">{visibleNodes.length} nodes</Badge>
            </div>
            <div className="flex flex-col gap-3 px-4 py-4">
              {visibleNodes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                  Stream events will appear here when the current thread runs.
                </div>
              ) : (
                visibleNodes.map((node) => (
                  <div
                    key={node.id}
                    id={nodeDomId(node.id)}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedNodeId(node.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedNodeId(node.id);
                      }
                    }}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-left transition-colors',
                      selectedNodeId === node.id
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/60 bg-card/70 hover:bg-card'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm text-foreground">
                            {node.label}
                          </p>
                          <Badge variant="muted">{nodeLevelLabel(node.level)}</Badge>
                          {selectedNodeId === node.id && (
                            <Badge variant="accent">Focused</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {node.id}
                        </p>
                      </div>
                      <Badge variant={statusTone(node.status)} dot>
                        {statusLabel(node.status)}
                      </Badge>
                    </div>

                    {node.lastMessage && (
                      <p className="mt-3 line-clamp-2 text-sm text-foreground/90">
                        {node.lastMessage}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          jumpToNode(node.id);
                        }}
                      >
                        Focus
                      </Button>
                      {node.artifactRefs?.length ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            copyArtifactRefs(node);
                          }}
                        >
                          Copy refs
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card
            data-slot="primary-agent-stream-progress"
            padding={false}
            className="overflow-hidden border border-border/60 bg-background/70 shadow-none"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Async progress
                </p>
                <p className="text-sm text-muted-foreground">
                  Live specialist runs and progress bars
                </p>
              </div>
              <Badge variant="loading">{asyncActiveNodes.length} active</Badge>
            </div>
            <div className="flex flex-col gap-3 px-4 py-4">
              {asyncActiveNodes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                  No async specialists are active right now.
                </div>
              ) : (
                asyncActiveNodes.map((node) => (
                  <Card
                    key={node.id}
                    padding={false}
                    className="overflow-hidden border border-border/60 bg-card/80 shadow-none"
                  >
                    <div className="border-b border-border/60 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {node.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {node.id}
                          </p>
                        </div>
                        <Badge variant={statusTone(node.status)} dot>
                          {statusLabel(node.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="px-4 py-4">
                      {typeof node.progress === 'number' ? (
                        <div className="space-y-2">
                          <ProgressBar value={node.progress} height={6} />
                          <p className="text-xs text-muted-foreground">
                            {Math.max(0, Math.min(100, node.progress)).toFixed(0)}%
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Progress is still streaming.
                        </p>
                      )}
                      {node.lastMessage && (
                        <p className="mt-3 text-sm text-foreground/90">
                          {node.lastMessage}
                        </p>
                      )}
                      {node.artifactRefs?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {node.artifactRefs.map((ref) => (
                            <Badge key={ref} variant="muted">
                              {ref}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>

          <Card
            data-slot="primary-agent-stream-live"
            padding={false}
            className="overflow-hidden border border-border/60 bg-background/70 shadow-none"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Scoped stream
                </p>
                <p className="text-sm text-muted-foreground">
                  Live token and tool activity for the focused node
                </p>
              </div>
              <Badge variant="muted">
                {selectedNode ? nodeLevelLabel(selectedNode.level) : 'None'}
              </Badge>
            </div>
            <div className="px-4 py-4">
              {selectedNode ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="accent" dot>
                      {selectedNode.label}
                    </Badge>
                    <Badge variant="muted">{selectedNode.id}</Badge>
                    <Badge variant={statusTone(selectedNode.status)} dot>
                      {statusLabel(selectedNode.status)}
                    </Badge>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Token log
                      </p>
                      <ScrollArea className="max-h-32 rounded-2xl border border-border/60 bg-card/70">
                        <div className="p-3 text-sm text-foreground/90">
                          {state.messageBuffers[selectedNode.id] ? (
                            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5">
                              {state.messageBuffers[selectedNode.id]}
                            </pre>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No token stream yet for this node.
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Tool activity
                      </p>
                      <ScrollArea className="max-h-32 rounded-2xl border border-border/60 bg-card/70">
                        <div className="p-3">
                          {state.toolActivity[selectedNode.id]?.length ? (
                            <ul className="flex flex-col gap-2 text-sm">
                              {state.toolActivity[selectedNode.id].map((entry, index) => (
                                <li
                                  key={`${entry.toolName}-${index}`}
                                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2"
                                >
                                  <Badge variant="muted">{entry.status}</Badge>
                                  <span className="font-medium text-foreground">
                                    {entry.toolName}
                                  </span>
                                  {entry.preview && (
                                    <span className="text-xs text-muted-foreground">
                                      {entry.preview}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No tool activity has been captured for this node.
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                  Select a node to inspect its live token and tool stream.
                </div>
              )}
            </div>
          </Card>

          <Collapsible defaultOpen={false}>
            <Card padding={false} className="overflow-hidden border border-border/60 bg-background/70 shadow-none">
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Inspection table
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Run registry, artifact refs, and terminal summaries
                  </p>
                </div>
                <Badge variant="muted">{doneNodes.length} done</Badge>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border/60 px-4 py-4">
                  <ScrollArea className="max-h-72 rounded-2xl border border-border/60 bg-card/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Run</TableHead>
                          <TableHead>Node</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Finished</TableHead>
                          <TableHead>Artifact refs</TableHead>
                          <TableHead>Summary</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nodes.map((node) => (
                          <TableRow key={node.id}>
                            <TableCell className="font-mono text-xs">
                              {node.id}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-foreground">
                                  {node.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {nodeLevelLabel(node.level)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusTone(node.status)} dot>
                                {statusLabel(node.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {state.nodeMeta[node.id]?.firstSeenTimestamp
                                ? formatCompactTime(
                                    state.nodeMeta[node.id].firstSeenTimestamp
                                  )
                                : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {['completed', 'failed', 'cancelled'].includes(node.status)
                                ? statusLabel(node.status)
                                : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {node.artifactRefs?.length
                                ? node.artifactRefs.join(', ')
                                : '—'}
                            </TableCell>
                            <TableCell className="max-w-[22rem] text-sm text-muted-foreground">
                              {node.lastMessage ?? state.messageBuffers[node.id] ?? '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <div className="px-1 pb-1 text-[11px] text-muted-foreground">
            {streamState.description}
          </div>
        </div>
      </ScrollArea>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogTitle className="sr-only">Primary Agent stream commands</DialogTitle>
        <DialogDescription className="sr-only">
          Search, filter, jump to, and copy references for stream nodes.
        </DialogDescription>
        <CommandInput placeholder="Search nodes, filters, refs..." />
        <CommandList className="max-h-[420px] overflow-y-auto">
          <CommandEmpty>No matching nodes or actions.</CommandEmpty>

          <CommandGroup heading="Filters">
            <CommandItem
              value="all nodes"
              onSelect={() => {
                setViewMode('all');
                setCommandOpen(false);
              }}
            >
              All nodes
            </CommandItem>
            <CommandItem
              value="async only"
              onSelect={() => {
                setViewMode('async');
                setCommandOpen(false);
              }}
            >
              Async only
            </CommandItem>
            <CommandItem
              value="cabinet only"
              onSelect={() => {
                setViewMode('cabinet');
                setCommandOpen(false);
              }}
            >
              Cabinet only
            </CommandItem>
            <CommandItem
              value="specialist only"
              onSelect={() => {
                setViewMode('specialist');
                setCommandOpen(false);
              }}
            >
              Specialist only
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Jump to nodes">
            {nodes.map((node) => (
              <CommandItem
                key={`jump-${node.id}`}
                value={`${node.label} ${node.id} ${node.status} ${node.lastMessage ?? ''}`}
                onSelect={() => {
                  jumpToNode(node.id);
                  setCommandOpen(false);
                }}
              >
                <span className="truncate">{buildRunSummary(node)}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Copy refs">
            {nodes.filter((node) => node.artifactRefs?.length).map((node) => (
              <CommandItem
                key={`copy-${node.id}`}
                value={`${node.label} refs ${node.artifactRefs?.join(' ') ?? ''}`}
                onSelect={() => {
                  copyArtifactRefs(node);
                  setCommandOpen(false);
                }}
              >
                <span className="truncate">
                  Copy refs for {node.label}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
