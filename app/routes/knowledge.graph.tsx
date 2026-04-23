import React, { useMemo, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  useKnowledgeGraph,
  useKnowledgeHealth,
  type GraphJson,
} from '../lib/viewer-adapter';
import KnowledgeHealthBanner from '../../src/components/KnowledgeHealthBanner';
import { WorkspaceScaffold } from '../components/layout';
import { EmptyState } from '../components/ui';
import { GlassCard } from '@vault/ui';
import { cn } from '@/src/lib/utils';

export const Route = createFileRoute('/knowledge/graph')({
  component: KnowledgeGraphRoute,
});

const AUDIENCE_COLOR: Record<string, string> = {
  human: 'var(--color-primary)',
  agent: 'var(--color-success)',
  bubble: 'var(--color-warning)',
};
const DEFAULT_COLOR = 'var(--text-tertiary)';

const WIDTH = 900;
const HEIGHT = 600;
const ITERATIONS = 80;
const REPULSION = 5000;
const ATTRACTION = 0.05;
const DAMPING = 0.85;

/**
 * Deterministic pseudo-random float in [0, 1) derived from a string seed.
 * Replaces Math.random() so initial node positions are stable across renders
 * and consistent between server and client (no hydration mismatch).
 */
function hashRand(seed: string, salt: string): number {
  let h = 0;
  const str = seed + salt;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 100_000) / 100_000;
}

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  title: string;
  audience: string | null;
}

function buildSimNodes(graph: GraphJson): SimNode[] {
  return Object.entries(graph.nodes).map(([id, node]) => {
    const backlinks = graph.backlinks?.[id] ?? [];
    const radius = Math.min(3, backlinks.length) * 3 + 6;
    const color = node.audience
      ? (AUDIENCE_COLOR[node.audience] ?? DEFAULT_COLOR)
      : DEFAULT_COLOR;
    return {
      id,
      x: hashRand(id, 'x') * WIDTH,
      y: hashRand(id, 'y') * HEIGHT,
      vx: 0,
      vy: 0,
      radius,
      color,
      title: node.title,
      audience: node.audience ?? null,
    };
  });
}

function runLayout(
  nodes: SimNode[],
  links: Record<string, string[]>
): SimNode[] {
  const idxMap = new Map<string, number>();
  nodes.forEach((n, i) => idxMap.set(n.id, i));

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].vx += fx;
        nodes[i].vy += fy;
        nodes[j].vx -= fx;
        nodes[j].vy -= fy;
      }
    }
    // Attraction
    for (const [src, targets] of Object.entries(links)) {
      const si = idxMap.get(src);
      if (si === undefined) continue;
      for (const tgt of targets) {
        const ti = idxMap.get(tgt);
        if (ti === undefined) continue;
        const dx = nodes[ti].x - nodes[si].x;
        const dy = nodes[ti].y - nodes[si].y;
        nodes[si].vx += dx * ATTRACTION;
        nodes[si].vy += dy * ATTRACTION;
        nodes[ti].vx -= dx * ATTRACTION;
        nodes[ti].vy -= dy * ATTRACTION;
      }
    }
    // Integrate + dampen + clamp
    for (const n of nodes) {
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x = Math.max(n.radius, Math.min(WIDTH - n.radius, n.x + n.vx));
      n.y = Math.max(n.radius, Math.min(HEIGHT - n.radius, n.y + n.vy));
    }
  }
  return nodes;
}

