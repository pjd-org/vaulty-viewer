import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionPlannerCard } from './SessionPlannerCard';
import type { NextAction } from '../../../src/lib/focus-logic';

/** Stub QueryClient — all queries remain idle so the AI planner never fires. */
function makeIdleQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { enabled: false, retry: false, staleTime: Infinity },
    },
  });
}

const QueryDecorator = (Story: () => React.ReactNode) => (
  <QueryClientProvider client={makeIdleQueryClient()}>
    <Story />
  </QueryClientProvider>
);

const sampleTasks: NextAction[] = [
  {
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
  },
  {
    id: 'task-002',
    path: 'notes/tasks/write-stories.md',
    title: 'Write Storybook stories for migrated components',
    score: 1.6,
    priority: 7,
    effortScore: 4,
    focusCost: 4,
    estimatedTimeMin: 120,
    status: 'todo',
    tags: ['storybook', 'frontend'],
  },
  {
    id: 'task-003',
    path: 'notes/tasks/fix-auth.md',
    title: 'Fix auth regression from last deploy',
    score: 2.1,
    priority: 10,
    effortScore: 7,
    focusCost: 8,
    estimatedTimeMin: 45,
    status: 'blocked',
    tags: ['auth', 'backend'],
  },
  {
    id: 'task-004',
    path: 'notes/tasks/update-docs.md',
    title: 'Update architecture docs',
    score: 0.9,
    priority: 5,
    effortScore: 2,
    focusCost: 2,
    estimatedTimeMin: 30,
    status: 'todo',
    tags: ['docs'],
  },
];

const meta = {
  title: 'Home / SessionPlannerCard',
  component: SessionPlannerCard,
  decorators: [QueryDecorator],
  parameters: { layout: 'padded' },
  args: {
    tasks: sampleTasks,
    onStart: () => {},
  },
} satisfies Meta<typeof SessionPlannerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed (default) — shows the "Plan a session →" button. */
export const Collapsed: Story = {};

/** Note: clicking "Plan a session →" in Storybook will expand the card.
 *  The AI planner button is visible but remains idle (no real agent call). */
export const WithTasks: Story = {
  args: { tasks: sampleTasks },
};

export const SingleTask: Story = {
  args: { tasks: [sampleTasks[0]] },
};

export const Empty: Story = {
  args: { tasks: [] },
};
