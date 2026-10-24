import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';

import type { ActionsSurfacePayload } from '../../app/lib/viewer-adapter';

const mockRouteState = vi.hoisted(() => ({
  search: {
    sort: 'impact' as
      | 'urgency'
      | 'impact'
      | 'confidence'
      | 'source'
      | 'reversibility'
      | undefined,
    simulatableOnly: true as boolean | undefined,
    selectedId: 'action-1' as string | undefined,
  },
}));

const mockNavigate = vi.hoisted(() => vi.fn());
const mockEnsureQueryData = vi.hoisted(() => vi.fn());
const mockUseActionsSurface = vi.hoisted(() => vi.fn());
const mockGetActionsSurfaceQueryOptions = vi.hoisted(() =>
  vi.fn(() => ({
    queryKey: ['viewer-adapter', 'actions-surface'],
    queryFn: vi.fn(),
  }))
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
  getActionsSurfaceQueryOptions: () => mockGetActionsSurfaceQueryOptions(),
  useActionsSurface: () => mockUseActionsSurface(),
  invalidateQueriesForDomain: vi.fn(),
}));

vi.mock('../../app/components/layout', () => ({
  WorkspaceScaffold: ({
    title,
    subtitle,
    actions,
    primaryTitle,
    primarySubtitle,
    primary,
    asideTitle,
    asideSubtitle,
    aside,
  }: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    primaryTitle: string;
    primarySubtitle?: string;
    primary: React.ReactNode;
    asideTitle: string;
    asideSubtitle?: string;
    aside: React.ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      <div data-testid="actions-toolbar">{actions}</div>
      <div>
        <h2>{primaryTitle}</h2>
        {primarySubtitle ? <p>{primarySubtitle}</p> : null}
        {primary}
      </div>
      <aside>
        <h2>{asideTitle}</h2>
        {asideSubtitle ? <p>{asideSubtitle}</p> : null}
        {aside}
      </aside>
    </section>
  ),
}));

vi.mock('../../app/components/ui', async () => {
  const actual = await vi.importActual<
    typeof import('../../app/components/ui')
  >('../../app/components/ui');

  return {
    ...actual,
    EmptyState: ({
      title,
      description,
    }: {
      title: string;
      description?: string;
    }) => (
      <div>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
    ),
  };
});

const mockUpdateTaskStatus = vi.hoisted(() =>
  vi.fn(() => Promise.resolve(true))
);
const mockFetchTaskMetrics = vi.hoisted(() =>
  vi.fn(() => Promise.resolve(null))
);

vi.mock('../../app/lib/api/tasks', () => ({
  updateTaskStatus: (...args: any[]) => (mockUpdateTaskStatus as any)(...args),
  fetchTaskMetrics: (...args: any[]) => (mockFetchTaskMetrics as any)(...args),
}));

const mockVerificationPhase = vi.hoisted(() => ({
  current: 'idle' as 'idle' | 'pending' | 'resolved' | 'failed',
}));
const mockSetVerificationPhase = vi.hoisted(() => vi.fn());
const mockActionsSimulationPreviewOpen = vi.hoisted(() => ({ current: false }));

vi.mock('../../src/store/ui', () => ({
  useUIStore: (selector: (s: unknown) => unknown) =>
    selector({
      verification: {
        phase: mockVerificationPhase.current,
        visible: false,
        pinned: false,
        latestId: null,
      },
      actions: {
        simulationPreviewOpen: mockActionsSimulationPreviewOpen.current,
      },
      setVerificationPhase: mockSetVerificationPhase,
    }),
}));

import { Route } from '../../app/routes/actions';

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

const actionsSurface: ActionsSurfacePayload = {
  recommendations: [
    {
      id: 'action-1',
      title: 'Unblock deploy pipeline',
      summary:
        'Restore the failing pipeline so the release path is usable again.',
      actionType: 'create_task',
      surfacedBy: 'cod',
      sourceSignalIds: ['signal-1', 'signal-2'],
      sourceEntities: [
        { id: 'task-1', type: 'task', title: 'Legacy focus task alpha' },
      ],
      projectId: 'rent-stability-pantin',
      score: 8.6,
      scoreBreakdown: {
        urgency: 9,
        impact: 10,
        blockageRemoval: 9,
        reversibility: 8,
        confidence: 9,
      },
      whyNow:
        'Resolving this item should remove immediate friction in the queue.',
      expectedEffect: 'Progress moves forward for rent-stability-pantin.',
      confidence: 0.92,
      reversibility: 'high',
      mutationRef: {
        domain: 'work',
        operation: 'create_task',
        targetId: 'task-1',
      },
      taskPath: 'notes/tasks/task-1.md',
    },
    {
      id: 'action-2',
      title: 'Polish project shell',
      summary: 'Tighten shell polish after the routing cutover.',
      actionType: 'create_task',
      surfacedBy: 'cod',
      sourceSignalIds: ['signal-3'],
      sourceEntities: [
        { id: 'task-2', type: 'task', title: 'Legacy follow-up task beta' },
      ],
      score: 5.2,
      scoreBreakdown: {
        urgency: 6,
        impact: 5,
        blockageRemoval: 4,
        reversibility: 2,
        confidence: 5,
      },
      whyNow: 'It keeps the shell move steady.',
      expectedEffect: 'The shell gets a little tighter.',
      confidence: 0.48,
      reversibility: 'low',
      mutationRef: {
        domain: 'work',
        operation: 'create_task',
        targetId: 'task-2',
      },
    },
  ],
  verificationRail: [
    {
      id: 'verification-1',
      actionId: 'action-1',
      startedAt: '2026-03-30T18:05:00.000Z',
      resolvedAt: '2026-03-30T18:06:00.000Z',
      status: 'success',
      improved: true,
      followUpNeeded: false,
      summary: 'Adapter verification completed.',
    },
  ],
};


describe('actions route — guardrail empty state', () => {
  beforeEach(() => {
    // The shared scaffold installs a populated surface; clear it so each case
    // controls its own data.
    mockUseActionsSurface.mockReset();
  });

  it('names the guardrail when COD reports status blocked', () => {
    mockUseActionsSurface.mockReturnValue({
      data: {
        recommendations: [],
        verificationRail: [],
        meta: {
          mode: 'cod',
          humanState: {
            status: 'blocked',
            warnings: ['HARD_STOP active (23:00 - 07:00). Work blocked for 7h 43m.'],
            durationCapMin: 0,
          },
        },
      },
      isLoading: false,
      error: null,
    });

    renderWithClient(<RouteComponent />);

    expect(screen.getByText('Work is paused by a guardrail.')).toBeTruthy();
    expect(screen.getByText(/HARD_STOP active \(23:00 - 07:00\)/)).toBeTruthy();
    expect(screen.queryByText('No actions are surfaced right now.')).toBeNull();
  });

  it('falls back to the generic copy when no guardrail is reported', () => {
    mockUseActionsSurface.mockReturnValue({
      data: { recommendations: [], verificationRail: [], meta: { mode: 'cod' } },
      isLoading: false,
      error: null,
    });

    const { container } = renderWithClient(<RouteComponent />);

    expect(screen.getByText('No actions are surfaced right now.')).toBeTruthy();
    // Scope to this render's container: a prior test's DOM can linger, and
    // document-wide queries would see its guardrail heading.
    const headings = Array.from(
      container.querySelectorAll('h3')
    ).map((h) => h.textContent?.trim() ?? '');
    expect(headings).not.toContain('Work is paused by a guardrail.');
  });
});
