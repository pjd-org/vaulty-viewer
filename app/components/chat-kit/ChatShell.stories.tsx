import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatComposer } from './ChatComposer';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatMessage } from './ChatMessage';
import { ChatRuntimeStatus } from './ChatRuntimeStatus';
import { ChatThreadModal } from './ChatThreadModal';

const meta = {
  title: 'Chat/ChatShell',
  component: ChatThreadModal,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ChatThreadModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Primary Agent',
    subtitle: 'Reusable shell with assistant-ui content and tool UI layers.',
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
            {
              title: 'Show progress',
              description: 'Render a tracker for multi-step work',
            },
          ]}
        />
        <ChatMessage role="assistant" content="Ready when you are." />
      </div>
    ),
  },
};
