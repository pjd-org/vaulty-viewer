import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SurfaceChip } from './SurfaceChrome';

const meta = {
  title: 'UI / Atoms / SurfaceChip',
  component: SurfaceChip,
  parameters: { layout: 'padded' },
  args: {
    children: 'Label',
  },
} satisfies Meta<typeof SurfaceChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: { tone: 'neutral', children: 'Neutral' },
};

export const Accent: Story = {
  args: { tone: 'accent', children: 'Accent' },
};

export const Muted: Story = {
  args: { tone: 'muted', children: 'Muted' },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex gap-3 flex-wrap">
      <SurfaceChip tone="neutral">Neutral</SurfaceChip>
      <SurfaceChip tone="accent">Accent</SurfaceChip>
      <SurfaceChip tone="muted">Muted</SurfaceChip>
    </div>
  ),
};
