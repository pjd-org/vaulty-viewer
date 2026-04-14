import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { MetricLabel, MetaRow, ReasonText } from './Labels';

// ─── MetricLabel ─────────────────────────────────────────────────────────────

const metricMeta = {
  title: 'UI / MetricLabel',
  component: MetricLabel,
  parameters: { layout: 'centered' },
  args: { label: 'Tasks done', value: '12' },
} satisfies Meta<typeof MetricLabel>;

export default metricMeta;
type MetricStory = StoryObj<typeof metricMeta>;

export const Default: MetricStory = {};
export const WithSublabel: MetricStory = {
  args: { label: 'Focus hours', value: '4.5', sublabel: 'vs 3.2 last week' },
};
export const Success: MetricStory = {
  args: { label: 'Completed', value: '100%', variant: 'success' },
};
export const Warning: MetricStory = {
  args: { label: 'Stress', value: '7/10', variant: 'warning' },
};
export const Danger: MetricStory = {
  args: { label: 'Blocked', value: '3', variant: 'danger' },
};

export const Row: MetricStory = {
  render: () => (
    <div className="flex gap-8">
      <MetricLabel label="Tasks" value="24" />
      <MetricLabel label="Done" value="18" variant="success" />
      <MetricLabel label="Blocked" value="3" variant="danger" />
      <MetricLabel label="Focus h" value="5.5" sublabel="today" />
    </div>
  ),
};
