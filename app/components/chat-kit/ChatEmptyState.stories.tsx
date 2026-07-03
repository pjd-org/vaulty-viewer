import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatEmptyState } from './ChatEmptyState';

const meta = {
  title: 'Chat/ChatEmptyState',
  component: ChatEmptyState,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChatEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Start a conversation',
    subtitle: 'Use the chat kit to drive planning and execution.',
    suggestions: [
      { title: 'Draft a plan', description: 'Open the plan tool surface' },
      {
        title: 'Review progress',
        description: 'Open the progress tracker surface',
      },
    ],
  },
};
