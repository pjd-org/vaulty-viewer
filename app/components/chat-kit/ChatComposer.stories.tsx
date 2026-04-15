import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatComposer } from './ChatComposer';

const meta = {
  title: 'Chat/ChatComposer',
  component: ChatComposer,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    value: '',
    placeholder: 'Send a message...',
    onChange: () => undefined,
  },
};

export const Running: Story = {
  args: {
    value: 'Run the plan',
    isRunning: true,
    onChange: () => undefined,
  },
};
