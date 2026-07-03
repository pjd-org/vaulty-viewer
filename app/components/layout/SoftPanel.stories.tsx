import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SoftPanel } from './SoftPanel';

const meta = {
  title: 'Layout / SoftPanel',
  component: SoftPanel,
  parameters: { layout: 'padded' },
  args: {
    children: (
      <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
        Panel content goes here.
      </p>
    ),
  },
} satisfies Meta<typeof SoftPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Base: Story = {};
export const Elevated: Story = {
  args: { variant: 'elevated', title: 'Elevated' },
};
export const Hero: Story = { args: { variant: 'hero', title: 'Hero panel' } };
export const Utility: Story = {
  args: { variant: 'utility', title: 'Utility panel' },
};
export const WithHeader: Story = {
  args: {
    title: 'Session planner',
    subtitle: 'Pick tasks for this session',
    variant: 'elevated',
  },
};
export const WithActions: Story = {
  args: {
    title: 'Projects',
    actions: (
      <button type="button" style={{ fontSize: 12 }}>
        + New
      </button>
    ),
    variant: 'base',
  },
};
export const NoPadding: Story = {
  args: {
    title: 'Custom padded content',
    noPadding: true,
    children: (
      <div
        style={{
          padding: '24px 24px 24px',
          background: '#f8fafc',
          borderRadius: '0 0 22px 22px',
        }}
      >
        Custom padded content
      </div>
    ),
  },
};
