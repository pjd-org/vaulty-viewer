import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { MetricCard } from './SurfaceChrome';

const meta = {
  title: 'UI / Molecules / MetricCard',
  component: MetricCard,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <MetricCard>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Tasks Done
      </p>
      <p className="text-2xl font-bold text-slate-800">42</p>
    </MetricCard>
  ),
};

export const Compact: Story = {
  render: () => (
    <MetricCard compact>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Done
      </p>
      <p className="text-xl font-bold text-slate-800">42</p>
    </MetricCard>
  ),
};

export const MultipleMetrics: Story = {
  render: () => (
    <div className="flex gap-4">
      <MetricCard>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Completed
        </p>
        <p className="text-2xl font-bold text-slate-800">18</p>
      </MetricCard>
      <MetricCard>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          In Progress
        </p>
        <p className="text-2xl font-bold text-slate-800">5</p>
      </MetricCard>
      <MetricCard>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Blocked
        </p>
        <p className="text-2xl font-bold text-slate-800">2</p>
      </MetricCard>
    </div>
  ),
};
