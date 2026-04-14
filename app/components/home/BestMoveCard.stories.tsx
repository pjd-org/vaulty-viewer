import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { BestMoveCard } from './BestMoveCard';
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
  path: 'notes/tasks/implement-cod-renderer.md',
  title: 'Implement COD signal renderer',
  score: 1.8,
  priority: 8,
  effortScore: 5,
  focusCost: 6,
  estimatedTimeMin: 90,
  status: 'todo',
  tags: ['frontend', 'cod'],
  description:
    'Build the signal row renderer for the COD panel with variant support and proper type guards.',
};

const meta = {
  title: 'Home / BestMoveCard',
  component: BestMoveCard,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: {
    onStart: () => {},
    onSkip: () => {},
    onComplete: () => {},
    mutating: false,
  },
} satisfies Meta<typeof BestMoveCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { task: baseTask },
};

export const WithWhyNow: Story = {
  args: {
    task: {
      ...baseTask,
      scoreBreakdown: {
        compoundReasons: ['Due in 2 days — time pressure rising.'],
        compoundScore: 1.8,
      },
    },
  },
};

export const WithDueDate: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'File quarterly report',
      dueDate: '2026-04-15',
      scoreBreakdown: undefined,
      description: 'Compile and submit the Q1 financial summary.',
    },
  },
};

export const Blocked: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Deploy API v2 to production',
      blockers: [
        { id: 'blocker-1', description: 'Waiting on security review' },
      ],
      description: 'Final deployment step — blocked until security sign-off.',
    },
  },
};

export const Mutating: Story = {
  args: {
    task: baseTask,
    mutating: true,
  },
};

export const HighPriority: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Fix critical auth regression',
      priority: 10,
      score: 2.5,
      estimatedTimeMin: 30,
      focusCost: 8,
      effortScore: 7,
      description: 'Users cannot log in with SSO. Introduced in last deploy.',
      scoreBreakdown: {
        compoundReasons: ['P0 incident — highest priority in queue.'],
        compoundScore: 2.5,
      },
    },
  },
};

export const MinimalTask: Story = {
  args: {
    task: {
      id: 'task-min',
      path: 'notes/tasks/quick-task.md',
      title: 'Quick task with no description',
      score: 0.8,
      priority: 3,
      effortScore: 2,
      focusCost: 1,
      estimatedTimeMin: 15,
      status: 'todo',
      tags: [],
    },
  },
};
