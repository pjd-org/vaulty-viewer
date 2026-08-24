import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { fn } from 'storybook/test';
import { InboxViewSwitcher } from './InboxViewSwitcher';

type InboxTab = 'signals' | 'queue' | 'workbench' | 'archive';

function StatefulSwitcher({ initial = 'signals' as InboxTab }) {
  const [view, setView] = useState<InboxTab>(initial);
  return (
    <InboxViewSwitcher
      value={view}
      onValueChange={setView}
      counts={{ signals: 3, queue: 5, workbench: 2, archive: 14 }}
    />
  );
}

const meta = {
  title: 'Inbox / InboxViewSwitcher',
  component: InboxViewSwitcher,
  parameters: { layout: 'padded' },
  args: {
    onValueChange: fn(),
    counts: { signals: 3, queue: 5, workbench: 2, archive: 14 },
  },
} satisfies Meta<typeof InboxViewSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const QueueActive: Story = {
  args: { value: 'queue' },
};

export const WorkbenchActive: Story = {
  args: { value: 'workbench' },
};

export const ArchiveActive: Story = {
  args: { value: 'archive' },
};

export const ZeroCounts: Story = {
  args: {
    value: 'queue',
    counts: { signals: 0, queue: 0, workbench: 0, archive: 0 },
  },
};

export const LargeCounts: Story = {
  args: {
    value: 'workbench',
    counts: { signals: 9, queue: 143, workbench: 27, archive: 512 },
  },
};

export const Interactive: Story = {
  args: { value: 'queue' },
  render: () => <StatefulSwitcher initial="queue" />,
};
