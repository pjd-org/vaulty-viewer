import React, { useMemo, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  useKnowledgeGraph,
  useKnowledgeHealth,
  type GraphJson,
} from '../lib/viewer-adapter';
import KnowledgeHealthBanner from '../../src/components/KnowledgeHealthBanner';

export const Route = createFileRoute('/knowledge/graph')({
  component: KnowledgeGraphRoute,
});

const AUDIENCE_COLOR: Record<string, string> = {
  human: '#3b82f6',
  agent: '#22c55e',
  bubble: '#eab308',
};
const DEFAULT_COLOR = '#6b7280';

const WIDTH = 900;
const HEIGHT = 600;
const ITERATIONS = 80;
const REPULSION = 5000;
const ATTRACTION = 0.05;
const DAMPING = 0.85;

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
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
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

  return (
    <main className="page">
      <header className="page-header">
        <h1>Knowledge Graph</h1>
      </header>

      <KnowledgeHealthBanner health={health ?? null} loading={graphLoading} />

      {graphError && (
        <div className="knowledge-graph__error" role="alert">
          <p>Failed to load the knowledge graph.</p>
          <p className="knowledge-graph__error-detail">{graphError.message}</p>
        </div>
      )}

      {graph?.node_count === 0 && (
        <p className="knowledge-graph__empty">
          No knowledge notes found. Run the build pipeline to generate the
          graph.
        </p>
      )}

      {graph && graph.node_count > 0 && (
        <div className="knowledge-graph__container">
          <svg
            ref={svgRef}
            width={WIDTH}
            height={HEIGHT}
            className="knowledge-graph__svg border border-neutral-200 rounded-lg bg-neutral-50 block max-w-full"
          >
            <g className="edges">
              {edges.map((e) => (
                <line
                  key={e.key}
                  x1={e.x1}
                  y1={e.y1}
                  x2={e.x2}
                  y2={e.y2}
                  stroke="#d1d5db"
                  strokeWidth={1}
                />
              ))}
            </g>
            <g className="nodes">
              {simNodes.map((n) => (
                <circle
                  key={n.id}
                  cx={n.x}
                  cy={n.y}
                  r={n.radius}
                  fill={n.color}
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setTooltip({
                      x: n.x,
                      y: n.y,
                      title: n.title,
                      audience: n.audience,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => navigate({ to: '/note', search: { p: n.id } })}
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
                  rx={4}
                  fill="white"
                  stroke="#d1d5db"
                />
                <text
                  x={Math.min(tooltip.x + 14, WIDTH - 174)}
                  y={Math.max(tooltip.y - 12, 20)}
                  fontSize={12}
                  fill="#111827"
                >
                  {tooltip.title.slice(0, 22)}
                  {tooltip.title.length > 22 ? '…' : ''}
                </text>
                <text
                  x={Math.min(tooltip.x + 14, WIDTH - 174)}
                  y={Math.max(tooltip.y + 6, 38)}
                  fontSize={11}
                  fill="#6b7280"
                >
                  {tooltip.audience ?? 'unknown'}
                </text>
              </g>
            )}
          </svg>

          <div className="knowledge-graph__legend">
            {Object.entries(AUDIENCE_COLOR).map(([a, c]) => (
              <span key={a} className="knowledge-graph__legend-item">
                <svg width={12} height={12}>
                  <circle cx={6} cy={6} r={5} fill={c} />
                </svg>
                {a}
              </span>
            ))}
            <span className="knowledge-graph__legend-item">
              <svg width={12} height={12}>
                <circle cx={6} cy={6} r={5} fill={DEFAULT_COLOR} />
              </svg>
              other
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
