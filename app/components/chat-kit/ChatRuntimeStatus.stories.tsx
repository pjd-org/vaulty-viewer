import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatRuntimeStatus } from './ChatRuntimeStatus';

const meta = {
  title: 'Chat/ChatRuntimeStatus',
  component: ChatRuntimeStatus,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChatRuntimeStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    state: 'idle',
    detail: 'No active thread',
  },
};

export const Running: Story = {
  args: {
    state: 'running',
    detail: 'Generating a response',
  },
};

export const Degraded: Story = {
  args: {
    state: 'degraded',
    detail: 'Tool fallback is active',
  },
};
