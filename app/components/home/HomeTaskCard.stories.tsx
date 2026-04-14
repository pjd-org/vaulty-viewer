import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { HomeTaskCard } from './HomeTaskCard';
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
  path: 'notes/tasks/implement-auth-flow.md',
  title: 'Implement OAuth2 authentication flow',
  score: 1.6,
  priority: 7,
  effortScore: 5,
  focusCost: 6,
  estimatedTimeMin: 90,
  status: 'todo',
  tags: ['backend', 'auth'],
  description: 'Add OAuth2 login with GitHub and Google providers.',
};

const meta = {
  title: 'Home / HomeTaskCard',
  component: HomeTaskCard,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: {
    onStart: () => {},
    onBacklog: () => {},
    mutating: false,
    task: baseTask,
  },
} satisfies Meta<typeof HomeTaskCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HighPriority: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Fix critical auth regression — users cannot log in',
      score: 2.4,
      priority: 9,
      effortScore: 4,
      focusCost: 8,
      estimatedTimeMin: 30,
    },
  },
};

export const NormalPriority: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Update README with setup instructions',
      score: 0.3,
      priority: 2,
      effortScore: 1,
      focusCost: 1,
      estimatedTimeMin: 20,
      path: '',
    },
  },
};

export const Compact: Story = {
  args: { compact: true },
};

export const Mutating: Story = {
  args: { mutating: true },
};

export const NoPath: Story = {
  args: {
    task: {
      ...baseTask,
      path: '',
      title: 'Task without a vault path',
    },
  },
};
