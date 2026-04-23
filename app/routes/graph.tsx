import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@xyflow/react/dist/style.css';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';

import { graphSearchParams } from '../../src/lib/routes/search-params';
import { useKnowledgeGraph, type GraphJson } from '../lib/viewer-adapter';
import { RouteLoadingState } from '../components/ui';
import { WorkspaceScaffold } from '../components/layout';

export const Route = createFileRoute('/graph')({
  validateSearch: graphSearchParams,
  component: GraphRoute,
});

type FlowNodeData = {
  label: string;
  audience: string;
  path: string;
  tags: string[];
  degree: number;
};

type GraphViewMode = 'interactive' | 'sketch';

type ExcalidrawModule = {
  Excalidraw: React.ComponentType<{
    initialData?: { elements: unknown[]; appState?: Record<string, unknown> };
    excalidrawAPI?: (api: ExcalidrawImperativeAPI) => void;
    viewModeEnabled?: boolean;
    gridModeEnabled?: boolean;
    zenModeEnabled?: boolean;
    theme?: 'light' | 'dark';
  }>;
};

const AUDIENCE_COLORS: Record<string, string> = {
  human: 'var(--color-primary)',
  agent: 'var(--color-success)',
  bubble: 'var(--color-warning)',
  unknown: 'var(--text-tertiary)',
};

function graphToFlow(data: GraphJson): {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
} {
  const entries = Object.entries(data.nodes);
  const adjacency: Record<string, Set<string>> = {};
  for (const path of Object.keys(data.nodes)) adjacency[path] = new Set();
  for (const [source, targets] of Object.entries(data.links ?? {})) {
    for (const target of targets ?? []) {
      if (!data.nodes[source] || !data.nodes[target]) continue;
      adjacency[source].add(target);
      adjacency[target].add(source);
    }
  }

  const hub = Object.keys(adjacency).sort(
    (a, b) => adjacency[b].size - adjacency[a].size
  )[0];

  const levels = new Map<string, number>();
  if (hub) {
    const queue: Array<{ id: string; level: number }> = [{ id: hub, level: 0 }];
    levels.set(hub, 0);
    for (let i = 0; i < queue.length; i += 1) {
      const { id, level } = queue[i];
      for (const next of adjacency[id] ?? []) {
        if (levels.has(next)) continue;
        levels.set(next, level + 1);
        queue.push({ id: next, level: level + 1 });
      }
    }
  }

  const nodes: Node<FlowNodeData>[] = entries.map(([path, node], index) => {
    const audience = node.audience ?? 'unknown';
    const degree = adjacency[path]?.size ?? 0;
    const level = levels.get(path) ?? 6 + (index % 2);
    const ring = Math.max(1, level);
    const inRing = entries.filter(([p]) => (levels.get(p) ?? 6) === level);
    const ringIndex = inRing.findIndex(([p]) => p === path);
    const angle =
      (ringIndex / Math.max(inRing.length, 1)) * Math.PI * 2 +
      (ring % 2 === 0 ? 0 : Math.PI / 8);
    const radiusX = 160 + ring * 110;
    const radiusY = 120 + ring * 84;
    const size = Math.max(12, Math.min(22, 12 + degree * 1.6));

    return {
      id: path,
      position: {
        x: Math.cos(angle) * radiusX + 540,
        y: Math.sin(angle) * radiusY + 340,
      },
      data: {
        label: node.title || path.split('/').pop() || 'Untitled note',
        audience,
        path,
        tags: node.tags ?? [],
        degree,
      },
      style: {
        borderRadius: 999,
        border: `1.5px solid color-mix(in_srgb, ${
          AUDIENCE_COLORS[audience] ?? AUDIENCE_COLORS.unknown
        } 72%, var(--border))`,
        background: 'var(--card)',
        width: size,
        height: size,
        padding: 0,
        fontSize: 0,
        boxShadow: 'var(--shadow-sm)',
      },
    };
  });

  const edges: Edge[] = [];
  for (const [source, targets] of Object.entries(data.links ?? {})) {
    if (!data.nodes[source]) continue;
    for (const target of targets ?? []) {
      if (!data.nodes[target]) continue;
      edges.push({
        id: `${source}→${target}`,
        source,
        target,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: 'color-mix(in_srgb,var(--text-secondary)_28%,transparent)',
          strokeWidth: 1.1,
        },
      });
    }
  }

  return { nodes, edges };
}

