import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRouteState = vi.hoisted(() => ({
  params: { slug: 'rent-stability-pantin' },
  search: {
    selectedId: undefined as string | undefined,
    tab: undefined as string | undefined,
    noteId: undefined as string | undefined,
    mode: undefined as 'read' | 'edit' | undefined,
    templateId: undefined as string | undefined,
    memoryTab: undefined as string | undefined,
  },
}));

const mockUseProjectSurface = vi.hoisted(() => vi.fn());

vi.mock('../../app/lib/viewer-adapter', () => ({
  useProjectSurface: (_slug: string) => mockUseProjectSurface(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useParams: () => mockRouteState.params,
    useSearch: () => mockRouteState.search,
  }),
  Link: ({
    to,
    params,
    search,
    className,
    children,
    ...props
  }: {
    to?: string;
    params?: Record<string, unknown>;
    search?: Record<string, unknown>;
    className?: string;
    children?: React.ReactNode;
  }) => (
    <a
      data-link-to={to}
      data-link-params={params ? JSON.stringify(params) : ''}
      data-link-search={search ? JSON.stringify(search) : ''}
      className={className}
      {...props}
    >
      {children}
    </a>
  ),
}));

import { Route } from '../../app/routes/project.$slug.settings';

const RouteComponent = Route.options.component as React.ComponentType;

// Default surface mock — no surface data loaded yet
const defaultSurfaceMock = () => ({
  data: undefined,
  isLoading: false,
  error: null,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('project settings surface', () => {
  beforeEach(() => {
    mockRouteState.params = { slug: 'rent-stability-pantin' };
    mockRouteState.search = {
      selectedId: undefined,
      tab: undefined,
      noteId: undefined,
      mode: undefined,
      templateId: undefined,
      memoryTab: undefined,
    };
    mockUseProjectSurface.mockImplementation(defaultSurfaceMock);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the project configuration panel with read-only fields', () => {
    render(<RouteComponent />);

    expect(screen.getByText('Project Configuration')).toBeTruthy();
    expect(screen.getByText('Project ID')).toBeTruthy();
    expect(screen.getByText('Scoring Model')).toBeTruthy();
    expect(screen.getAllByText('Source').length).toBeGreaterThan(0);
    expect(screen.getByText('Surface Scope')).toBeTruthy();
  });

  it('falls back to slug as project ID when surface data is not loaded', () => {
    render(<RouteComponent />);

    expect(screen.getAllByText('rent-stability-pantin').length).toBeGreaterThan(
      0
    );
  });

  it('shows projectId from surface data when loaded', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        projectId: 'proj-abc-123',
        executionSnapshot: { activeTasks: [{ id: 't1' }, { id: 't2' }] },
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getAllByText('proj-abc-123').length).toBeGreaterThan(0);
  });

  it('shows active task count from surface executionSnapshot', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        projectId: 'rent-stability-pantin',
        executionSnapshot: {
          activeTasks: [{ id: 't1' }, { id: 't2' }, { id: 't3' }],
        },
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getByText('3')).toBeTruthy();
  });

  it('shows the settings info panel with vault management message', () => {
    render(<RouteComponent />);

    expect(screen.getByText('Settings Info')).toBeTruthy();
    expect(
      screen.getByText('Settings are managed via the vault.')
    ).toBeTruthy();
  });
});
