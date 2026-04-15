import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatToolSurface } from './ChatToolSurface';

const meta = {
  title: 'Chat/ChatPlan',
  component: ChatToolSurface,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChatToolSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    toolName: 'show_plan',
    result: {
      id: 'plan-story',
      title: 'Release checklist',
      description: 'Ship with confidence.',
      todos: [
        { id: 'todo-1', label: 'Prep release notes', status: 'completed' },
        { id: 'todo-2', label: 'Cut release', status: 'pending' },
      ],
    },
  },
};
