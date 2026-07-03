/**
 * knowledge-scaffold.test.tsx
 *
 * Verifies that KnowledgeRoute renders via WorkspaceScaffold:
 *   - Title "Knowledge" is present
 *   - Summary row items are rendered
 *   - Quick-link buttons (Search, Graph) are present
 *   - KnowledgeWorkspaceSurface is mounted inside the primary slot
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRouteState = vi.hoisted(() => ({
  search: {} as Record<string, unknown>,
}));

vi.mock('@tanstack/react-router', () => ({
  lazyRouteComponent: createLazyRouteComponentMock(),
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => mockRouteState.search,
  }),
  useNavigate: () => vi.fn(),
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to?: string;
    [key: string]: unknown;
  }) => (
    <a href={typeof to === 'string' ? to : '#'} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('../../app/components/knowledge/KnowledgeWorkspaceSurface', () => ({
  KnowledgeWorkspaceSurface: () => (
    <div data-testid="knowledge-workspace-surface" />
  ),
}));

// ---------------------------------------------------------------------------
// Import route under test AFTER mocks
// ---------------------------------------------------------------------------

import { Route } from '../../app/routes/knowledge';

const RouteComponent = Route.options.component as React.ComponentType;

beforeEach(async () => {
  await (RouteComponent as { preload?: () => Promise<void> }).preload?.();
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('knowledge route scaffold', () => {
  beforeEach(() => {
    mockRouteState.search = {};
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the Knowledge title via WorkspaceScaffold', () => {
    renderWithClient(<RouteComponent />);
    expect(screen.getByText('Knowledge')).toBeTruthy();
  });

  it('renders summary row items', () => {
    renderWithClient(<RouteComponent />);
    // WorkspaceScaffold renders SummaryRow which shows these labels
    expect(screen.getByText('Context')).toBeTruthy();
    expect(screen.getByText('Entities')).toBeTruthy();
  });

  it('renders Search notes and Open graph quick-links', () => {
    renderWithClient(<RouteComponent />);
    expect(screen.getByText('Search notes')).toBeTruthy();
    expect(screen.getByText('Open graph')).toBeTruthy();
  });

  it('mounts KnowledgeWorkspaceSurface in the primary slot', () => {
    renderWithClient(<RouteComponent />);
    expect(screen.getByTestId('knowledge-workspace-surface')).toBeTruthy();
  });
});
