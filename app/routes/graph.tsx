import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import { graphSearchParams } from '../../src/lib/routes/search-params';
import {
  useKnowledgeGraph,
  type GraphJson,
  type GraphNode,
} from '../lib/viewer-adapter';

export const Route = createFileRoute('/graph')({
  validateSearch: graphSearchParams,
  component: GraphRoute,
});

function GraphStats({ data }: { data: GraphJson }) {
  const byAudience = data.by_audience ?? { human: [], agent: [], bubble: [] };
  const humanCount = byAudience.human.length;
  const agentCount = byAudience.agent.length;
  const bubbleCount = byAudience.bubble.length;

  return (
    <div
      data-testid="graph-stats"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3"
    >
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">Nodes</p>
        <p className="text-2xl font-semibold tabular-nums">{data.node_count}</p>
      </div>
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">Edges</p>
        <p className="text-2xl font-semibold tabular-nums">{data.edge_count}</p>
      </div>
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">Human</p>
        <p className="text-2xl font-semibold tabular-nums">{humanCount}</p>
      </div>
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">Agent</p>
        <p className="text-2xl font-semibold tabular-nums">{agentCount}</p>
      </div>
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">Bubble</p>
        <p className="text-2xl font-semibold tabular-nums">{bubbleCount}</p>
      </div>
    </div>
  );
}

function GraphNodeList({ nodes }: { nodes: Record<string, GraphNode> }) {
  const entries = Object.entries(nodes);
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">No nodes indexed.</p>
    );
  }
  return (
    <table
      data-testid="graph-node-list"
      className="w-full text-sm border-collapse"
    >
      <thead>
        <tr className="border-b border-border text-left">
          <th className="py-2 pr-4 font-medium text-muted-foreground">Title</th>
          <th className="py-2 pr-4 font-medium text-muted-foreground">
            Audience
          </th>
          <th className="py-2 font-medium text-muted-foreground">Path</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([path, node]) => (
          <tr
            key={path}
            className="border-b border-border/50 hover:bg-muted/40 transition-colors"
          >
            <td className="py-2 pr-4">{node.title ?? '—'}</td>
            <td className="py-2 pr-4 text-xs text-muted-foreground">
              {node.audience ?? '—'}
            </td>
            <td className="py-2 font-mono text-xs text-muted-foreground truncate max-w-xs">
              {path}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GraphRoute() {
  const { data, isLoading } = useKnowledgeGraph();

  return (
    <WorkspaceScaffold
      title="Graph"
      subtitle="Deep-context lane for knowledge, dependency, incident, and memory graphs."
      summaryItems={[
        {
          label: 'Nodes',
          value: data ? String(data.node_count) : '—',
          detail: 'Indexed notes',
        },
        {
          label: 'Edges',
          value: data ? String(data.edge_count) : '—',
          detail: 'Links between notes',
        },
        {
          label: 'Human',
          value: data ? String(data.by_audience?.human.length ?? 0) : '—',
          detail: 'Human-audience nodes',
        },
        {
          label: 'Agent',
          value: data ? String(data.by_audience?.agent.length ?? 0) : '—',
          detail: 'Agent-audience nodes',
        },
      ]}
      primaryTitle="Knowledge Graph"
      primarySubtitle="Node statistics and full node index."
      primary={
        isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
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
          <div className="space-y-6">
            <GraphStats data={data} />
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Nodes</h3>
              <GraphNodeList nodes={data.nodes} />
            </div>
          </div>
        )
      }
      asideTitle="Entity Inspector"
      asideSubtitle="Selected node, path, and linked actions."
      aside={
        <div data-testid="graph-aside-empty-state" className="space-y-2">
          <p className="text-sm font-medium text-neutral-600">
            No node selected.
          </p>
          <p className="text-xs text-neutral-400">
            Select a node to inspect its links and metadata here.
          </p>
        </div>
      }
    />
  );
}
