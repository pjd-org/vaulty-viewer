import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActiveSessionBanner } from './ActiveSessionBanner';
import type { ActiveSession } from '../../../src/lib/focus-logic';

const now = new Date().toISOString();
const minus42min = new Date(Date.now() - 42 * 60 * 1000).toISOString();

const baseSession: ActiveSession = {
  id: 'sess-abc123',
  status: 'active',
  title: 'Morning deep work block',
  budgetMin: 90,
  startedAt: minus42min,
  tasks: [
    { id: 't1', title: 'Task 1', path: 'notes/tasks/t1.md', status: 'done' },
    { id: 't2', title: 'Task 2', path: 'notes/tasks/t2.md', status: 'done' },
    {
      id: 't3',
      title: 'Task 3',
      path: 'notes/tasks/t3.md',
      status: 'in_progress',
    },
    { id: 't4', title: 'Task 4', path: 'notes/tasks/t4.md', status: 'pending' },
  ],
};

const meta = {
  title: 'Home / ActiveSessionBanner',
  component: ActiveSessionBanner,
  parameters: { layout: 'padded' },
  args: {
    session: baseSession,
    onResume: () => {},
    onEnd: () => {},
  },
} satisfies Meta<typeof ActiveSessionBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const JustStarted: Story = {
  args: {
    session: {
      ...baseSession,
      startedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      tasks: [
        {
          id: 't1',
          title: 'Task 1',
          path: 'notes/tasks/t1.md',
          status: 'pending',
        },
      ],
    },
  },
};

export const AllTasksDone: Story = {
  args: {
    session: {
      ...baseSession,
      title: 'Bug triage sprint',
      tasks: [
        {
          id: 't1',
          title: 'Task 1',
          path: 'notes/tasks/t1.md',
          status: 'done',
        },
        {
          id: 't2',
          title: 'Task 2',
          path: 'notes/tasks/t2.md',
          status: 'done',
        },
        {
          id: 't3',
          title: 'Task 3',
          path: 'notes/tasks/t3.md',
          status: 'done',
        },
      ],
    },
  },
};

export const NoTitle: Story = {
  args: {
    session: {
      ...baseSession,
      title: undefined,
    },
  },
};

export const NoTasks: Story = {
  args: {
    session: {
      ...baseSession,
      title: 'Exploratory session',
      tasks: [],
    },
  },
};

export const FreshNoStartTime: Story = {
  args: {
    session: {
      ...baseSession,
      startedAt: undefined,
      tasks: [],
    },
  },
};
