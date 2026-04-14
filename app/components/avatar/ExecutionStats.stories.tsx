import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExecutionStats } from './ExecutionStats';

const meta = {
  title: 'Avatar / ExecutionStats',
  component: ExecutionStats,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ExecutionStats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveDay: Story = {
  args: {
    vitals: {
      tasksCompletedToday: 5,
      sessionsCompletedThisWeek: 8,
    },
  },
};

export const SingleTask: Story = {
  args: {
    vitals: {
      tasksCompletedToday: 1,
      sessionsCompletedThisWeek: 3,
    },
  },
};

export const SessionsOnly: Story = {
  args: {
    vitals: {
      tasksCompletedToday: 0,
      sessionsCompletedThisWeek: 4,
    },
  },
};

export const TasksOnly: Story = {
  args: {
    vitals: {
      tasksCompletedToday: 7,
      sessionsCompletedThisWeek: 0,
    },
  },
};

// Returns null — nothing rendered
export const Empty: Story = {
  args: {
    vitals: {},
  },
};

export const HighVolume: Story = {
  args: {
    vitals: {
      tasksCompletedToday: 23,
      sessionsCompletedThisWeek: 14,
    },
  },
};
