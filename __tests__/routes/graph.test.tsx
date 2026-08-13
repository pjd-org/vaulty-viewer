import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

vi.mock('@tanstack/react-router', () => ({
  lazyRouteComponent: createLazyRouteComponentMock(),
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
  }),
  useSearch: () => ({ focus: undefined, selectedId: undefined }),
}));

vi.mock('../../app/components/layout', () => ({
  WorkspaceScaffold: ({
    actions,
    primary,
    aside,
  }: {
    actions?: React.ReactNode;
    primary?: React.ReactNode;
    aside?: React.ReactNode;
  }) => (
    <div>
      <div data-testid="scaffold-actions">{actions}</div>
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

beforeEach(async () => {
  await (GraphComponent as { preload?: () => Promise<void> }).preload?.();
});

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

  it('uses the same accessible inactive style for both graph modes', () => {
    render(<GraphComponent />);
    const interactive = screen.getByRole('button', { name: 'Interactive' });
    const sketch = screen.getByRole('button', { name: 'Sketch' });

    expect(interactive.getAttribute('aria-pressed')).toBe('true');
    expect(sketch.getAttribute('aria-pressed')).toBe('false');
    expect(sketch.className).toContain('text-[var(--text-primary)]');

    fireEvent.click(sketch);

    expect(sketch.getAttribute('aria-pressed')).toBe('true');
    expect(interactive.getAttribute('aria-pressed')).toBe('false');
    expect(interactive.className).toContain('text-[var(--text-primary)]');
  });

  it('keeps the aside slot empty', () => {
    render(<GraphComponent />);
    expect(screen.getByTestId('scaffold-aside').childElementCount).toBe(0);
  });
});
