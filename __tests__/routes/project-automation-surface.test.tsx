import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

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
  lazyRouteComponent: createLazyRouteComponentMock(),
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

import { Route } from '../../app/routes/project.$slug.automation';

const RouteComponent = Route.options.component as React.ComponentType;

beforeEach(async () => {
  await (RouteComponent as { preload?: () => Promise<void> }).preload?.();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('project automation surface', () => {
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
  });

  afterEach(() => {
    cleanup();
  });

  it('shows empty state when no automation items are present', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        executionSnapshot: {
          activePipelines: [],
          activeRunners: [],
          primaryAgentJobs: [],
          scheduleItems: [],
        },
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getByText('No automation items surfaced.')).toBeTruthy();
    expect(screen.getByText('Automation Queue')).toBeTruthy();
  });

  it('renders automation items from adapter data', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        executionSnapshot: {
          activePipelines: [
            {
              id: 'pipe-1',
              title: 'CI Deploy Pipeline',
              type: 'pipeline',
              status: 'running',
            },
          ],
          activeRunners: [
            {
              id: 'runner-1',
              title: 'Build Runner Alpha',
              type: 'runner',
              status: 'idle',
            },
          ],
          primaryAgentJobs: [],
          scheduleItems: [],
        },
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getAllByText('CI Deploy Pipeline').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Build Runner Alpha').length).toBeGreaterThan(0);
    expect(screen.getByText('Automation Queue')).toBeTruthy();
  });

  it('shows selected item detail when selectedId matches an item', () => {
    mockRouteState.search = { ...mockRouteState.search, selectedId: 'pipe-1' };

    mockUseProjectSurface.mockReturnValue({
      data: {
        executionSnapshot: {
          activePipelines: [
            {
              id: 'pipe-1',
              title: 'CI Deploy Pipeline',
              type: 'pipeline',
              status: 'running',
            },
            {
              id: 'pipe-2',
              title: 'Nightly Sync',
              type: 'pipeline',
              status: 'queued',
            },
          ],
          activeRunners: [],
          primaryAgentJobs: [],
          scheduleItems: [],
        },
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getByText('Selected Item')).toBeTruthy();
    const detailHeadings = screen.getAllByText('CI Deploy Pipeline');
    expect(detailHeadings.length).toBeGreaterThan(0);
  });
});
