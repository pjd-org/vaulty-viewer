import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SoftChip, StatusPill } from './Chips';

/* ── SoftChip ──────────────────────────────────────────────────────────────── */
const chipMeta = {
  title: 'UI / Molecules / SoftChip',
  component: SoftChip,
  parameters: { layout: 'centered' },
  args: { label: 'Label' },
} satisfies Meta<typeof SoftChip>;

export default chipMeta;
type Story = StoryObj<typeof chipMeta>;

export const Default: Story = {};
export const Primary: Story = { args: { variant: 'primary', label: 'Active' } };
export const Success: Story = { args: { variant: 'success', label: 'Done' } };
export const Warning: Story = {
  args: { variant: 'warning', label: 'Pending' },
};
export const Danger: Story = { args: { variant: 'danger', label: 'Blocked' } };
export const WithRemove: Story = {
  args: { label: 'Remove me', onRemove: () => {} },
};
export const WithIcon: Story = {
  args: { label: 'Tagged', icon: <span aria-hidden>🏷</span> },
};
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <SoftChip label="Default" variant="default" />
      <SoftChip label="Primary" variant="primary" />
      <SoftChip label="Success" variant="success" />
      <SoftChip label="Warning" variant="warning" />
      <SoftChip label="Danger" variant="danger" />
    </div>
  ),
};
