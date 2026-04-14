import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { SegmentedControl } from './Controls';

const meta = {
  title: 'UI / SegmentedControl',
  component: SegmentedControl,
  parameters: { layout: 'centered' },
  args: {
    options: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'done', label: 'Done' },
    ],
    value: 'all',
    onChange: () => {},
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoOptions: Story = {
  args: {
    options: [
      { value: 'read', label: 'Read' },
      { value: 'edit', label: 'Edit' },
    ],
    value: 'read',
  },
};

export const FourOptions: Story = {
  args: {
    options: [
      { value: 'overview', label: 'Overview' },
      { value: 'tasks', label: 'Tasks' },
      { value: 'knowledge', label: 'Knowledge' },
      { value: 'automation', label: 'Automation' },
    ],
    value: 'tasks',
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState('all');
    return (
      <div className="space-y-4">
        <SegmentedControl {...args} value={value} onChange={setValue} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Selected: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};
