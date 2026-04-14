import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { KanbanCard } from './KanbanCard';
import type { KanbanTask } from '../../../src/lib/kanban-logic';

function makeStubRouter(Story: () => React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Story /> });
  return createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
}

const RouterDecorator = (Story: () => React.ReactNode) => (
  <RouterProvider router={makeStubRouter(Story)} />
);

const baseTask: KanbanTask = {
  id: 'task-001',
  path: 'notes/tasks/implement-cod-renderer.md',
  link: '/work',
  title: 'Implement COD signal renderer',
  status: 'todo',
  priority: 7,
  estimatedTimeMin: 90,
  goalId: 'ship-v2',
  projectId: 'platform',
  tags: ['frontend', 'cod', 'renderer'],
  completedAt: null,
  createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  cmsSlug: 'implement-cod-renderer',
};

const meta = {
  title: 'Kanban / KanbanCard',
  component: KanbanCard,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: {
    isDragging: false,
    isReadOnly: false,
    mutatingTaskId: null,
    onDragStart: () => {},
    onDragEnd: () => {},
    onStatusChange: () => {},
  },
} satisfies Meta<typeof KanbanCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { task: baseTask },
};

export const HighPriority: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Fix critical auth regression',
      priority: 9,
      estimatedTimeMin: 30,
      tags: ['auth', 'p0'],
    },
  },
};

export const LowPriority: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Update README typos',
      priority: 2,
      estimatedTimeMin: 10,
      goalId: undefined,
      projectId: undefined,
      tags: ['docs'],
    },
  },
};

export const Blocked: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Deploy API v2 to production',
      status: 'blocked',
      tags: ['deploy', 'blocked'],
    },
  },
};

export const Completed: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Write unit tests for focus-logic',
      status: 'completed',
      tags: ['tests'],
    },
  },
};

export const InProgress: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Refactor viewer-adapter types',
      status: 'in-progress',
      estimatedTimeMin: 120,
      tags: ['refactor', 'types'],
    },
  },
};

export const Dragging: Story = {
  args: {
    task: baseTask,
    isDragging: true,
  },
};

export const Mutating: Story = {
  args: {
    task: baseTask,
    mutatingTaskId: 'task-001',
  },
};

export const ReadOnly: Story = {
  args: {
    task: baseTask,
    isReadOnly: true,
  },
};

export const NoPath: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Orphaned task — no path',
      path: undefined,
      tags: [],
      goalId: undefined,
      projectId: undefined,
      estimatedTimeMin: undefined,
    },
  },
};

export const Minimal: Story = {
  args: {
    task: {
      id: 'task-min',
      path: 'notes/tasks/minimal.md',
      link: '/work',
      title: 'Minimal task',
      status: 'backlog',
      priority: 0,
      tags: [],
      completedAt: null,
      createdAt: null,
      cmsSlug: 'minimal',
    },
  },
};

export const LongTitle: Story = {
  args: {
    task: {
      ...baseTask,
      title:
        'Implement full end-to-end encrypted messaging pipeline with key rotation, session management, and audit trail logging',
      tags: ['crypto', 'infra', 'security'],
      estimatedTimeMin: 480,
    },
  },
};
