import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

import type { HomeSurfacePayload } from '../../app/lib/viewer-adapter';

const mockRouteState = vi.hoisted(() => ({
  search: {} as Record<string, unknown>,
}));

const mockNavigate = vi.hoisted(() => vi.fn());
const mockEnsureQueryData = vi.hoisted(() => vi.fn());
const mockUseHomeSurface = vi.hoisted(() => vi.fn());
const mockUseWhatNowQuery = vi.hoisted(() => vi.fn());
const mockUseUpNextQuery = vi.hoisted(() => vi.fn());
const mockGetHomeSurfaceQueryOptions = vi.hoisted(() =>
  vi.fn(() => ({
    queryKey: ['viewer-adapter', 'home-surface'],
    queryFn: vi.fn(),
  }))
);
const mockApiFetch = vi.hoisted(() =>
  vi.fn(async (url: string) => {
    if (url.includes('/api/v1/tasks/next-actions')) {
      return {
        ok: true,
        json: async () => ({
          tasks: [
            {
              id: 'legacy-task-1',
              path: 'notes/tasks/legacy-task-1.md',
              title: 'Legacy focus task alpha',
              score: 7.2,
              priority: 6,
              effortScore: 4,
              focusCost: 3,
              estimatedTimeMin: 30,
              status: 'todo',
              tags: ['legacy'],
              description: 'Legacy task feed item.',
            },
          ],
        }),
      };
    }

    if (url.includes('/api/v1/sessions?status=active&limit=1')) {
      return {
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: 'session-active-1',
              status: 'active',
              title: 'Legacy active session',
              budgetMin: 45,
              startedAt: '2026-03-30T18:00:00.000Z',
              tasks: [
                {
                  id: 'legacy-task-1',
                  title: 'Legacy focus task alpha',
                  path: 'notes/tasks/legacy-task-1.md',
                  status: 'in_progress',
                },
              ],
            },
          ],
        }),
      };
    }

    if (url.includes('/api/v1/sessions?limit=3')) {
      return {
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: 'session-recent-1',
              status: 'completed',
              title: 'Legacy recent session',
              startedAt: '2026-03-30T17:00:00.000Z',
              endedAt: '2026-03-30T17:45:00.000Z',
            },
          ],
        }),
      };
    }

    return {
      ok: false,
      json: async () => ({}),
    };
  })
);

vi.mock('@tanstack/react-router', () => ({
  lazyRouteComponent: createLazyRouteComponentMock(),
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => mockRouteState.search,
  }),
  useNavigate: () => mockNavigate,
  Link: ({
    children,
    to,
    search: _search,
    ...props
  }: {
    children: React.ReactNode;
    to?: string;
    search?: Record<string, unknown>;
    [key: string]: unknown;
  }) => (
    <a href={typeof to === 'string' ? to : '#'} {...props}>
      {children}
    </a>
  ),
}));

const mockUseActiveSession = vi.hoisted(() => vi.fn());
const mockUseRecentSessions = vi.hoisted(() => vi.fn());

vi.mock('../../app/lib/viewer-adapter', () => ({
  getHomeSurfaceQueryOptions: () => mockGetHomeSurfaceQueryOptions(),
  useHomeSurface: () => mockUseHomeSurface(),
  useActiveSession: () => mockUseActiveSession(),
  useRecentSessions: () => mockUseRecentSessions(),
}));

vi.mock('../../app/lib/queries/agents', () => ({
  useWhatNowQuery: () => mockUseWhatNowQuery(),
  useUpNextQuery: () => mockUseUpNextQuery(),
}));

vi.mock('../../src/utils/api', () => ({
  apiFetch: (...args: any[]) => (mockApiFetch as any)(...args),
  UnauthenticatedError: class UnauthenticatedError extends Error {
    constructor(message?: string) {
      super(message ?? 'Unauthenticated');
      this.name = 'UnauthenticatedError';
    }
  },
}));

