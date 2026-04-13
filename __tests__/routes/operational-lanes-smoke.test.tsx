import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Stubs required by all 8 route components
// ---------------------------------------------------------------------------

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
  }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isLoading: false }),
}));

vi.mock('../../app/components/layout', () => ({
  WorkspaceScaffold: ({
    primary,
    aside,
  }: {
    primary?: React.ReactNode;
    aside?: React.ReactNode;
  }) => (
    <div>
      <div data-testid="scaffold-primary">{primary}</div>
      <div data-testid="scaffold-aside">{aside}</div>
    </div>
  ),
}));

vi.mock('../../app/components/projects', () => ({
  ProjectsWorkspace: () => <div data-testid="projects-workspace">projects</div>,
}));

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Automation
// ---------------------------------------------------------------------------
import { Route as AutomationRouteModule } from '../../app/routes/automation';
const AutomationComponent = AutomationRouteModule.options
  .component as React.ComponentType;

describe('automation lane', () => {
  it('renders empty-state with correct testid when data is null', () => {
    render(<AutomationComponent />);
    expect(screen.getByTestId('automation-empty-state')).toBeTruthy();
  });

  it('renders no aside content', () => {
    render(<AutomationComponent />);
    expect(screen.getByTestId('scaffold-aside').childElementCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Work
// ---------------------------------------------------------------------------
import { Route as WorkRouteModule } from '../../app/routes/work';
const WorkComponent = WorkRouteModule.options.component as React.ComponentType;

describe('work lane', () => {
  it('renders ProjectsWorkspace and empty-state when data is null', () => {
    render(<WorkComponent />);
    expect(screen.getByTestId('projects-workspace')).toBeTruthy();
    expect(screen.getByTestId('work-task-empty-state')).toBeTruthy();
  });

  it('renders no aside content (detail is now inline)', () => {
    render(<WorkComponent />);
    // The aside slot is empty — details expand inline within the task list
    const aside = screen.getByTestId('scaffold-aside');
    expect(aside.childElementCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------
import { Route as PortfolioRouteModule } from '../../app/routes/portfolio';
const PortfolioComponent = PortfolioRouteModule.options
  .component as React.ComponentType;

describe('portfolio lane', () => {
  it('renders empty-state with correct testid when data is null', () => {
    render(<PortfolioComponent />);
    expect(screen.getByTestId('portfolio-empty-state')).toBeTruthy();
  });

  it('renders no aside content', () => {
    render(<PortfolioComponent />);
    expect(screen.getByTestId('scaffold-aside').childElementCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Bubble
// ---------------------------------------------------------------------------
import { Route as BubbleRouteModule } from '../../app/routes/bubble';
const BubbleComponent = BubbleRouteModule.options
  .component as React.ComponentType;

describe('bubble lane', () => {
  it('renders empty-state with correct testid when data is null', () => {
    render(<BubbleComponent />);
    expect(screen.getByTestId('bubble-empty-state')).toBeTruthy();
  });

  it('renders no aside content', () => {
    render(<BubbleComponent />);
    expect(screen.getByTestId('scaffold-aside').childElementCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
import { Route as HealthRouteModule } from '../../app/routes/health';
const HealthComponent = HealthRouteModule.options
  .component as React.ComponentType;

describe('health lane', () => {
  it('renders empty-state with correct testid when data is null', () => {
    render(<HealthComponent />);
    expect(screen.getByTestId('health-empty-state')).toBeTruthy();
  });

  it('renders no aside content', () => {
    render(<HealthComponent />);
    expect(screen.getByTestId('scaffold-aside').childElementCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
import { Route as TimelineRouteModule } from '../../app/routes/timeline';
const TimelineComponent = TimelineRouteModule.options
  .component as React.ComponentType;

describe('timeline lane', () => {
  it('renders empty-state with correct testid when data is null', () => {
    render(<TimelineComponent />);
    expect(screen.getByTestId('timeline-empty-state')).toBeTruthy();
  });

  it('renders no aside content', () => {
    render(<TimelineComponent />);
    expect(screen.getByTestId('scaffold-aside').childElementCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Archive
// ---------------------------------------------------------------------------
import { Route as ArchiveRouteModule } from '../../app/routes/archive';
const ArchiveComponent = ArchiveRouteModule.options
  .component as React.ComponentType;

describe('archive lane', () => {
  it('renders empty-state with correct testid when data is null', () => {
    render(<ArchiveComponent />);
    expect(screen.getByTestId('archive-empty-state')).toBeTruthy();
  });

  it('renders no aside content', () => {
    render(<ArchiveComponent />);
    expect(screen.getByTestId('scaffold-aside').childElementCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Graph
// ---------------------------------------------------------------------------
import { Route as GraphRouteModule } from '../../app/routes/graph';
const GraphComponent = GraphRouteModule.options
  .component as React.ComponentType;

describe('graph lane', () => {
  it('renders empty-state with correct testid when data is null', () => {
    render(<GraphComponent />);
    expect(screen.getByTestId('graph-empty-state')).toBeTruthy();
  });

  it('renders no aside content', () => {
    render(<GraphComponent />);
    expect(screen.getByTestId('scaffold-aside').childElementCount).toBe(0);
  });
});
