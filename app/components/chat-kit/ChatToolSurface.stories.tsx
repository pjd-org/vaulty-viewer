import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatToolSurface } from './ChatToolSurface';

const meta = {
  title: 'Chat/ChatToolSurface',
  component: ChatToolSurface,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChatToolSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fallback: Story = {
  args: {
    toolName: 'mystery_tool',
    result: { ok: true },
  },
};
