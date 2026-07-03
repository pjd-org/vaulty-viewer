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

import { Route } from '../../app/routes/project.$slug.risks';

const RouteComponent = Route.options.component as React.ComponentType;

beforeEach(async () => {
  await (RouteComponent as { preload?: () => Promise<void> }).preload?.();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('project risks surface', () => {
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

  it('shows empty state when no risks are present', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        pressureBand: [],
        dependencyRiskSignals: [],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getByText('No risks surfaced.')).toBeTruthy();
    expect(screen.getByText('Risk Register')).toBeTruthy();
  });

  it('renders risks from pressureBand only (dependencyRiskSignals excluded)', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        pressureBand: [
          {
            id: 'pressure-1',
            title: 'Overdue milestone',
            summary: 'Milestone was due 3 days ago.',
            kind: 'deadline',
            severity: 'critical',
            whySurfaced: 'Due date passed without completion.',
            confidence: 0.92,
          },
          {
            id: 'pressure-2',
            title: 'High-effort task stalled',
            summary: 'No progress logged in 72h.',
            kind: 'stale',
            severity: 'high',
            whySurfaced: 'Task has not been updated recently.',
          },
        ],
        dependencyRiskSignals: [
          {
            id: 'dep-1',
            title: 'Missing upstream feed',
            summary: 'Feed silent for 48h.',
            kind: 'blocker',
            severity: 'high',
            whySurfaced: 'No events for 48 hours.',
          },
        ],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    // Only pressureBand items render in the risks route
    expect(screen.getAllByText('Overdue milestone').length).toBeGreaterThan(0);
    expect(screen.getByText('High-effort task stalled')).toBeTruthy();
    // dependencyRiskSignals items do NOT appear here
    expect(screen.queryByText('Missing upstream feed')).toBeNull();
    expect(screen.getByText('Risk Register')).toBeTruthy();
  });

  it('renders severity partition bar with correct segment labels', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        pressureBand: [
          {
            id: 'p-1',
            title: 'Critical risk',
            summary: 'Very bad.',
            kind: 'deadline',
            severity: 'critical',
            whySurfaced: 'Late.',
          },
          {
            id: 'p-2',
            title: 'High risk',
            summary: 'Bad.',
            kind: 'stale',
            severity: 'high',
            whySurfaced: 'Stale.',
          },
          {
            id: 'p-3',
            title: 'Low risk',
            summary: 'Minor.',
            kind: 'info',
            severity: 'low',
            whySurfaced: 'Minor signal.',
          },
        ],
        dependencyRiskSignals: [],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getByText('Severity Breakdown')).toBeTruthy();
    expect(screen.getAllByText('Critical').length).toBeGreaterThan(0);
    expect(screen.getAllByText('High').length).toBeGreaterThan(0);
    expect(screen.getByText('Other')).toBeTruthy();
  });

  it('shows selected risk detail when selectedId matches a risk', () => {
    mockRouteState.search = {
      ...mockRouteState.search,
      selectedId: 'pressure-1',
    };

    mockUseProjectSurface.mockReturnValue({
      data: {
        pressureBand: [
          {
            id: 'pressure-1',
            title: 'Overdue milestone',
            summary: 'Milestone was due 3 days ago.',
            kind: 'deadline',
            severity: 'critical',
            whySurfaced: 'Due date passed without completion.',
            confidence: 0.92,
          },
        ],
        dependencyRiskSignals: [],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getByText('Selected Risk')).toBeTruthy();
    expect(
      screen.getByText('Due date passed without completion.')
    ).toBeTruthy();
    expect(screen.getByText('92%')).toBeTruthy();
  });
});
