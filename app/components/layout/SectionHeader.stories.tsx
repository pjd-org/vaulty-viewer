import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SectionHeader } from './SectionHeader';

const meta = {
  title: 'Layout / SectionHeader',
  component: SectionHeader,
  parameters: { layout: 'padded' },
  args: { title: 'Recent activity' },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithSubtitle: Story = {
  args: { title: 'Recent activity', subtitle: 'Last 7 days' },
};
export const WithAction: Story = {
  args: {
    title: 'Inbox',
    subtitle: '4 items need review',
    action: (
      <button type="button" style={{ fontSize: 12 }}>
        View all →
      </button>
    ),
  },
};
