import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatMessage } from './ChatMessage';
import { ChatToolSurface } from './ChatToolSurface';

const meta = {
  title: 'Chat/ChatMessage',
  component: ChatMessage,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChatMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Assistant: Story = {
  args: {
    role: 'assistant',
    content: 'I can help you plan, inspect, and execute.',
  },
};

export const User: Story = {
  args: {
    role: 'user',
    content: 'Build me a release plan.',
  },
};

export const WithTool: Story = {
  args: {
    role: 'assistant',
    content: 'I prepared a plan for the release.',
    toolSurface: (
      <ChatToolSurface
        toolName="show_plan"
        result={{
          id: 'plan-story',
          title: 'Release checklist',
          description: 'Ship with confidence.',
          todos: [
            { id: 'todo-1', label: 'Prep release notes', status: 'completed' },
            { id: 'todo-2', label: 'Cut release', status: 'pending' },
          ],
        }}
      />
    ),
  },
};
