import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { IconButton } from './Buttons';

const meta = {
  title: 'UI / Atoms / IconButton',
  component: IconButton,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { icon: <span>✕</span>, label: 'Close' },
};

export const Disabled: Story = {
  args: { icon: <span>✕</span>, label: 'Close', disabled: true },
};

export const Refresh: Story = {
  args: { icon: <span>↻</span>, label: 'Refresh' },
};

export const Back: Story = {
  args: { icon: <span>←</span>, label: 'Back' },
};

export const Menu: Story = {
  args: { icon: <span>☰</span>, label: 'Menu' },
};

export const AllVariants: Story = {
  args: { icon: <span>✕</span> },
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        padding: 16,
        background: 'var(--surf-base, #f8fafc)',
        borderRadius: 12,
      }}
    >
      <IconButton icon={<span>✕</span>} label="Close" />
      <IconButton icon={<span>↻</span>} label="Refresh" />
      <IconButton icon={<span>←</span>} label="Back" />
      <IconButton icon={<span>☰</span>} label="Menu" />
      <IconButton icon={<span>✕</span>} label="Disabled" disabled />
    </div>
  ),
};
