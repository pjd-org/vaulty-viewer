import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { TaskSection } from './TaskSection';
import type { NextAction } from '../../../src/lib/focus-logic';
import type { WorkSurfacePayload } from '../../lib/viewer-adapter';

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
    path: 'notes/tasks/task-a.md',
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
    path: 'notes/tasks/task-b.md',
    title: 'Write integration tests for auth flow',
    score: 1.2,
    priority: 6,
    effortScore: 4,
    focusCost: 5,
    estimatedTimeMin: 60,
    status: 'todo',
    tags: ['testing'],
    description: 'Cover login, refresh, and logout flows.',
  },
];

const mockPayload: WorkSurfacePayload = {
  tasks: mockTasks,
  total: mockTasks.length,
  mode: 'cod',
};

function StatefulTaskSection(props: { data: WorkSurfacePayload | undefined }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <TaskSection
      data={props.data}
      selectedId={selectedId}
      onSelect={(t) => setSelectedId(t?.id ?? null)}
    />
  );
}

const meta = {
  title: 'Work / TaskSection',
  component: TaskSection,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TaskSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTasks: Story = {
  render: () => <StatefulTaskSection data={mockPayload} />,
};

export const LocalMode: Story = {
  render: () => (
    <StatefulTaskSection data={{ ...mockPayload, mode: 'local' }} />
  ),
};

export const Empty: Story = {
  render: () => (
    <StatefulTaskSection data={{ tasks: [], total: 0, mode: 'cod' }} />
  ),
};

export const NoData: Story = {
  render: () => <StatefulTaskSection data={undefined} />,
};
