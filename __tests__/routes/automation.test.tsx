import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
  }),
  useSearch: () => ({ tab: undefined, selectedId: undefined }),
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

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

import { useQuery } from '@tanstack/react-query';
const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

import { Route as AutomationRouteModule } from '../../app/routes/automation';
const AutomationComponent = AutomationRouteModule.options
  .component as React.ComponentType;

describe('automation route — loading state', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    });
  });

  it('renders loading indicator', () => {
    render(<AutomationComponent />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });
});

describe('automation route — empty / null data', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: false,
    });
  });

  it('renders empty state when no data', () => {
    render(<AutomationComponent />);
    expect(screen.getByTestId('automation-empty-state')).toBeTruthy();
  });
});

describe('automation route — with automation data', () => {
  const AUTOMATION_DATA = {
    pipelines: [{ name: 'daily-digest' }, { name: 'inbox-triage' }],
    scheduler: {
      enabled: true,
      mode: 'auto',
      tz: 'America/New_York',
      jobs: [
        {
          id: 'job-1',
          pipeline: 'daily-digest',
          cron: '0 9 * * *',
          source: 'file',
          lastRun: null,
        },
      ],
    },
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: AUTOMATION_DATA,
      isError: false,
    });
  });

  it('renders pipeline list', () => {
    render(<AutomationComponent />);
    expect(screen.getByTestId('automation-pipeline-list')).toBeTruthy();
  });

  it('renders pipeline names', () => {
    render(<AutomationComponent />);
    expect(screen.getAllByText('daily-digest').length).toBeGreaterThanOrEqual(
      1
    );
    expect(screen.getByText('inbox-triage')).toBeTruthy();
  });

  it('renders scheduler section', () => {
    render(<AutomationComponent />);
    expect(screen.getByTestId('automation-scheduler-section')).toBeTruthy();
  });

  it('renders scheduler job id', () => {
    render(<AutomationComponent />);
    expect(screen.getByText('job-1')).toBeTruthy();
  });
});

describe('automation route — scheduler disabled', () => {
  const DISABLED_DATA = {
    pipelines: [],
    scheduler: { enabled: false, mode: 'manual', tz: 'UTC', jobs: [] },
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: DISABLED_DATA,
      isError: false,
    });
  });

  it('shows scheduler disabled state', () => {
    render(<AutomationComponent />);
    expect(screen.getByTestId('automation-scheduler-section')).toBeTruthy();
    expect(screen.getByText(/disabled/i)).toBeTruthy();
  });
});

describe('automation route — pipeline detail panel', () => {
  const AUTOMATION_DATA = {
    pipelines: [{ name: 'daily-digest' }],
    scheduler: {
      enabled: false,
      mode: 'auto',
      tz: 'UTC',
      jobs: [],
    },
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: AUTOMATION_DATA,
      isError: false,
    });
  });

  it('shows pipeline detail panel when a pipeline is selected', () => {
    render(<AutomationComponent />);
    const btn = screen.getByText('daily-digest');
    fireEvent.click(btn);
    expect(screen.getByTestId('automation-pipeline-detail')).toBeTruthy();
  });

  it('shows pipeline name once in the detail panel header', () => {
    render(<AutomationComponent />);
    fireEvent.click(screen.getByText('daily-digest'));
    const detail = screen.getByTestId('automation-pipeline-detail');
    // name appears exactly once inside the detail panel
    const nameEls = detail.querySelectorAll('*');
    const nameMatches = Array.from(nameEls).filter(
      (el) => el.textContent?.trim() === 'daily-digest'
    );
    // Only the header <p> should match; there should not be a second copy
    expect(nameMatches.length).toBe(1);
  });

  it('shows no-history message instead of "No additional runtime metadata" copy', () => {
    render(<AutomationComponent />);
    fireEvent.click(screen.getByText('daily-digest'));
    expect(screen.queryByText(/no additional runtime metadata/i)).toBeNull();
    expect(screen.getByText(/no execution history/i)).toBeTruthy();
  });
});
