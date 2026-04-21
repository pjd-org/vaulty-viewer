export type ViewerAgentStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ViewerStreamNode = {
  id: string;
  label: string;
  level: 'main' | 'cabinet' | 'specialist';
  parentId?: string;
  status: ViewerAgentStatus;
  lastMessage?: string;
  progress?: number;
  artifactRefs?: string[];
};

export type ViewerStreamEvent =
  | {
      kind: 'node_update';
      node: ViewerStreamNode;
      timestamp: string;
      sequence: number;
    }
  | {
      kind: 'token';
      nodeId: string;
      content: string;
      timestamp: string;
      sequence: number;
    }
  | {
      kind: 'tool_call';
      nodeId: string;
      toolName: string;
      argsChunk?: string;
      timestamp: string;
      sequence: number;
    }
  | {
      kind: 'tool_result';
      nodeId: string;
      toolName: string;
      preview: string;
      timestamp: string;
      sequence: number;
    }
  | {
      kind: 'progress';
      nodeId: string;
      status: 'queued' | 'running';
      message?: string;
      progress?: number;
      timestamp: string;
      sequence: number;
    }
  | {
      kind: 'summary';
      nodeId: string;
      status: 'completed' | 'failed' | 'cancelled';
      summary: string;
      artifactRefs?: string[];
      timestamp: string;
      sequence: number;
    };

type NodeMeta = {
  firstSeenTimestamp: string;
  firstSeenSequence: number;
  groupId: string;
  depth: number;
};

type DedupeMaps = {
  lifecycle: Record<string, string>;
  progress: Record<string, string>;
  token: Record<string, Record<string, true>>;
  tool: Record<string, Record<string, true>>;
  summary: Record<string, string>;
};

export type ViewerStreamState = {
  nodes: Record<string, ViewerStreamNode>;
  orderedNodeIds: string[];
  messageBuffers: Record<string, string>;
  toolActivity: Record<
    string,
    Array<{
      toolName: string;
      status: 'calling' | 'result';
      preview?: string;
    }>
  >;
  nodeMeta: Record<string, NodeMeta>;
  dedupe: DedupeMaps;
};

export function createPrimaryAgentStreamState(): ViewerStreamState {
  return {
    nodes: {},
    orderedNodeIds: [],
    messageBuffers: {},
    toolActivity: {},
    nodeMeta: {},
    dedupe: {
      lifecycle: {},
      progress: {},
      token: {},
      tool: {},
      summary: {},
    },
  };
}

function splitNodeId(nodeId: string): string[] {
  return nodeId.split('/').map((segment) => segment.trim()).filter(Boolean);
}

function nodeDepth(nodeId: string): number {
  return splitNodeId(nodeId).length;
}

function nodeGroupId(nodeId: string): string {
  const [root] = splitNodeId(nodeId);
  return root ?? nodeId;
}

function inferNodeLevel(nodeId: string): ViewerStreamNode['level'] {
  if (nodeId === 'huey') return 'main';
  return splitNodeId(nodeId).length === 1 ? 'cabinet' : 'specialist';
}

function inferParentId(nodeId: string): string | undefined {
  const segments = splitNodeId(nodeId);
  if (segments.length <= 1) return undefined;
  return segments.slice(0, -1).join('/');
}