vi.mock('../../app/components/home', () => ({
  BestMoveCard: ({ task }: { task: { title: string } }) => (
    <div>Legacy best move: {task.title}</div>
  ),
  TaskMiniCard: ({ task }: { task: { title: string } }) => (
    <div>Legacy follow-up: {task.title}</div>
  ),
  QuickRouteGrid: () => <div>Legacy quick routes</div>,
  SessionPlannerCard: () => <div>Legacy session planner</div>,
}));

const mockVerificationPhase = vi.hoisted(() => ({
  current: 'idle' as 'idle' | 'pending' | 'resolved' | 'failed',
}));

vi.mock('../../src/store/ui', () => ({
  useUIStore: (selector: (s: unknown) => unknown) =>
    selector({
      verification: {
        phase: mockVerificationPhase.current,
        visible: false,
        pinned: false,
        latestId: null,
      },
    }),
}));

import { Route } from '../../app/routes/index';

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

const homeSurface: HomeSurfacePayload = {
  pressureBand: [
    {
      id: 'pressure-1',
      kind: 'blocker',
      title: 'Adapter pressure spike',
      summary: 'A blocked task is surfacing the highest pressure.',
      severity: 'high',
      surfacedBy: 'cod',
      sourceType: 'task',
      sourceId: 'task-1',
      surfacedAt: '2026-03-30T18:00:00.000Z',
      whySurfaced: 'This blocker should be cleared first.',
      confidence: 0.94,
      reversibility: 'high',
      allowedActions: [{ actionType: 'open_source', label: 'Open work' }],
    },
  ],
  decisionQueue: [
    {
      id: 'decision-1',
      title: 'Adapter decision one',
      summary: 'Unblock the release path.',
      actionType: 'create_task',
      surfacedBy: 'cod',
      sourceSignalIds: ['pressure-1'],
      sourceEntities: [
        { id: 'task-1', type: 'task', title: 'Legacy focus task alpha' },
      ],
      projectId: 'project-alpha',
      score: 9.4,
      scoreBreakdown: {
        urgency: 9,
        impact: 10,
        blockageRemoval: 9,
        reversibility: 8,
        confidence: 9,
      },
      whyNow: 'It removes the current blocker and restores momentum.',
      expectedEffect: 'The blocked lane becomes actionable again.',
      confidence: 0.92,
      reversibility: 'high',
      mutationRef: {
        domain: 'work',
        operation: 'create_task',
        targetId: 'task-1',
      },
    },
  ],
  verificationRail: [
    {
      id: 'verification-1',
      actionId: 'decision-1',
      startedAt: '2026-03-30T18:05:00.000Z',
      resolvedAt: '2026-03-30T18:06:00.000Z',
      status: 'success',
      improved: true,
      followUpNeeded: false,
      summary: 'Adapter verification completed.',
    },
  ],
  snapshots: {
    automation: [
      {
        id: 'snapshot-automation-1',
        kind: 'blocker',
        title: 'Automation snapshot',
        summary: 'Automation pressure remains visible.',
        severity: 'medium',
        surfacedBy: 'cod',
        sourceType: 'task',
        sourceId: 'task-1',
        surfacedAt: '2026-03-30T18:00:00.000Z',
        whySurfaced: 'The automation lane needs attention.',
        allowedActions: [],
      },
    ],
    knowledge: [
      {
        id: 'context-knowledge-1',
        contextType: 'note',
        title: 'Knowledge context item',
        summary: 'Relevant knowledge context.',
        sourceId: 'note-1',
        reasonSelected: 'It is directly linked to the current pressure.',
        freshness: 'fresh',
        linkedEntities: [],
      },
    ],
    portfolio: [
      {
        id: 'snapshot-portfolio-1',
        kind: 'portfolio',
        title: 'Portfolio snapshot',
        summary: 'Portfolio pressure remains visible.',
        severity: 'low',
        surfacedBy: 'cod',
        sourceType: 'project',
        sourceId: 'project-alpha',
        surfacedAt: '2026-03-30T18:00:00.000Z',
        whySurfaced: 'Portfolio impact is present.',
        allowedActions: [],
      },
    ],
    bubble: [],
    health: [],
  },
  contextTail: [
    {
      id: 'context-tail-1',
      contextType: 'spec',
      title: 'Adapter context tail item',
      summary: 'Latest COD-selected context for the mission control view.',
      sourceId: 'note-2',
      reasonSelected: 'It is adjacent to the highest-pressure work.',
      freshness: 'fresh',
      linkedEntities: [],
    },
  ],
  tasks: [],
};