function graphToSketchElements(data: GraphJson) {
  const entries = Object.entries(data.nodes);
  const centers = new Map<string, { x: number; y: number }>();
  const elements: Record<string, unknown>[] = [];
  const hashString = (value: string) => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };
  const mkId = (kind: string, value: string) =>
    `${kind}-${hashString(`${kind}:${value}`).toString(36)}`;

  entries.forEach(([path, node], index) => {
    const angle = (index / Math.max(entries.length, 1)) * Math.PI * 2;
    const ring = 1 + Math.floor(index / 18);
    const rX = 150 + ring * 105;
    const rY = 120 + ring * 80;
    const x = Math.cos(angle) * rX + 520;
    const y = Math.sin(angle) * rY + 330;
    centers.set(path, { x, y });

    elements.push({
      id: mkId('node', path),
      type: 'ellipse',
      x: x - 10,
      y: y - 10,
      width: 20,
      height: 20,
      strokeColor:
        AUDIENCE_COLORS[node.audience ?? 'unknown'] ?? 'var(--text-tertiary)',
      backgroundColor: 'var(--card)',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 1.6,
      opacity: 100,
      seed: hashString(`seed:${path}`) % 100000,
      version: 1,
      versionNonce: hashString(`nonce:${path}`) % 100000,
      isDeleted: false,
      groupIds: [],
      boundElements: null,
      roundness: null,
      locked: false,
    });
  });

  for (const [source, targets] of Object.entries(data.links ?? {})) {
    const sourceCenter = centers.get(source);
    if (!sourceCenter) continue;
    for (const target of targets ?? []) {
      const targetCenter = centers.get(target);
      if (!targetCenter) continue;
      elements.push({
        id: mkId('edge', `${source}->${target}`),
        type: 'line',
        x: sourceCenter.x,
        y: sourceCenter.y,
        points: [
          [0, 0],
          [targetCenter.x - sourceCenter.x, targetCenter.y - sourceCenter.y],
        ],
        strokeColor:
          'color-mix(in_srgb,var(--text-secondary)_70%,var(--text-primary))',
        backgroundColor: 'transparent',
        fillStyle: 'hachure',
        strokeWidth: 1.2,
        roughness: 1.4,
        opacity: 85,
        seed: hashString(`seed:${source}->${target}`) % 100000,
        version: 1,
        versionNonce:
          hashString(`nonce:${source}->${target}`) % 100000,
        isDeleted: false,
        groupIds: [],
        boundElements: null,
        roundness: null,
        locked: false,
      });
    }
  }

  return elements;
}

