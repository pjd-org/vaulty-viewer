import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatToolSurface } from './ChatToolSurface';

const meta = {
  title: 'Chat/ChatProgressTracker',
  component: ChatToolSurface,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChatToolSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    toolName: 'show_progress',
    result: {
      id: 'progress-story',
      title: 'Release flow',
      description: 'Track the current workflow state.',
      steps: [
        { id: 'step-1', label: 'Plan', status: 'completed' },
        { id: 'step-2', label: 'Ship', status: 'in-progress' },
      ],
    },
  },
};
