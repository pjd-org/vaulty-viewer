import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { fn } from 'storybook/test';
import { InboxViewSwitcher } from './InboxViewSwitcher';

type InboxTab = 'queue' | 'workbench' | 'archive';

function StatefulSwitcher({ initial = 'queue' as InboxTab }) {
  const [view, setView] = useState<InboxTab>(initial);
  return (
    <InboxViewSwitcher
      view={view}
      onChange={setView}
      counts={{ queue: 5, workbench: 2, archive: 14 }}
    />
  );
}

const meta = {
  title: 'Inbox / InboxViewSwitcher',
  component: InboxViewSwitcher,
  parameters: { layout: 'padded' },
  args: {
    onChange: fn(),
    counts: { queue: 5, workbench: 2, archive: 14 },
  },
} satisfies Meta<typeof InboxViewSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const QueueActive: Story = {
  args: { view: 'queue' },
};

export const WorkbenchActive: Story = {
  args: { view: 'workbench' },
};

export const ArchiveActive: Story = {
  args: { view: 'archive' },
};

export const ZeroCounts: Story = {
  args: {
    view: 'queue',
    counts: { queue: 0, workbench: 0, archive: 0 },
  },
};

export const LargeCounts: Story = {
  args: {
    view: 'workbench',
    counts: { queue: 143, workbench: 27, archive: 512 },
  },
};

export const Interactive: Story = {
  args: { view: 'queue' },
  render: () => <StatefulSwitcher initial="queue" />,
};
