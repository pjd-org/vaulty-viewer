import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SoftChip, StatusPill } from './Chips';

// ─── SoftChip ────────────────────────────────────────────────────────────────

const chipMeta = {
  title: 'UI / SoftChip',
  component: SoftChip,
  parameters: { layout: 'centered' },
  args: { label: 'Label' },
} satisfies Meta<typeof SoftChip>;

export default chipMeta;
type ChipStory = StoryObj<typeof chipMeta>;

export const Default: ChipStory = { args: { variant: 'default' } };
export const Primary: ChipStory = {
  args: { label: 'Primary', variant: 'primary' },
};
export const Success: ChipStory = {
  args: { label: 'Success', variant: 'success' },
};
export const Warning: ChipStory = {
  args: { label: 'Warning', variant: 'warning' },
};
export const Danger: ChipStory = {
  args: { label: 'Danger', variant: 'danger' },
};

export const WithIcon: ChipStory = {
  args: {
    label: 'Frontend',
    variant: 'default',
    icon: <span aria-hidden>⚡</span>,
  },
};

export const Removable: ChipStory = {
  args: {
    label: 'Removable',
    variant: 'default',
    onRemove: () => {},
  },
};

export const AllVariants: ChipStory = {
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