describe('home adapter wiring', () => {
  beforeEach(() => {
    mockRouteState.search = {};
    mockNavigate.mockReset();
    mockEnsureQueryData.mockReset();
    mockEnsureQueryData.mockResolvedValue(undefined);
    mockGetHomeSurfaceQueryOptions.mockClear();
    mockVerificationPhase.current = 'idle';
    mockUseHomeSurface.mockReset();
    mockUseHomeSurface.mockReturnValue({
      data: homeSurface,
      isLoading: false,
      error: null,
      isError: false,
    });
    mockUseActiveSession.mockReset();
    mockUseActiveSession.mockReturnValue({
      data: null,
      isLoading: false,
    });
    mockUseRecentSessions.mockReset();
    mockUseRecentSessions.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUseWhatNowQuery.mockReset();
    mockUseWhatNowQuery.mockReturnValue({
      data: {
        best_task_id: 'legacy-task-1',
        rationale: 'Legacy coaching note',
        expected_outcome: 'Legacy outcome',
        why_now: 'Legacy why now',
      },
      isError: false,
    });
    mockUseUpNextQuery.mockReset();
    mockUseUpNextQuery.mockReturnValue({
      data: {
        flow_label: 'Legacy flow',
        steps: [],
      },
      isError: false,
    });
    mockApiFetch.mockClear();
  });

  it('preloads the home adapter surface in the route loader', async () => {
    expect(typeof Route.options.loader).toBe('function');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (Route.options.loader as any)?.({
      context: {
        queryClient: {
          ensureQueryData: mockEnsureQueryData,
        },
      },
    } as never);

    expect(mockEnsureQueryData).toHaveBeenCalledTimes(1);
    expect(mockEnsureQueryData.mock.calls[0]?.[0]).toMatchObject({
      queryKey: ['viewer-adapter', 'home-surface'],
    });
  });

  it('renders the home adapter surface from the route component', () => {
    renderWithClient(<RouteComponent />);

    expect(mockUseHomeSurface).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Pressure Band')).toBeTruthy();
    expect(screen.getByText('Decision Queue')).toBeTruthy();
    expect(screen.getByText('Verification Rail')).toBeTruthy();
    expect(screen.getByText('Snapshot Grid')).toBeTruthy();
    expect(screen.getByText('Context Tail')).toBeTruthy();
    expect(
      screen.getByText('Adapter pressure spike', { selector: 'h3' })
    ).toBeTruthy();
    expect(
      screen.getByText('Adapter decision one', { selector: 'h3' })
    ).toBeTruthy();
    expect(
      screen.getByText('Adapter context tail item', { selector: 'p' })
    ).toBeTruthy();
  });

  it('shows a pending indicator when verification phase is pending', () => {
    mockVerificationPhase.current = 'pending';
    renderWithClient(<RouteComponent />);
    expect(screen.getByText('Verifying…')).toBeTruthy();
  });

  it('shows a failed indicator when verification phase is failed', () => {
    mockVerificationPhase.current = 'failed';
    renderWithClient(<RouteComponent />);
    expect(screen.getByText('Verification failed.')).toBeTruthy();
  });
});
