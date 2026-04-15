import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatThreadList } from './ChatThreadList';
import { MockAssistantRuntime } from './storybook-runtime';

const meta = {
  title: 'Chat/ChatThreadList',
  component: ChatThreadList,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChatThreadList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => (
    <div className="w-[320px]">
      <MockAssistantRuntime>
        <ChatThreadList />
      </MockAssistantRuntime>
    </div>
  ),
};
