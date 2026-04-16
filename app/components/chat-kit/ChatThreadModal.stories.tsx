import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatThreadModal } from './ChatThreadModal';
import { ChatComposer } from './ChatComposer';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatMessage } from './ChatMessage';
import { ChatRuntimeStatus } from './ChatRuntimeStatus';

const meta = {
  title: 'Chat / ChatThreadModal',
  component: ChatThreadModal,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ChatThreadModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    title: 'Primary Agent',
    subtitle: 'Full-screen modal shell wrapping ChatShell.',
    sidebar: (
      <div className="h-full p-4">
        <ChatRuntimeStatus state="idle" detail="No active thread" />
      </div>
    ),
    footer: (
      <ChatComposer
        value=""
        placeholder="Write a message..."
        onChange={() => undefined}
      />
    ),
    children: (
      <div className="flex h-full min-h-0 flex-col gap-6 p-4">
        <ChatEmptyState
          title="Start a conversation"
          subtitle="Ask for planning, execution, or a structured tool surface."
          suggestions={[
            { title: 'Make a plan', description: 'Use the plan tool surface' },
          ]}
        />
        <ChatMessage role="assistant" content="Ready when you are." />
      </div>
    ),
  },
};

export const WithMessages: Story = {
  args: {
    open: true,
    title: 'Active Thread',
    footer: (
      <ChatComposer
        value=""
        placeholder="Write a message..."
        onChange={() => undefined}
        runtimeState="running"
        runtimeDetail="Generating response"
      />
    ),
    children: (
      <div className="flex h-full min-h-0 flex-col gap-4 p-4">
        <ChatMessage role="user" content="Show me the current sprint plan." />
        <ChatMessage
          role="assistant"
          content="Here is the updated plan for Sprint 12. I'll render the plan surface now."
        />
      </div>
    ),
  },
};
