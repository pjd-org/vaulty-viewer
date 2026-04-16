import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'UI / Organisms / EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
  args: { title: 'Nothing here yet' },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithDescription: Story = {
  args: {
    title: 'No inbox items',
    description: 'All caught up. Come back after the next agent run.',
  },
};
export const WithIcon: Story = {
  args: {
    icon: <span style={{ fontSize: 32 }}>📭</span>,
    title: 'No inbox items',
    description: 'All caught up.',
  },
};
export const WithAction: Story = {
  args: {
    icon: <span style={{ fontSize: 32 }}>📭</span>,
    title: 'No inbox items',
    description: 'All caught up.',
    action: (
      <button
        type="button"
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid #ccc',
        }}
      >
        Trigger run
      </button>
    ),
  },
};