function KnowledgeGraphRoute() {
  const {
    data: graph,
    isLoading: graphLoading,
    error: graphError,
  } = useKnowledgeGraph();
  const { data: health } = useKnowledgeHealth();

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    audience: string | null;
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);

  const simNodes = useMemo(() => {
    if (!graph || graph.node_count === 0) return [];
    return runLayout(buildSimNodes(graph), graph.links);
  }, [graph]);

  const edges: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    key: string;
  }> = [];
  if (graph && simNodes.length > 0) {
    const posMap = new Map(simNodes.map((n) => [n.id, n]));
    for (const [src, targets] of Object.entries(graph.links)) {
      const s = posMap.get(src);
      if (!s) continue;
      for (const tgt of targets) {
        const t = posMap.get(tgt);
        if (!t) continue;
        edges.push({
          x1: s.x,
          y1: s.y,
          x2: t.x,
          y2: t.y,
          key: `${src}->${tgt}`,
        });
      }
    }
  }

  const summaryItems = [
    {
      label: 'Nodes',
      value: graphLoading ? '…' : String(graph?.node_count ?? 0),
      detail: 'Total knowledge notes in graph',
    },
    {
      label: 'Links',
      value: graphLoading
        ? '…'
        : String(
            graph
              ? Object.values(graph.links).reduce(
                  (acc, targets) => acc + targets.length,
                  0
                )
              : 0
          ),
      detail: 'Total edges between notes',
    },
    {
      label: 'Human',
      value: graphLoading
        ? '…'
        : String(simNodes.filter((n) => n.audience === 'human').length),
      detail: 'Human-audience notes',
    },
    {
      label: 'Agent',
      value: graphLoading
        ? '…'
        : String(simNodes.filter((n) => n.audience === 'agent').length),
      detail: 'Agent-audience notes',
    },
  ] as const;

  return (
    <WorkspaceScaffold
      title="Knowledge Graph"
      subtitle="Force-directed layout of all linked vault notes."
      summaryItems={summaryItems}
      primaryTitle="Graph"
      primarySubtitle="Click a node to inspect it. Node size reflects backlink count."
      primary={
        <div className="flex flex-col gap-4">
          <KnowledgeHealthBanner
            health={health ?? null}
            loading={graphLoading}
          />

          {graphError && (
            <div
              className="rounded-[18px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300"
              role="alert"
            >
              <p className="font-medium">Failed to load the knowledge graph.</p>
              <p className="mt-1 text-xs text-red-300/70">
                {graphError.message}
              </p>
            </div>
          )}

          {graphLoading && !graph && (
            <div className="h-[600px] animate-pulse rounded-[22px] border border-white/10 bg-white/5" />
          )}

          {graphLoading && !graph && (
            <div className="h-[600px] animate-pulse rounded-[22px] border border-border bg-muted/20" />
          )}

          {!graphLoading && graph?.node_count === 0 && (
            <EmptyState
              title="No knowledge notes found."
              description="Run the build pipeline to generate the graph."
            />
          )}

          {graph && graph.node_count > 0 && (
            <div className="overflow-x-auto rounded-[22px] border border-white/15 bg-white/5 backdrop-blur-sm">
              <svg
                ref={svgRef}
                width={WIDTH}
                height={HEIGHT}
                className="block max-w-full"
              >
                <g>
                  {edges.map((e) => (
                    <line
                      key={e.key}
                      x1={e.x1}
                      y1={e.y1}
                      x2={e.x2}
                      y2={e.y2}
                      stroke="color-mix(in_srgb,var(--text-inverse)_8%,transparent)"
                      strokeWidth={1}
                    />
                  ))}
                </g>
                <g>
                  {simNodes.map((n) => (
                    <circle
                      key={n.id}
                      cx={n.x}
                      cy={n.y}
                      r={n.radius}
                      fill={n.color}
                      className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                      onMouseEnter={() =>
                        setTooltip({
                          x: n.x,
                          y: n.y,
                          title: n.title,
                          audience: n.audience,
                        })
                      }
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => {
                        setSelectedNode(n);
                        navigate({ to: '/note', search: { p: n.id } });
                      }}
                    />
                  ))}
                </g>
                {tooltip && (
                  <g>
                    <rect
                      x={Math.min(tooltip.x + 8, WIDTH - 180)}
                      y={Math.max(tooltip.y - 30, 4)}
                      width={170}
                      height={44}
                      rx={6}
                      fill="var(--vault-cod-surface-2)"
                      stroke="var(--vault-cod-border)"
                    />
                    <text
                      x={Math.min(tooltip.x + 14, WIDTH - 174)}
                      y={Math.max(tooltip.y - 12, 20)}
                      fontSize={12}
                      fill="var(--text-inverse)"
                    >
                      {tooltip.title.slice(0, 22)}
                      {tooltip.title.length > 22 ? '…' : ''}
                    </text>
                    <text
                      x={Math.min(tooltip.x + 14, WIDTH - 174)}
                      y={Math.max(tooltip.y + 6, 38)}
                      fontSize={11}
                      fill="var(--vault-cod-muted)"
                    >
                      {tooltip.audience ?? 'unknown'}
                    </text>
                  </g>
                )}
              </svg>

              <div className="flex flex-wrap items-center gap-4 border-t border-white/10 px-5 py-3">
                {Object.entries(AUDIENCE_COLOR).map(([a, c]) => (
                  <span
                    key={a}
                    className="flex items-center gap-1.5 text-xs text-white/60"
                  >
                    <svg width={10} height={10}>
                      <circle cx={5} cy={5} r={4} fill={c} />
                    </svg>
                    {a}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 text-xs text-white/60">
                  <svg width={10} height={10}>
                    <circle cx={5} cy={5} r={4} fill={DEFAULT_COLOR} />
                  </svg>
                  other
                </span>
              </div>
            </div>
          )}
        </div>
      }
      asideTitle="Selection"
      asideSubtitle="Click a node to inspect it here."
      aside={
        selectedNode ? (
          <div className="flex flex-col gap-4">
            <GlassCard variant="light" className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                Selected note
              </p>
              <h3 className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
                {selectedNode.title}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {selectedNode.audience ?? 'no audience'}
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate({ to: '/note', search: { p: selectedNode.id } })
                }
                className={cn(
                  'mt-4 rounded-full border border-[color-mix(in_srgb,var(--a-sky)_30%,transparent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-200',
                  'bg-[color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))] text-[var(--text-primary)]',
                  'hover:bg-[color-mix(in_srgb,var(--a-sky)_18%,var(--surf-elevated))]'
                )}
              >
                Open note
              </button>
            </GlassCard>
          </div>
        ) : (
          <EmptyState
            title="No node selected."
            description="Click any node in the graph to inspect it here."
          />
        )
      }
    />
  );
}
