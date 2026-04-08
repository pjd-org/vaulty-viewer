/**
 * bubble.test.tsx
 *
 * Tests for the Bubble route wired to the real BubbleSurface adapter.
 * Covers: loading state, empty state, data-wired content, error/unauth redirect.
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoist shared mocks so they are available inside vi.mock factories
// ---------------------------------------------------------------------------

const { MockUnauthenticatedError, mockNavigate, mockUseBubbleSurface } =
  vi.hoisted(() => {
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
      mockUseBubbleSurface: vi.fn(),
    };
  });

// ---------------------------------------------------------------------------
// Mock router + layout
// ---------------------------------------------------------------------------

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
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
  useBubbleSurface: () => mockUseBubbleSurface(),
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

const BUBBLE_DATA = {
  momentum: {
    score: 7.5,
    trend: 'up' as const,
    streakDays: 5,
    topTaskScore: 0.875,
    label: 'High',
  },
  pressure: {
    score: 3.2,
    blockedCount: 1,
    overdueCount: 0,
    stressLevel: 20,
    label: 'Low',
  },
  energy: {
    level: 75,
    stress: 20,
    focusBand: 'high',
    sleepHours: 8,
    timeBudgetMin: 360,
    asOf: '2026-04-08T10:00:00.000Z',
  },
  rewards: {
    xp: 1200,
    level: 3,
    rank: 'D Novice',
    streakDays: 5,
  },
  signals: [
    {
      id: 'signal:task-1',
      kind: 'stale',
      title: 'Top Priority Task',
      severity: 'high',
      surfaceScope: 'bubble',
      surfacedBy: 'cod',
      allowedActions: [],
    },
  ],
};

// ---------------------------------------------------------------------------
// Import route after mocks
// ---------------------------------------------------------------------------

import { Route as BubbleRouteModule } from '../../app/routes/bubble';
const BubbleComponent = BubbleRouteModule.options
  .component as React.ComponentType;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BubbleRoute — loading state', () => {
  beforeEach(() => {
    mockUseBubbleSurface.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
  });

  it('renders loading state testid', () => {
    render(<BubbleComponent />);
    expect(screen.getByTestId('bubble-loading-state')).toBeTruthy();
  });

  it('does not render content or empty-state while loading', () => {
    render(<BubbleComponent />);
    expect(screen.queryByTestId('bubble-content')).toBeNull();
    expect(screen.queryByTestId('bubble-empty-state')).toBeNull();
  });
});

describe('BubbleRoute — empty state (data null)', () => {
  beforeEach(() => {
    mockUseBubbleSurface.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
  });

  it('renders bubble-empty-state', () => {
    render(<BubbleComponent />);
    expect(screen.getByTestId('bubble-empty-state')).toBeTruthy();
  });

  it('renders aside empty-state', () => {
    render(<BubbleComponent />);
    expect(screen.getByTestId('bubble-aside-empty-state')).toBeTruthy();
  });
});

describe('BubbleRoute — data wired', () => {
  beforeEach(() => {
    mockUseBubbleSurface.mockReturnValue({
      data: BUBBLE_DATA,
      isLoading: false,
      error: null,
    });
  });

  it('renders bubble-content when data is present', () => {
    render(<BubbleComponent />);
    expect(screen.getByTestId('bubble-content')).toBeTruthy();
  });

  it('renders momentum section', () => {
    render(<BubbleComponent />);
    expect(screen.getByTestId('bubble-momentum')).toBeTruthy();
  });

  it('renders momentum bar', () => {
    render(<BubbleComponent />);
    expect(screen.getByTestId('momentum-bar')).toBeTruthy();
  });

  it('renders momentum trend indicator', () => {
    render(<BubbleComponent />);
    const trend = screen.getByTestId('momentum-trend');
    expect(trend.textContent).toBe('↑');
  });

  it('renders pressure section', () => {
    render(<BubbleComponent />);
    expect(screen.getByTestId('bubble-pressure')).toBeTruthy();
  });

  it('renders aside with energy section', () => {
    render(<BubbleComponent />);
    expect(screen.getByTestId('bubble-aside')).toBeTruthy();
    expect(screen.getByTestId('bubble-energy')).toBeTruthy();
  });

  it('renders aside with rewards section', () => {
    render(<BubbleComponent />);
    expect(screen.getByTestId('bubble-rewards')).toBeTruthy();
  });

  it('summary items reflect live data', () => {
    render(<BubbleComponent />);
    expect(screen.getByTestId('summary-momentum').textContent).toBe('High');
    expect(screen.getByTestId('summary-energy').textContent).toBe('75%');
  });

  it('does not render empty-state when data is present', () => {
    render(<BubbleComponent />);
    expect(screen.queryByTestId('bubble-empty-state')).toBeNull();
    expect(screen.queryByTestId('bubble-aside-empty-state')).toBeNull();
  });
});

describe('BubbleRoute — unauthenticated', () => {
  beforeEach(() => {
    mockUseBubbleSurface.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new MockUnauthenticatedError('401'),
    });
  });

  it('navigates to /login on 401 error', () => {
    render(<BubbleComponent />);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
  });

  it('renders null while redirecting', () => {
    const { container } = render(<BubbleComponent />);
    expect(container.firstChild).toBeNull();
  });
});

describe('BubbleRoute — generic error', () => {
  beforeEach(() => {
    mockUseBubbleSurface.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('network failure'),
    });
  });

  it('renders empty-state on generic error', () => {
    render(<BubbleComponent />);
    expect(
      screen.getByText('Bubble data temporarily unavailable.')
    ).toBeTruthy();
  });

  it('does not navigate to login on generic error', () => {
    render(<BubbleComponent />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
