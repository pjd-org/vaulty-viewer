import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
  }),
  useSearch: () => ({ tab: undefined, selectedId: undefined }),
  Link: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
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
  ProjectsWorkspace: () => <div data-testid="projects-workspace">Projects</div>,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

import { useQuery } from '@tanstack/react-query';
const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

import { Route as WorkRouteModule } from '../../app/routes/work';
const WorkComponent = WorkRouteModule.options.component as React.ComponentType;

describe('work route — loading state', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    });
  });

  it('renders loading indicator', () => {
    render(<WorkComponent />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });
});

describe('work route — empty / null data', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: false,
    });
  });

  it('renders projects workspace regardless', () => {
    render(<WorkComponent />);
    expect(screen.getByTestId('projects-workspace')).toBeTruthy();
  });

  it('renders task empty state when no data', () => {
    render(<WorkComponent />);
    expect(screen.getByTestId('work-task-empty-state')).toBeTruthy();
  });
});

describe('work route — with task data', () => {
  const WORK_DATA = {
    tasks: [
      {
        id: 'task-1',
        title: 'Fix pipeline',
        path: 'notes/tasks/t1.md',
        score: 8.5,
        priority: 9,
        effortScore: 5,
        focusCost: 4,
        estimatedTimeMin: 30,
        status: 'todo',
        tags: [],
      },
      {
        id: 'task-2',
        title: 'Write docs',
        path: 'notes/tasks/t2.md',
        score: 6.0,
        priority: 7,
        effortScore: 3,
        focusCost: 2,
        estimatedTimeMin: 60,
        status: 'todo',
        tags: ['docs'],
      },
    ],
    total: 2,
    mode: 'cod' as const,
    warnings: [],
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: WORK_DATA,
      isError: false,
    });
  });

  it('renders projects workspace', () => {
    render(<WorkComponent />);
    expect(screen.getByTestId('projects-workspace')).toBeTruthy();
  });

  it('renders task list', () => {
    render(<WorkComponent />);
    expect(screen.getByTestId('work-task-list')).toBeTruthy();
  });

  it('renders task titles', () => {
    render(<WorkComponent />);
    expect(screen.getByText('Fix pipeline')).toBeTruthy();
    expect(screen.getByText('Write docs')).toBeTruthy();
  });

  it('does not render task empty state', () => {
    render(<WorkComponent />);
    expect(screen.queryByTestId('work-task-empty-state')).toBeNull();
  });
});
