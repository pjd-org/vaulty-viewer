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

import { Route } from '../../app/routes/project.$slug.dependencies';

const RouteComponent = Route.options.component as React.ComponentType;

beforeEach(async () => {
  await (RouteComponent as { preload?: () => Promise<void> }).preload?.();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('project dependencies surface', () => {
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

  it('shows empty state when no dependency signals are present', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        dependencyRiskSignals: [],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getByText('No dependency signals surfaced.')).toBeTruthy();
    expect(screen.getByText('Dependency Signals')).toBeTruthy();
  });

  it('renders dependency signals from adapter data', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        dependencyRiskSignals: [
          {
            id: 'dep-1',
            title: 'Missing upstream data feed',
            summary: 'Feed has been silent for 48h.',
            kind: 'blocker',
            severity: 'critical',
            whySurfaced: 'No events received in 48 hours.',
          },
          {
            id: 'dep-2',
            title: 'Slow downstream consumer',
            summary: 'Consumer lag exceeds threshold.',
            kind: 'risk',
            severity: 'high',
            whySurfaced: 'Consumer lag at 2000ms.',
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(
      screen.getAllByText('Missing upstream data feed').length
    ).toBeGreaterThan(0);
    expect(screen.getByText('Slow downstream consumer')).toBeTruthy();
    expect(screen.getByText('Dependency Signals')).toBeTruthy();
  });

  it('renders severity partition bar with correct segment labels', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        dependencyRiskSignals: [
          {
            id: 'dep-c1',
            title: 'Critical blocker',
            summary: 'Blocking everything.',
            kind: 'blocker',
            severity: 'critical',
            whySurfaced: 'Hard block.',
          },
          {
            id: 'dep-h1',
            title: 'High blocker',
            summary: 'Slowing things down.',
            kind: 'blocker',
            severity: 'high',
            whySurfaced: 'Soft block.',
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getByText('Severity Breakdown')).toBeTruthy();
    expect(screen.getAllByText('Critical').length).toBeGreaterThan(0);
    expect(screen.getAllByText('High').length).toBeGreaterThan(0);
  });

  it('shows selected signal detail when selectedId matches a signal', () => {
    mockRouteState.search = { ...mockRouteState.search, selectedId: 'dep-1' };

    mockUseProjectSurface.mockReturnValue({
      data: {
        dependencyRiskSignals: [
          {
            id: 'dep-1',
            title: 'Missing upstream data feed',
            summary: 'Feed has been silent for 48h.',
            kind: 'blocker',
            severity: 'critical',
            whySurfaced: 'No events received in 48 hours.',
          },
          {
            id: 'dep-2',
            title: 'Slow downstream consumer',
            summary: 'Consumer lag exceeds threshold.',
            kind: 'risk',
            severity: 'high',
            whySurfaced: 'Consumer lag at 2000ms.',
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getByText('Selected Signal')).toBeTruthy();
    expect(screen.getByText('No events received in 48 hours.')).toBeTruthy();
  });

  it('renders all dependencyRiskSignals (API is now blockers-only)', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        dependencyRiskSignals: [
          {
            id: 'dep-blocker-1',
            title: 'Blocked on API key',
            summary: 'External service key not yet provisioned.',
            kind: 'blocker',
            severity: 'critical',
            whySurfaced: 'External blocker detected.',
          },
          {
            id: 'dep-blocker-2',
            title: 'Waiting on legal sign-off',
            summary: 'Contract review pending.',
            kind: 'blocker',
            severity: 'high',
            whySurfaced: 'Legal review is blocking deployment.',
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getAllByText('Blocked on API key').length).toBeGreaterThan(0);
    expect(screen.getByText('Waiting on legal sign-off')).toBeTruthy();
    // Both stats equal the total count since all items are blockers
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });
});
