import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { MetricLabel, MetaRow, ReasonText } from './Labels';

/* ── MetricLabel ───────────────────────────────────────────────────────────── */
const metricMeta = {
  title: 'UI / Labels / MetricLabel',
  component: MetricLabel,
  parameters: { layout: 'centered' },
  args: { label: 'Tasks done', value: '42' },
} satisfies Meta<typeof MetricLabel>;

export default metricMeta;
type Story = StoryObj<typeof metricMeta>;

export const Default: Story = {};
export const WithSublabel: Story = { args: { sublabel: '+3 this week' } };
export const Success: Story = { args: { variant: 'success', value: '98%' } };
export const Warning: Story = { args: { variant: 'warning', value: '12' } };
export const Danger: Story = { args: { variant: 'danger', value: '0' } };
