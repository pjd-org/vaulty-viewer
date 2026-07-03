import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { BacklogStripCard } from './BacklogStripCard';
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
  id: 'task-010',
  path: 'notes/tasks/write-unit-tests.md',
  title: 'Write unit tests for kanban reducer',
  score: 0.9,
  priority: 5,
  effortScore: 3,
  focusCost: 4,
  estimatedTimeMin: 45,
  status: 'todo',
  tags: ['testing'],
};

const meta = {
  title: 'Home / BacklogStripCard',
  component: BacklogStripCard,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: {
    task: baseTask,
    onStart: () => {},
    onBacklog: () => {},
    mutating: false,
  },
} satisfies Meta<typeof BacklogStripCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mutating: Story = {
  args: { mutating: true },
};

export const NoPath: Story = {
  args: {
    task: {
      ...baseTask,
      path: '',
      title: 'Orphaned task without vault path',
    },
  },
};

export const LongTitle: Story = {
  args: {
    task: {
      ...baseTask,
      title:
        'Refactor the entire authentication module to support multi-tenant OAuth2 with PKCE and refresh token rotation',
    },
  },
};
