import type { Meta, StoryObj } from '@storybook/react-vite';
import { TaskSeverityBadge } from './TaskSeverityBadge';

const meta = {
  title: 'Home / TaskSeverityBadge',
  component: TaskSeverityBadge,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TaskSeverityBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Critical: Story = {
  args: { priority: 9, confidencePct: 87 },
};

export const High: Story = {
  args: { priority: 6, confidencePct: 64 },
};

export const Normal: Story = {
  args: { priority: 2, confidencePct: 22 },
};
