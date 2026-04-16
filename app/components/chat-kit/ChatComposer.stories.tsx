import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatComposer } from './ChatComposer';
import { CHAT_ACCENTS } from './accent';

const meta = {
  title: 'Chat/ChatComposer',
  component: ChatComposer,
  parameters: { layout: 'padded' },
  argTypes: {
    accentColor: {
      control: 'select',
      options: CHAT_ACCENTS,
    },
  },
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    value: '',
    placeholder: 'Send a message...',
    runtimeState: 'idle',
    runtimeDetail: 'No active thread',
    onChange: () => undefined,
    onAttach: () => undefined,
    onToolSelect: () => undefined,
  },
};

export const RunningAccent: Story = {
  args: {
    value: 'Run the plan',
    isRunning: true,
    runtimeState: 'running',
    runtimeDetail: 'Generating response',
    accentColor: 'var(--a-sky)',
    onChange: () => undefined,
    onAttach: () => undefined,
    onToolSelect: () => undefined,
    onCancel: () => undefined,
  },
};

export const Running: Story = {
  args: {
    value: 'Run the plan',
    isRunning: true,
    runtimeState: 'running',
    runtimeDetail: 'Generating response',
    onChange: () => undefined,
    onAttach: () => undefined,
    onToolSelect: () => undefined,
    onCancel: () => undefined,
  },
};

export const AccentMatrix: Story = {
  args: {
    value: '',
  },
  render: (_args) => (
    <div className="grid gap-4 xl:grid-cols-2">
      {CHAT_ACCENTS.map((accentColor) => (
        <div key={accentColor} className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            {accentColor}
          </p>
          <ChatComposer
            value=""
            placeholder="Send a message..."
            runtimeState="idle"
            runtimeDetail="Accent palette demo"
            accentColor={accentColor}
            onChange={() => undefined}
            onAttach={() => undefined}
            onToolSelect={() => undefined}
          />
        </div>
      ))}
    </div>
  ),
};