function compareIsoDates(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function ensureNodeMeta(
  state: ViewerStreamState,
  nodeId: string,
  timestamp: string,
  sequence: number
): NodeMeta {
  const existing = state.nodeMeta[nodeId];
  if (existing) return existing;
  const meta: NodeMeta = {
    firstSeenTimestamp: timestamp,
    firstSeenSequence: sequence,
    groupId: nodeGroupId(nodeId),
    depth: nodeDepth(nodeId),
  };
  state.nodeMeta[nodeId] = meta;
  return meta;
}

function isNoopLifecycleEvent(
  previous: string | undefined,
  next: string
): boolean {
  return previous === next;
}

function tokenFingerprint(event: Extract<ViewerStreamEvent, { kind: 'token' }>) {
  return `${event.nodeId}|${event.timestamp}|${event.sequence}|${event.content}`;
}

function toolFingerprint(
  event: Extract<ViewerStreamEvent, { kind: 'tool_call' | 'tool_result' }>
): string {
  const payload =
    event.kind === 'tool_call'
      ? event.argsChunk ?? ''
      : event.preview ?? '';
  return `${event.nodeId}|${event.timestamp}|${event.sequence}|${event.toolName}|${payload}`;
}

function summaryFingerprint(
  event: Extract<ViewerStreamEvent, { kind: 'summary' }>
): string {
  const artifactRefs = event.artifactRefs?.join(',') ?? '';
  return `${event.nodeId}|${event.timestamp}|${event.sequence}|${event.status}|${event.summary}|${artifactRefs}`;
}

function sortNodeIds(state: ViewerStreamState): string[] {
  return Object.keys(state.nodes).sort((a, b) => {
    if (a === b) return 0;
    if (a === 'huey') return -1;
    if (b === 'huey') return 1;

    const metaA = state.nodeMeta[a];
    const metaB = state.nodeMeta[b];
    if (!metaA || !metaB) return a.localeCompare(b);

    const groupMetaA = state.nodeMeta[metaA.groupId];
    const groupMetaB = state.nodeMeta[metaB.groupId];
    const groupOrderA = groupMetaA?.firstSeenSequence ?? metaA.firstSeenSequence;
    const groupOrderB = groupMetaB?.firstSeenSequence ?? metaB.firstSeenSequence;

    if (groupOrderA !== groupOrderB) return groupOrderA - groupOrderB;
    if (metaA.depth !== metaB.depth) return metaA.depth - metaB.depth;
    if (metaA.firstSeenSequence !== metaB.firstSeenSequence) {
      return metaA.firstSeenSequence - metaB.firstSeenSequence;
    }
    if (metaA.firstSeenTimestamp !== metaB.firstSeenTimestamp) {
      return compareIsoDates(metaA.firstSeenTimestamp, metaB.firstSeenTimestamp);
    }
    return a.localeCompare(b);
  });
}

function upsertNode(
  state: ViewerStreamState,
  node: ViewerStreamNode,
  timestamp: string,
  sequence: number
): void {
  ensureNodeMeta(state, node.id, timestamp, sequence);
  state.nodes[node.id] = {
    ...state.nodes[node.id],
    ...node,
  };
}

function createNodeSkeleton(
  nodeId: string,
  status: ViewerAgentStatus
): ViewerStreamNode {
  return {
    id: nodeId,
    label: nodeId,
    level: inferNodeLevel(nodeId),
    parentId: inferParentId(nodeId),
    status,
  };
}

export function reduceViewerStreamEvent(
  state: ViewerStreamState,
  event: ViewerStreamEvent
): ViewerStreamState {
  const next: ViewerStreamState = {
    ...state,
    nodes: { ...state.nodes },
    orderedNodeIds: [...state.orderedNodeIds],
    messageBuffers: { ...state.messageBuffers },
    toolActivity: Object.fromEntries(
      Object.entries(state.toolActivity).map(([key, value]) => [key, [...value]])
    ),
    nodeMeta: { ...state.nodeMeta },
    dedupe: {
      lifecycle: { ...state.dedupe.lifecycle },
      progress: { ...state.dedupe.progress },
      token: Object.fromEntries(
        Object.entries(state.dedupe.token).map(([key, value]) => [
          key,
          { ...value },
        ])
      ),
      tool: Object.fromEntries(
        Object.entries(state.dedupe.tool).map(([key, value]) => [
          key,
          { ...value },
        ])
      ),
      summary: { ...state.dedupe.summary },
    },
  };

  if (event.kind === 'node_update') {
    const key = `${event.timestamp}|${event.sequence}|${event.node.status}|${
      event.node.progress ?? ''
    }`;
    if (isNoopLifecycleEvent(next.dedupe.lifecycle[event.node.id], key)) {
      return state;
    }
    next.dedupe.lifecycle[event.node.id] = key;
    upsertNode(next, event.node, event.timestamp, event.sequence);
    next.orderedNodeIds = sortNodeIds(next);
    return next;
  }

  if (event.kind === 'token') {
    const key = tokenFingerprint(event);
    if (next.dedupe.token[event.nodeId]?.[key]) {
      return state;
    }
    next.dedupe.token[event.nodeId] = {
      ...(next.dedupe.token[event.nodeId] ?? {}),
      [key]: true,
    };
    const existing = next.messageBuffers[event.nodeId] ?? '';
    next.messageBuffers[event.nodeId] = `${existing}${event.content}`;
    const previous = next.nodes[event.nodeId];
    const node: ViewerStreamNode = {
      ...createNodeSkeleton(event.nodeId, previous?.status ?? 'running'),
      label: previous?.label ?? event.nodeId,
      parentId: previous?.parentId ?? inferParentId(event.nodeId),
      progress: previous?.progress,
      lastMessage: `${existing}${event.content}`.trim(),
      artifactRefs: previous?.artifactRefs,
    };
    upsertNode(next, node, event.timestamp, event.sequence);
    next.orderedNodeIds = sortNodeIds(next);
    return next;
  }

  if (event.kind === 'tool_call' || event.kind === 'tool_result') {
    const key = toolFingerprint(event);
    if (next.dedupe.tool[event.nodeId]?.[key]) {
      return state;
    }
    next.dedupe.tool[event.nodeId] = {
      ...(next.dedupe.tool[event.nodeId] ?? {}),
      [key]: true,
    };
    const activity = next.toolActivity[event.nodeId] ?? [];
    activity.push({
      toolName: event.toolName,
      status: event.kind === 'tool_call' ? 'calling' : 'result',
      ...(event.kind === 'tool_result' ? { preview: event.preview } : {}),
    });
    next.toolActivity[event.nodeId] = activity;
    const previous = next.nodes[event.nodeId];
    const node: ViewerStreamNode = {
      ...createNodeSkeleton(event.nodeId, previous?.status ?? 'running'),
      label: previous?.label ?? event.nodeId,
      parentId: previous?.parentId ?? inferParentId(event.nodeId),
      lastMessage:
        event.kind === 'tool_result'
          ? event.preview
          : previous?.lastMessage,
      progress: previous?.progress,
      artifactRefs: previous?.artifactRefs,
    };
    upsertNode(next, node, event.timestamp, event.sequence);
    next.orderedNodeIds = sortNodeIds(next);
    return next;
  }

  if (event.kind === 'progress') {
    const key = `${event.timestamp}|${event.sequence}|${event.status}|${
      event.progress ?? ''
    }`;
    if (isNoopLifecycleEvent(next.dedupe.progress[event.nodeId], key)) {
      return state;
    }
    next.dedupe.progress[event.nodeId] = key;
    const previous = next.nodes[event.nodeId];
    const node: ViewerStreamNode = {
      ...createNodeSkeleton(event.nodeId, event.status),
      label: previous?.label ?? event.nodeId,
      parentId: previous?.parentId ?? inferParentId(event.nodeId),
      status: event.status,
      lastMessage: event.message ?? previous?.lastMessage,
      progress: event.progress ?? previous?.progress,
      artifactRefs: previous?.artifactRefs,
    };
    upsertNode(next, node, event.timestamp, event.sequence);
    next.orderedNodeIds = sortNodeIds(next);
    return next;
  }

  const key = summaryFingerprint(event);
  if (next.dedupe.summary[event.nodeId] === key) {
    return state;
  }
  next.dedupe.summary[event.nodeId] = key;

  const previous = next.nodes[event.nodeId];
  const node: ViewerStreamNode = {
    ...createNodeSkeleton(event.nodeId, event.status),
    label: previous?.label ?? event.nodeId,
    parentId: previous?.parentId ?? inferParentId(event.nodeId),
    status: event.status,
    lastMessage: event.summary,
    progress: undefined,
    artifactRefs: event.artifactRefs,
  };
  upsertNode(next, node, event.timestamp, event.sequence);
  next.messageBuffers[event.nodeId] = event.summary;
  next.orderedNodeIds = sortNodeIds(next);
  return next;
}
