import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
  }),
  useSearch: () => ({ tab: undefined, selectedId: undefined }),
}));

vi.mock('../../app/components/layout', () => ({
  WorkspaceScaffold: ({
    primary,
    aside,
  }: {
    primary?: React.ReactNode;
    aside?: React.ReactNode;
  }) => (
    <div>
      <div data-testid="scaffold-primary">{primary}</div>
      <div data-testid="scaffold-aside">{aside}</div>
    </div>
  ),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

import { useQuery } from '@tanstack/react-query';
const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

import { Route as GraphRouteModule } from '../../app/routes/graph';
const GraphComponent = GraphRouteModule.options
  .component as React.ComponentType;

const GRAPH_DATA = {
  generated: '2026-04-04T00:00:00Z',
  node_count: 42,
  edge_count: 117,
  nodes: {
    'notes/a.md': { path: 'notes/a.md', title: 'Note A', audience: 'human' },
    'notes/b.md': { path: 'notes/b.md', title: 'Note B', audience: 'agent' },
  },
  links: {},
  backlinks: {},
  by_audience: { human: ['notes/a.md'], agent: ['notes/b.md'], bubble: [] },
  unresolved_links: {},
};

describe('graph route — loading state', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    });
  });

  it('renders loading indicator', () => {
    render(<GraphComponent />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });
});

describe('graph route — empty / null data', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: false,
    });
  });

  it('renders empty state when no data', () => {
    render(<GraphComponent />);
    expect(screen.getByTestId('graph-empty-state')).toBeTruthy();
  });

  it('renders no aside content', () => {
    render(<GraphComponent />);
    expect(screen.getByTestId('scaffold-aside').childElementCount).toBe(0);
  });
});

describe('graph route — with graph data', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: GRAPH_DATA,
      isError: false,
    });
  });

  it('renders stats summary', () => {
    render(<GraphComponent />);
    expect(screen.getByTestId('graph-stats')).toBeTruthy();
  });

  it('renders node count in stats', () => {
    render(<GraphComponent />);
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders edge count in stats', () => {
    render(<GraphComponent />);
    expect(screen.getByText('117')).toBeTruthy();
  });

  it('renders node list', () => {
    render(<GraphComponent />);
    expect(screen.getByTestId('graph-node-list')).toBeTruthy();
  });

  it('keeps the aside slot empty', () => {
    render(<GraphComponent />);
    expect(screen.getByTestId('scaffold-aside').childElementCount).toBe(0);
  });
});
