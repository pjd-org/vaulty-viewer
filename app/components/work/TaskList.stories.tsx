import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { TaskList } from './TaskList';
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

const mockTasks: NextAction[] = [
  {
    id: 'task-001',
    path: 'notes/tasks/implement-renderer.md',
    title: 'Implement COD signal renderer',
    score: 1.8,
    priority: 8,
    effortScore: 5,
    focusCost: 6,
    estimatedTimeMin: 90,
    status: 'todo',
    tags: ['frontend', 'cod'],
    description: 'Build the signal row renderer for the COD panel.',
  },
  {
    id: 'task-002',
    path: 'notes/tasks/write-tests.md',
    title: 'Write integration tests for auth flow',
    score: 1.2,
    priority: 6,
    effortScore: 4,
    focusCost: 5,
    estimatedTimeMin: 60,
    status: 'todo',
    tags: ['testing', 'auth'],
    description: 'Cover login, refresh, and logout flows end-to-end.',
  },
  {
    id: 'task-003',
    path: undefined,
    title: 'Fix kanban drag-drop on mobile',
    score: 0.9,
    priority: 5,
    effortScore: 3,
    focusCost: 3,
    estimatedTimeMin: 45,
    status: 'blocked',
    tags: ['mobile', 'kanban'],
    description: undefined,
    blockers: [
      { id: 'b1', description: 'Waiting on Pointer Events API decision.' },
    ],
  },
];

function StatefulTaskList(props: { tasks: NextAction[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <TaskList
      tasks={props.tasks}
      selectedId={selectedId}
      onSelect={(t) => setSelectedId(t?.id ?? null)}
    />
  );
}

const meta = {
  title: 'Work / TaskList',
  component: TaskList,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TaskList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <StatefulTaskList tasks={mockTasks} />,
};

export const SingleTask: Story = {
  render: () => <StatefulTaskList tasks={[mockTasks[0]]} />,
};

export const AllBlocked: Story = {
  render: () => (
    <StatefulTaskList
      tasks={mockTasks.map((t) => ({
        ...t,
        status: 'blocked' as const,
        blockers: [{ id: 'b', description: 'Blocked by upstream dependency.' }],
      }))}
    />
  ),
};

export const Empty: Story = {
  args: {
    tasks: [],
    selectedId: null,
    onSelect: () => {},
  },
};
