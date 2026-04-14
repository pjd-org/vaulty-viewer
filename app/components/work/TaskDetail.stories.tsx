import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { TaskDetail } from './TaskDetail';
import type { NextAction } from '../../../src/lib/focus-logic';

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

const baseTask: NextAction = {
  id: 'task-001',
  path: 'notes/tasks/implement-feature.md',
  title: 'Implement COD signal renderer',
  score: 1.8,
  priority: 8,
  effortScore: 5,
  focusCost: 6,
  estimatedTimeMin: 90,
  status: 'todo',
  tags: ['frontend', 'cod', 'renderer'],
  description:
    'Build the signal row renderer for the COD panel with variant support and proper type guards.',
};

const meta = {
  title: 'Work / TaskDetail',
  component: TaskDetail,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TaskDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { task: baseTask },
};

export const NoDescription: Story = {
  args: {
    task: { ...baseTask, description: undefined },
  },
};

export const WithDueDate: Story = {
  args: {
    task: {
      ...baseTask,
      dueDate: '2026-04-20',
      description: 'File Q1 report on time.',
    },
  },
};

export const WithBlockers: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Deploy API v2',
      status: 'blocked',
      blockers: [
        { id: 'b1', description: 'Waiting on security review sign-off.' },
        { id: 'b2', description: 'CI pipeline red on integration tests.' },
      ],
    },
  },
};

export const NoPath: Story = {
  args: {
    task: { ...baseTask, path: undefined },
  },
};

export const MinimalTask: Story = {
  args: {
    task: {
      id: 'task-min',
      path: undefined,
      title: 'Quick task, no extras',
      score: 0.5,
      priority: 2,
      effortScore: 0,
      focusCost: 0,
      estimatedTimeMin: 0,
      status: 'todo',
      tags: [],
    },
  },
};
