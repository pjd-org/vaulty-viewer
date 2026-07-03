import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatThread } from './ChatThread';
import { MockAssistantRuntime } from './storybook-runtime';

const meta = {
  title: 'Chat/ChatThread',
  component: ChatThread,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChatThread>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => (
    <div className="h-[720px]">
      <MockAssistantRuntime>
        <ChatThread />
      </MockAssistantRuntime>
    </div>
  ),
};
