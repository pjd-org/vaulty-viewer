import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
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
import {
  useKnowledgeGraph,
  type GraphJson,
} from '../lib/viewer-adapter';
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
  human: '#0f766e',
  agent: '#1d4ed8',
  bubble: '#c2410c',
  unknown: '#475569',
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
        border: `1.5px solid ${AUDIENCE_COLORS[audience] ?? AUDIENCE_COLORS.unknown}`,
        background: '#ffffff',
        width: size,
        height: size,
        padding: 0,
        fontSize: 0,
        boxShadow: '0 2px 8px rgba(15,23,42,0.16)',
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
        style: { stroke: 'rgba(30,41,59,0.30)', strokeWidth: 1.1 },
      });
    }
  }

  return { nodes, edges };
}

function graphToSketchElements(data: GraphJson) {
  const entries = Object.entries(data.nodes);
  const centers = new Map<string, { x: number; y: number }>();
  const elements: Record<string, unknown>[] = [];
  const mkId = () => Math.random().toString(36).slice(2, 12);

  entries.forEach(([path, node], index) => {
    const angle = (index / Math.max(entries.length, 1)) * Math.PI * 2;
    const ring = 1 + Math.floor(index / 18);
    const rX = 150 + ring * 105;
    const rY = 120 + ring * 80;
    const x = Math.cos(angle) * rX + 520;
    const y = Math.sin(angle) * rY + 330;
    centers.set(path, { x, y });

    elements.push({
      id: mkId(),
      type: 'ellipse',
      x: x - 10,
      y: y - 10,
      width: 20,
      height: 20,
      strokeColor: AUDIENCE_COLORS[node.audience ?? 'unknown'] ?? '#475569',
      backgroundColor: '#ffffff',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 1.6,
      opacity: 100,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 100000),
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
        id: mkId(),
        type: 'line',
        x: sourceCenter.x,
        y: sourceCenter.y,
        points: [[0, 0], [targetCenter.x - sourceCenter.x, targetCenter.y - sourceCenter.y]],
        strokeColor: '#334155',
        backgroundColor: 'transparent',
        fillStyle: 'hachure',
        strokeWidth: 1.2,
        roughness: 1.4,
        opacity: 85,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 100000),
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
              ? '0 0 0 4px rgba(59,130,246,0.18), 0 2px 10px rgba(15,23,42,0.22)'
              : '0 2px 8px rgba(15,23,42,0.14)',
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
            ? { stroke: 'rgba(29,78,216,0.95)', strokeWidth: 2.3 }
            : { stroke: 'rgba(30,41,59,0.20)', strokeWidth: 1.0 },
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
      className="h-[640px] w-full rounded-xl border border-slate-200/80 overflow-hidden bg-white/70"
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
        <Background color="rgba(148,163,184,0.20)" gap={28} />
        <MiniMap
          pannable
          zoomable
          style={{
            background: 'rgba(255,255,255,0.90)',
            border: '1px solid rgba(148,163,184,0.45)',
            borderRadius: 12,
          }}
          nodeStrokeColor={(node) =>
            AUDIENCE_COLORS[(node.data as FlowNodeData).audience] ??
            AUDIENCE_COLORS.unknown
          }
          nodeColor={(node) =>
            node.selected ? 'rgba(29,78,216,0.9)' : 'rgba(241,245,249,0.95)'
          }
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function GraphSketch({ data }: { data: GraphJson }) {
  const [excalidraw, setExcalidraw] =
    React.useState<ExcalidrawModule['Excalidraw'] | null>(null);
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
      <div className="h-[640px] w-full rounded-xl border border-slate-200/80 bg-white/70 grid place-items-center text-sm text-slate-500">
        Loading sketch canvas…
      </div>
    );
  }

  const Excalidraw = excalidraw;
  return (
    <div className="h-[640px] w-full rounded-xl border border-slate-200/80 overflow-hidden bg-white/70">
      <Excalidraw
        initialData={{
          elements,
          appState: {
            viewBackgroundColor: '#f8fafc',
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
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode('interactive')}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              viewMode === 'interactive'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100',
            ].join(' ')}
          >
            Interactive
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sketch')}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              viewMode === 'sketch'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100',
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
          <div data-testid="graph-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              Graph not available.
            </p>
            <p className="text-xs text-neutral-400">
              The knowledge graph will appear once the vault runtime connects.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div
              data-testid="graph-stats"
              className="grid gap-4 sm:grid-cols-4"
            >
              {graphStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-200/80 bg-white/75 p-4"
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-800">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="space-y-4 rounded-xl border border-slate-200/80 bg-white/75 p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    Selected
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 leading-snug">
                    {selectedNode?.title || 'Untitled note'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedPath ? `${outgoingCount} out · ${incomingCount} in` : 'No node selected'}
                  </p>
                </div>

                <div data-testid="graph-node-list" className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    Node list
                  </p>
                  <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
                    {nodeEntries.map(([path, node]) => {
                      const active = path === selectedPath;
                      return (
                        <button
                          key={path}
                          type="button"
                          onClick={() => setSelectedPath(path)}
                          className={[
                            'block w-full rounded-lg border px-3 py-2 text-left transition-colors',
                            active
                              ? 'border-sky-300 bg-sky-50'
                              : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white',
                          ].join(' ')}
                        >
                          <span className="block truncate text-sm font-medium text-slate-800">
                            {node.title || 'Untitled note'}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
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
