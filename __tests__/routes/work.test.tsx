import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLazyRouteComponentMock } from './lazyRouteComponentMock';
import { UnauthenticatedError } from '../../src/utils/api';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  lazyRouteComponent: createLazyRouteComponentMock(),
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
  }),
  useSearch: () => ({ tab: undefined, selectedId: undefined }),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    href: '/',
    state: {},
    key: 'test-location',
  }),
  useNavigate: () => mockNavigate,
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

beforeEach(async () => {
  await (WorkComponent as { preload?: () => Promise<void> }).preload?.();
});

describe('work route — loading state', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
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
    mockNavigate.mockReset();
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
    mockNavigate.mockReset();
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

describe('work route — unauthorized data', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: undefined,
      error: new UnauthenticatedError('Failed to fetch work surface: 401'),
      isError: true,
    });
  });

  it('redirects to login instead of rendering the empty state', () => {
    render(<WorkComponent />);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/?auth=required&return_to=%2F',
    });
    expect(screen.queryByTestId('work-task-empty-state')).toBeNull();
    expect(screen.queryByTestId('projects-workspace')).toBeNull();
  });
});

describe('work route — task detail panel', () => {
  const TASK_WITH_DESC = {
    tasks: [
      {
        id: 'task-a',
        title: 'Has description',
        description: 'Some context here.',
        path: 'notes/tasks/ta.md',
        score: 7,
        priority: 8,
        effortScore: 4,
        focusCost: 3,
        estimatedTimeMin: 45,
        status: 'todo',
        tags: [],
      },
    ],
    total: 1,
    mode: 'cod' as const,
    warnings: [],
  };

  const TASK_NO_DESC = {
    tasks: [
      {
        id: 'task-b',
        title: 'No description task',
        description: null,
        path: 'notes/tasks/tb.md',
        score: 5,
        priority: 6,
        effortScore: 2,
        focusCost: 2,
        estimatedTimeMin: 20,
        status: 'todo',
        tags: [],
      },
    ],
    total: 1,
    mode: 'cod' as const,
    warnings: [],
  };

  it('shows task description when present', () => {
    mockUseQuery.mockReturnValue({ isLoading: false, data: TASK_WITH_DESC });
    render(<WorkComponent />);
    fireEvent.click(screen.getByText('Has description'));
    expect(screen.getByTestId('work-task-detail')).toBeTruthy();
    expect(screen.getByText('Some context here.')).toBeTruthy();
  });

  it('shows fallback message when description is null', () => {
    mockUseQuery.mockReturnValue({ isLoading: false, data: TASK_NO_DESC });
    render(<WorkComponent />);
    fireEvent.click(screen.getByText('No description task'));
    const detail = screen.getByTestId('work-task-detail');
    expect(detail.querySelector('p.italic')).toBeTruthy();
    expect(detail.querySelector('p.italic')?.textContent).toMatch(
      /no description/i
    );
  });

  it('shows priority badge in detail panel', () => {
    mockUseQuery.mockReturnValue({ isLoading: false, data: TASK_WITH_DESC });
    render(<WorkComponent />);
    fireEvent.click(screen.getByText('Has description'));
    expect(screen.getByText('p8')).toBeTruthy();
  });
});
