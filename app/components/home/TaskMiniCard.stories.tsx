import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { TaskMiniCard } from './TaskMiniCard';
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
  path: 'notes/tasks/write-unit-tests.md',
  title: 'Write unit tests for display.ts',
  score: 1.2,
  priority: 6,
  effortScore: 3,
  focusCost: 3,
  estimatedTimeMin: 45,
  status: 'todo',
  tags: ['testing'],
};

const meta = {
  title: 'Home / TaskMiniCard',
  component: TaskMiniCard,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: {
    onStart: () => {},
    onComplete: () => {},
  },
} satisfies Meta<typeof TaskMiniCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { task: baseTask },
};

export const ShortTask: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Bump patch version',
      estimatedTimeMin: 5,
      effortScore: 1,
      focusCost: 1,
    },
  },
};

export const LongTitle: Story = {
  args: {
    task: {
      ...baseTask,
      title:
        'Refactor the entire authentication module to use the new session token architecture from packages/auth-core',
      estimatedTimeMin: 240,
      effortScore: 9,
      focusCost: 9,
    },
  },
};

export const UnknownDuration: Story = {
  args: {
    task: {
      ...baseTask,
      title: 'Investigate flaky CI test',
      estimatedTimeMin: 0,
    },
  },
};

export const StackedList: Story = {
  args: { task: baseTask },
  render: () => (
    <div className="flex flex-col gap-2 w-96">
      {[
        {
          id: '1',
          title: 'Review PR #142',
          estimatedTimeMin: 20,
          effortScore: 2,
          focusCost: 2,
          score: 1.6,
          priority: 7,
        },
        {
          id: '2',
          title: 'Update dependencies',
          estimatedTimeMin: 30,
          effortScore: 3,
          focusCost: 2,
          score: 1.2,
          priority: 5,
        },
        {
          id: '3',
          title: 'Write changelog entry',
          estimatedTimeMin: 10,
          effortScore: 1,
          focusCost: 1,
          score: 0.9,
          priority: 4,
        },
      ].map((t) => (
        <TaskMiniCard
          key={t.id}
          task={{
            ...baseTask,
            ...t,
            path: `notes/tasks/${t.id}.md`,
            status: 'todo',
            tags: [],
          }}
          onStart={() => {}}
          onComplete={() => {}}
        />
      ))}
    </div>
  ),
};