function GraphFlow({
  data,
  selectedPath,
  onSelectPath,
}: {
  data: GraphJson;
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
}) {
  const flow = React.useMemo(() => graphToFlow(data), [data]);
  const [nodes, setNodes] = React.useState<Node<FlowNodeData>[]>(flow.nodes);
  const [edges, setEdges] = React.useState<Edge[]>(flow.edges);

  React.useEffect(() => {
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [flow]);

  React.useEffect(() => {
    if (!selectedPath) {
      setEdges(flow.edges);
      setNodes(flow.nodes);
      return;
    }
    setNodes((current) =>
      current.map((node) => {
        const selected = node.id === selectedPath;
        const connected = (data.links[selectedPath] ?? []).includes(node.id);
        return {
          ...node,
          selected,
          style: {
            ...(node.style ?? {}),
            opacity: selected || connected ? 1 : 0.45,
            boxShadow: selected
              ? '0 0 0 4px color-mix(in_srgb,var(--color-primary)_18%,transparent), var(--shadow-md)'
              : 'var(--shadow-sm)',
          },
        };
      })
    );
    setEdges((current) =>
      current.map((edge) => {
        const selected =
          edge.source === selectedPath || edge.target === selectedPath;
        return {
          ...edge,
          animated: selected,
          style: selected
            ? { stroke: 'var(--color-primary)', strokeWidth: 2.3 }
            : {
                stroke:
                  'color-mix(in_srgb,var(--text-secondary)_20%,transparent)',
                strokeWidth: 1.0,
              },
        };
      })
    );
  }, [selectedPath, data.links, flow.edges, flow.nodes]);

  const onNodeClick = React.useCallback<NodeMouseHandler<Node<FlowNodeData>>>(
    (_event, node) => onSelectPath(node.id),
    [onSelectPath]
  );

  return (
    <div
      className="genie-surface genie-surface--utility h-[640px] w-full overflow-hidden rounded-[24px]"
      data-testid="graph-flow"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        minZoom={0.18}
        maxZoom={1.5}
        onNodeClick={onNodeClick}
        onPaneClick={() => onSelectPath('')}
        attributionPosition="bottom-left"
      >
        <Background
          color="color-mix(in_srgb,var(--text-secondary)_16%,transparent)"
          gap={28}
        />
        <MiniMap
          pannable
          zoomable
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }}
          nodeStrokeColor={(node) =>
            AUDIENCE_COLORS[(node.data as FlowNodeData).audience] ??
            AUDIENCE_COLORS.unknown
          }
          nodeColor={(node) =>
            node.selected ? 'var(--color-primary)' : 'var(--surface-elevated)'
          }
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function GraphSketch({ data }: { data: GraphJson }) {
  const [excalidraw, setExcalidraw] = React.useState<
    ExcalidrawModule['Excalidraw'] | null
  >(null);
  const elements = React.useMemo(() => graphToSketchElements(data), [data]);

  React.useEffect(() => {
    let alive = true;
    import('@excalidraw/excalidraw').then((mod) => {
      if (!alive) return;
      setExcalidraw(() => (mod as ExcalidrawModule).Excalidraw);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!excalidraw) {
    return (
      <div className="genie-surface genie-surface--utility grid h-[640px] w-full place-items-center rounded-[24px] text-sm text-[var(--text-secondary)]">
        Loading sketch canvas…
      </div>
    );
  }

  const Excalidraw = excalidraw;
  return (
    <div className="genie-surface genie-surface--utility h-[640px] w-full overflow-hidden rounded-[24px]">
      <Excalidraw
        initialData={{
          elements,
          appState: {
            viewBackgroundColor: 'var(--background)',
            theme: 'light',
          },
        }}
        viewModeEnabled
        gridModeEnabled={false}
        zenModeEnabled
        theme="light"
      />
    </div>
  );
}

function GraphRoute() {
  const { data, isLoading } = useKnowledgeGraph();
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<GraphViewMode>('interactive');
  const nodeEntries = React.useMemo(
    () => Object.entries(data?.nodes ?? {}),
    [data]
  );
  const selectedNode =
    selectedPath && selectedPath.length > 0 && data
      ? data.nodes[selectedPath]
      : null;
  const outgoingCount =
    selectedPath && selectedPath.length > 0 && data
      ? (data.links[selectedPath]?.length ?? 0)
      : 0;
  const incomingCount =
    selectedPath && selectedPath.length > 0 && data
      ? (data.backlinks[selectedPath]?.length ?? 0)
      : 0;
  const graphStats = data
    ? [
        { label: 'Nodes', value: data.node_count },
        { label: 'Edges', value: data.edge_count },
        { label: 'Human', value: data.by_audience?.human.length ?? 0 },
        { label: 'Agent', value: data.by_audience?.agent.length ?? 0 },
      ]
    : [];

  return (
    <WorkspaceScaffold
      title="Graph"
      subtitle="Knowledge network at a glance."
      primaryTitle="Knowledge"
      primarySubtitle="Interactive or sketch topology map."
      actions={
        <div className="inline-flex rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-elevated)] p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('interactive')}
            className={[
              'cursor-pointer rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              viewMode === 'interactive'
                ? 'bg-[var(--n-900)] text-[var(--n-0)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surf-base)]',
            ].join(' ')}
          >
            Interactive
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sketch')}
            className={[
              'cursor-pointer rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              viewMode === 'sketch'
                ? 'bg-[var(--n-900)] text-[var(--n-0)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surf-base)]',
            ].join(' ')}
          >
            Sketch
          </button>
        </div>
      }
      primary={
        isLoading ? (
          <RouteLoadingState label="Loading graph topology..." />
        ) : data == null ? (
          <div data-testid="graph-empty-state" className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Graph not available.
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              The knowledge graph will appear once the vault runtime connects.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div
              data-testid="graph-stats"
              className="grid gap-4 sm:grid-cols-4"
            >
              {graphStats.map((stat) => (
                <div
                  key={stat.label}
                  className="genie-surface genie-surface--utility rounded-[20px] p-4"
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="genie-surface genie-surface--utility flex flex-col gap-4 rounded-[22px] p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                    Selected
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-[var(--text-primary)]">
                    {selectedNode?.title || 'Untitled note'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {selectedPath
                      ? `${outgoingCount} out · ${incomingCount} in`
                      : 'No node selected'}
                  </p>
                </div>

                <div data-testid="graph-node-list" className="flex flex-col gap-2">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                    Node list
                  </p>
                  <div className="max-h-[420px] flex flex-col gap-1 overflow-y-auto pr-1">
                    {nodeEntries.map(([path, node]) => {
                      const active = path === selectedPath;
                      return (
                        <button
                          key={path}
                          type="button"
                          onClick={() => setSelectedPath(path)}
                          className={[
                            'block w-full cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                            active
                              ? 'border-[color-mix(in_srgb,var(--a-sky)_32%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))]'
                              : 'border-[var(--border-glass-soft)] bg-[var(--surf-base)] hover:border-[var(--border-glass-default)] hover:bg-[var(--surf-utility)]',
                          ].join(' ')}
                        >
                          <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                            {node.title || 'Untitled note'}
                          </span>
                          <span className="block truncate text-[11px] text-[var(--text-secondary)]">
                            {path}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              {viewMode === 'interactive' ? (
                <GraphFlow
                  data={data}
                  selectedPath={selectedPath}
                  onSelectPath={(path) => setSelectedPath(path || null)}
                />
              ) : (
                <GraphSketch data={data} />
              )}
            </div>
          </div>
        )
      }
    />
  );
}
