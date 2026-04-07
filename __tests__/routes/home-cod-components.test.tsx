/**
 * home-cod-components.test.tsx
 *
 * Verifies that the home route uses CodSignalRow, CodActionRow, and
 * BestMoveCard components in the appropriate slots.
 *
 * - CodSignalRow: renders metadata inside pressure-band cards
 * - CodActionRow: renders action controls inside decision-queue cards
 * - BestMoveCard: renders when surface.tasks has a top task
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HomeSurfacePayload } from '../../app/lib/viewer-adapter';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRouteState = vi.hoisted(() => ({
  search: {} as Record<string, unknown>,
}));
const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseHomeSurface = vi.hoisted(() => vi.fn());
const mockGetHomeSurfaceQueryOptions = vi.hoisted(() =>
  vi.fn(() => ({
    queryKey: ['viewer-adapter', 'home-surface'],
    queryFn: vi.fn(),
  }))
);

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => mockRouteState.search,
  }),
  useNavigate: () => mockNavigate,
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

vi.mock('../../app/lib/viewer-adapter', () => ({
  getHomeSurfaceQueryOptions: () => mockGetHomeSurfaceQueryOptions(),
  useHomeSurface: () => mockUseHomeSurface(),
  useActiveSession: () => ({ data: null, isLoading: false }),
  useRecentSessions: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../app/lib/queries/agents', () => ({
  useWhatNowQuery: () => ({ data: null, isError: false }),
  useUpNextQuery: () => ({ data: null, isError: false }),
}));

vi.mock('../../src/utils/api', () => ({
  apiFetch: vi.fn(async () => ({ ok: false, json: async () => ({}) })),
  UnauthenticatedError: class UnauthenticatedError extends Error {
    constructor(message?: string) {
      super(message ?? 'Unauthenticated');
      this.name = 'UnauthenticatedError';
    }
  },
}));

vi.mock('../../src/store/ui', () => ({
  useUIStore: (selector: (s: unknown) => unknown) =>
    selector({
      verification: {
        phase: 'idle',
        visible: false,
        pinned: false,
        latestId: null,
      },
    }),
}));

// ---------------------------------------------------------------------------
// Import route under test AFTER mocks
// ---------------------------------------------------------------------------

import { Route } from '../../app/routes/index';

const RouteComponent = Route.options.component as React.ComponentType;

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const surfaceWithTask: HomeSurfacePayload = {
  pressureBand: [
    {
      id: 'pressure-1',
      kind: 'blocker',
      title: 'Unblock release path',
      summary: 'A blocked task is surfacing pressure.',
      severity: 'high',
      surfacedBy: 'cod',
      sourceType: 'task',
      sourceId: 'task-blocker',
      surfacedAt: '2026-04-01T10:00:00.000Z',
      whySurfaced: 'This blocker should be cleared first.',
      confidence: 0.94,
      reversibility: 'high',
      allowedActions: [],
    },
  ],
  decisionQueue: [
    {
      id: 'decision-1',
      title: 'Execute best move',
      summary: 'Top COD recommendation.',
      actionType: 'create_task',
      surfacedBy: 'cod',
      sourceSignalIds: ['pressure-1'],
      sourceEntities: [],
      projectId: 'project-alpha',
      score: 9.0,
      scoreBreakdown: {
        urgency: 9,
        impact: 9,
        blockageRemoval: 8,
        reversibility: 9,
        confidence: 9,
      },
      whyNow: 'High urgency.',
      expectedEffect: 'Unblocks the lane.',
      confidence: 0.91,
      reversibility: 'high',
      mutationRef: {
        domain: 'work',
        operation: 'create_task',
        targetId: 'task-y',
      },
    },
  ],
  verificationRail: [],
  snapshots: {
    automation: [],
    knowledge: [],
    portfolio: [],
    bubble: [],
    health: [],
  },
  contextTail: [],
  tasks: [
    {
      id: 'task-x',
      path: 'notes/tasks/task-x.md',
      title: 'Top recommended task',
      score: 9.0,
      priority: 9,
      effortScore: 4,
      focusCost: 3,
      estimatedTimeMin: 30,
      status: 'todo',
      tags: [],
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('home COD component wiring', () => {
  beforeEach(() => {
    mockRouteState.search = {};
    mockNavigate.mockReset();
    mockUseHomeSurface.mockReturnValue({
      data: surfaceWithTask,
      isLoading: false,
      error: null,
      isError: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders CodSignalRow metadata inside pressure band cards', () => {
    renderWithClient(<RouteComponent />);
    // CodSignalRow renders label/value pairs — multiple "Confidence" elements may exist
    expect(screen.getAllByText('Source type').length).toBeGreaterThan(0);
    expect(screen.getAllByText('task').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Confidence').length).toBeGreaterThan(0);
  });

  it('renders CodActionRow inside decision queue cards', () => {
    renderWithClient(<RouteComponent />);
    // CodActionRow renders action labels as buttons/links
    expect(screen.getByText('Inspect in Actions')).toBeTruthy();
  });

  it('renders BestMoveCard when surface.tasks has items', () => {
    renderWithClient(<RouteComponent />);
    // BestMoveCard renders the top task title
    expect(screen.getByText('Top recommended task')).toBeTruthy();
  });
});
