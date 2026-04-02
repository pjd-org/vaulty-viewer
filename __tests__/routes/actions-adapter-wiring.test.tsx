import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => mockRouteState.search,
  }),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../app/lib/viewer-adapter', () => ({
  getActionsSurfaceQueryOptions: () => mockGetActionsSurfaceQueryOptions(),
  useActionsSurface: () => mockUseActionsSurface(),
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

vi.mock('../../app/components/ui', () => ({
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

describe('actions adapter wiring', () => {
  beforeEach(() => {
    mockRouteState.search = {
      sort: 'impact',
      simulatableOnly: true,
      selectedId: 'action-1',
    };
    mockNavigate.mockReset();
    mockEnsureQueryData.mockReset();
    mockGetActionsSurfaceQueryOptions.mockClear();
    mockVerificationPhase.current = 'idle';
    mockActionsSimulationPreviewOpen.current = false;
    mockSetVerificationPhase.mockReset();
    mockUseActionsSurface.mockReturnValue({
      data: actionsSurface,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the action toolbar and explainable detail rail', () => {
    render(<RouteComponent />);

    expect(screen.getByRole('heading', { name: 'Actions' })).toBeTruthy();
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe(
      'impact'
    );
    expect(
      (
        screen.getByRole('checkbox', {
          name: 'Simulatable only',
        }) as HTMLInputElement
      ).checked
    ).toBe(true);
    expect(screen.getByText('Showing 1 of 2 recommendations')).toBeTruthy();
    expect(screen.queryByText('Polish project shell')).toBeNull();

    expect(screen.getByText('Source signals')).toBeTruthy();
    expect(screen.getByText('signal-1')).toBeTruthy();
    expect(screen.getByText('signal-2')).toBeTruthy();
    expect(screen.getByText('Verification preview')).toBeTruthy();
    expect(screen.getByText('Adapter verification completed.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Execute' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Simulate' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Defer' })).toBeTruthy();
  });

  it('updates the route search when the toolbar changes', () => {
    render(<RouteComponent />);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'confidence' },
    });

    expect(mockNavigate).toHaveBeenLastCalledWith({
      to: '/actions',
      search: {
        sort: 'confidence',
        simulatableOnly: true,
        selectedId: 'action-1',
      },
      replace: true,
    });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Simulatable only' }));

    expect(mockNavigate).toHaveBeenLastCalledWith({
      to: '/actions',
      search: {
        sort: 'impact',
        simulatableOnly: undefined,
        selectedId: 'action-1',
      },
      replace: true,
    });
  });

  it('shows a pending indicator when verification phase is pending', () => {
    mockVerificationPhase.current = 'pending';
    render(<RouteComponent />);
    expect(screen.getByText('Verifying…')).toBeTruthy();
  });

  it('shows a failed indicator when verification phase is failed', () => {
    mockVerificationPhase.current = 'failed';
    render(<RouteComponent />);
    expect(screen.getByText('Verification failed.')).toBeTruthy();
  });

  it('Execute button sets verification phase to pending', () => {
    render(<RouteComponent />);
    fireEvent.click(screen.getByRole('button', { name: 'Execute' }));
    expect(mockSetVerificationPhase).toHaveBeenCalledWith(
      'pending',
      'action-1'
    );
  });

  it('Simulate button opens simulation preview in UIStore', () => {
    render(<RouteComponent />);
    fireEvent.click(screen.getByRole('button', { name: 'Simulate' }));
    expect(mockSetVerificationPhase).toHaveBeenCalledWith(
      'pending',
      'action-1'
    );
  });

  it('Defer button navigates to /actions without selectedId', () => {
    render(<RouteComponent />);
    fireEvent.click(screen.getByRole('button', { name: 'Defer' }));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/actions',
      search: expect.objectContaining({ selectedId: undefined }),
      replace: true,
    });
  });
});
