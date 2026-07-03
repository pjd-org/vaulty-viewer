import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatToolSurface } from './ChatToolSurface';

const meta = {
  title: 'Chat/ChatApprovalCard',
  component: ChatToolSurface,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChatToolSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    toolName: 'approval-card',
    result: {
      title: 'Approve release',
      description: 'Review the release package before sending it out.',
    },
  },
};
