import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted state
// ---------------------------------------------------------------------------

const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseHomeSurface = vi.hoisted(() => vi.fn());
const mockUseActiveSession = vi.hoisted(() => vi.fn());
const mockUseRecentSessions = vi.hoisted(() => vi.fn());
const mockUseWhatNowQuery = vi.hoisted(() => vi.fn());
const mockUseUpNextQuery = vi.hoisted(() => vi.fn());
const mockGetHomeSurfaceQueryOptions = vi.hoisted(() =>
  vi.fn(() => ({
    queryKey: ['viewer-adapter', 'home-surface'],
    queryFn: vi.fn(),
  }))
);
const mockApiFetch = vi.hoisted(() => vi.fn());

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
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
  useActiveSession: () => mockUseActiveSession(),
  useRecentSessions: () => mockUseRecentSessions(),
}));

vi.mock('../../app/lib/queries/agents', () => ({
  useWhatNowQuery: () => mockUseWhatNowQuery(),
  useUpNextQuery: () => mockUseUpNextQuery(),
}));

vi.mock('../../src/utils/api', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiFetch: (...args: unknown[]) => (mockApiFetch as any)(...args),
  UnauthenticatedError: class UnauthenticatedError extends Error {
    readonly status = 401;
    constructor(message?: string) {
      super(message ?? 'Unauthenticated');
      this.name = 'UnauthenticatedError';
    }
  },
}));

vi.mock('../../app/components/home', () => ({
  BestMoveCard: ({ task }: { task: { title: string } }) => (
    <div>Best move: {task.title}</div>
  ),
  TaskMiniCard: ({ task }: { task: { title: string } }) => (
    <div>Follow-up: {task.title}</div>
  ),
  QuickRouteGrid: () => <div>Quick routes</div>,
  SessionPlannerCard: () => <div>Session planner</div>,
}));

vi.mock('../../app/components/layout', () => ({
  WorkspaceScaffold: ({
    primary,
  }: {
    primary?: React.ReactNode;
    aside?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div>
      <div data-testid="scaffold-primary">{primary}</div>
    </div>
  ),
  SectionHeader: ({ title }: { title: string }) => <div>{title}</div>,
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
// System under test
// ---------------------------------------------------------------------------

import { Route } from '../../app/routes/index';
import { UnauthenticatedError } from '../../src/utils/api';

const RouteComponent = Route.options.component as React.ComponentType;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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

describe('home route — unauthenticated state (401)', () => {
  beforeEach(() => {
    const err = new UnauthenticatedError('Failed to fetch home surface: 401');
    mockUseHomeSurface.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: err,
      isError: true,
    });
    mockUseActiveSession.mockReturnValue({ data: null, isLoading: false });
    mockUseRecentSessions.mockReturnValue({ data: [], isLoading: false });
    mockUseWhatNowQuery.mockReturnValue({ data: undefined, isError: false });
    mockUseUpNextQuery.mockReturnValue({ data: undefined, isError: false });
    mockApiFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
  });

  it('calls navigate({ to: "/login" }) when error is UnauthenticatedError', () => {
    renderWithClient(<RouteComponent />);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
  });

  it('renders nothing (null) while redirect is pending', () => {
    const { container } = renderWithClient(<RouteComponent />);
    expect(container.firstChild).toBeNull();
  });

  it('does NOT render the inline unauthenticated CTA card', () => {
    renderWithClient(<RouteComponent />);
    expect(screen.queryByTestId('home-unauthenticated-state')).toBeNull();
  });

  it('does NOT render the WorkspaceScaffold', () => {
    renderWithClient(<RouteComponent />);
    expect(screen.queryByTestId('scaffold-primary')).toBeNull();
  });
});

describe('home route — generic error (non-401)', () => {
  beforeEach(() => {
    mockUseHomeSurface.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch home surface: 500'),
      isError: true,
    });
    mockUseActiveSession.mockReturnValue({ data: null, isLoading: false });
    mockUseRecentSessions.mockReturnValue({ data: [], isLoading: false });
    mockUseWhatNowQuery.mockReturnValue({ data: undefined, isError: false });
    mockUseUpNextQuery.mockReturnValue({ data: undefined, isError: false });
    mockApiFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
  });

  it('does NOT navigate to /login for a generic error', () => {
    renderWithClient(<RouteComponent />);
    expect(mockNavigate).not.toHaveBeenCalledWith({ to: '/login' });
  });

  it('does NOT render the unauthenticated state for a generic error', () => {
    renderWithClient(<RouteComponent />);
    expect(screen.queryByTestId('home-unauthenticated-state')).toBeNull();
  });

  it('renders the generic adapter-failed empty state', () => {
    renderWithClient(<RouteComponent />);
    expect(screen.getByText(/adapter query failed/i)).toBeTruthy();
  });
});
