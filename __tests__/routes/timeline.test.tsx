/**
 * timeline.test.tsx
 *
 * Tests for the Timeline route wired to the real TimelineSurface adapter.
 * Covers: loading state, empty state, data-wired content, error/unauth redirect.
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoist shared mocks
// ---------------------------------------------------------------------------

const {
  MockUnauthenticatedError,
  mockNavigate,
  mockUseTimelineSurface,
  mockUseSearch,
} = vi.hoisted(() => {
  class MockUnauthenticatedError extends Error {
    constructor(msg?: string) {
      super(msg);
      this.name = 'UnauthenticatedError';
      Object.setPrototypeOf(this, MockUnauthenticatedError.prototype);
    }
  }
  return {
    MockUnauthenticatedError,
    mockNavigate: vi.fn(),
    mockUseTimelineSurface: vi.fn(),
    mockUseSearch: vi.fn(() => ({})),
  };
});

// ---------------------------------------------------------------------------
// Mock router + layout
// ---------------------------------------------------------------------------

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => mockUseSearch(),
  }),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../app/components/layout', () => ({
  WorkspaceScaffold: ({
    primary,
    aside,
    summaryItems,
  }: {
    primary?: React.ReactNode;
    aside?: React.ReactNode;
    summaryItems?: Array<{ label: string; value: string; detail?: string }>;
  }) => (
    <div>
      <div data-testid="scaffold-summary">
        {(summaryItems ?? []).map((item) => (
          <span
            key={item.label}
            data-testid={`summary-${item.label.toLowerCase()}`}
          >
            {item.value}
          </span>
        ))}
      </div>
      <div data-testid="scaffold-primary">{primary}</div>
      <div data-testid="scaffold-aside">{aside}</div>
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Mock viewer-adapter
// ---------------------------------------------------------------------------

vi.mock('../../app/lib/viewer-adapter', () => ({
  useTimelineSurface: () => mockUseTimelineSurface(),
  getTimelineSurfaceQueryOptions: vi.fn(() => ({
    queryKey: ['viewer-adapter', 'timeline-surface', {}],
    queryFn: async () => null,
    staleTime: 30_000,
  })),
}));

// ---------------------------------------------------------------------------
// Mock UnauthenticatedError
// ---------------------------------------------------------------------------

vi.mock('../../src/utils/api', () => ({
  UnauthenticatedError: MockUnauthenticatedError,
  apiFetch: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const TIMELINE_DATA = {
  events: [
    {
      id: 'run-123-agents.run_started-2026-04-08T10:00:00.000Z',
      type: 'agents.run_started',
      ts: '2026-04-08T10:00:00.000Z',
      src: { tool: 'aladdin' },
      meta: { run_id: 'run-abc-123', agent_id: 'huey', agent_slot: 'primary' },
      data: { agent_id: 'huey', caller_authority: 'user' },
    },
    {
      id: 'run-123-agents.run_completed-2026-04-08T10:00:01.000Z',
      type: 'agents.run_completed',
      ts: '2026-04-08T10:00:01.000Z',
      src: { tool: 'aladdin' },
      meta: { run_id: 'run-abc-123', agent_id: 'huey', agent_slot: 'primary' },
      data: { agent_id: 'huey', duration_ms: 1000, output_length: 42 },
    },
  ],
  total: 2,
  offset: 0,
  limit: 50,
  fetchedAt: '2026-04-08T10:00:05.000Z',
};

// ---------------------------------------------------------------------------
// Import route after mocks
// ---------------------------------------------------------------------------

import { Route as TimelineRouteModule } from '../../app/routes/timeline';
const TimelineComponent = TimelineRouteModule.options
  .component as React.ComponentType;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TimelineRoute — loading state', () => {
  beforeEach(() => {
    mockUseSearch.mockReturnValue({});
    mockUseTimelineSurface.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
  });

  it('renders loading state testid', () => {
    render(<TimelineComponent />);
    expect(screen.getByTestId('timeline-loading-state')).toBeTruthy();
  });

  it('does not render content while loading', () => {
    render(<TimelineComponent />);
    expect(screen.queryByTestId('timeline-content')).toBeNull();
    expect(screen.queryByTestId('timeline-empty-state')).toBeNull();
  });
});

describe('TimelineRoute — empty state (data null)', () => {
  beforeEach(() => {
    mockUseSearch.mockReturnValue({});
    mockUseTimelineSurface.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
  });

  it('renders timeline-empty-state', () => {
    render(<TimelineComponent />);
    expect(screen.getByTestId('timeline-empty-state')).toBeTruthy();
  });

  it('renders aside empty-state', () => {
    render(<TimelineComponent />);
    expect(screen.getByTestId('timeline-aside-empty-state')).toBeTruthy();
  });
});

describe('TimelineRoute — data wired', () => {
  beforeEach(() => {
    mockUseSearch.mockReturnValue({});
    mockUseTimelineSurface.mockReturnValue({
      data: TIMELINE_DATA,
      isLoading: false,
      error: null,
    });
  });

  it('renders timeline-content when data is present', () => {
    render(<TimelineComponent />);
    expect(screen.getByTestId('timeline-content')).toBeTruthy();
  });

  it('renders event rows', () => {
    render(<TimelineComponent />);
    const rows = screen.getAllByTestId('timeline-event-row');
    expect(rows.length).toBe(2);
  });

  it('renders event type badges', () => {
    render(<TimelineComponent />);
    expect(screen.getByText('agents.run_started')).toBeTruthy();
    expect(screen.getByText('agents.run_completed')).toBeTruthy();
  });

  it('summary items reflect total count', () => {
    render(<TimelineComponent />);
    expect(screen.getByTestId('summary-total').textContent).toBe('2');
    expect(screen.getByTestId('summary-shown').textContent).toBe('2');
  });

  it('renders aside empty-state when no event selected', () => {
    render(<TimelineComponent />);
    expect(screen.getByTestId('timeline-aside-empty-state')).toBeTruthy();
  });

  it('does not render empty-state when data is present', () => {
    render(<TimelineComponent />);
    expect(screen.queryByTestId('timeline-empty-state')).toBeNull();
  });
});

describe('TimelineRoute — event selected', () => {
  beforeEach(() => {
    mockUseSearch.mockReturnValue({
      selectedId: 'run-123-agents.run_started-2026-04-08T10:00:00.000Z',
    });
    mockUseTimelineSurface.mockReturnValue({
      data: TIMELINE_DATA,
      isLoading: false,
      error: null,
    });
  });

  it('renders event detail panel when event is selected', () => {
    render(<TimelineComponent />);
    expect(screen.getByTestId('timeline-event-detail')).toBeTruthy();
  });

  it('does not render aside empty-state when event is selected', () => {
    render(<TimelineComponent />);
    expect(screen.queryByTestId('timeline-aside-empty-state')).toBeNull();
  });
});

describe('TimelineRoute — unauthenticated', () => {
  beforeEach(() => {
    mockUseSearch.mockReturnValue({});
    mockUseTimelineSurface.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new MockUnauthenticatedError('401'),
    });
  });

  it('navigates to /login on 401 error', () => {
    render(<TimelineComponent />);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
  });

  it('renders null while redirecting', () => {
    const { container } = render(<TimelineComponent />);
    expect(container.firstChild).toBeNull();
  });
});

describe('TimelineRoute — generic error', () => {
  beforeEach(() => {
    mockUseSearch.mockReturnValue({});
    mockUseTimelineSurface.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('network failure'),
    });
  });

  it('renders empty-state on generic error', () => {
    render(<TimelineComponent />);
    expect(
      screen.getByText('Timeline data temporarily unavailable.')
    ).toBeTruthy();
  });

  it('does not navigate to login on generic error', () => {
    render(<TimelineComponent />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
