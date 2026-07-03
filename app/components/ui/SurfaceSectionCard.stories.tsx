import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { SurfaceSectionCard } from './SurfaceChrome';

const meta = {
  title: 'UI / Organisms / SurfaceSectionCard',
  component: SurfaceSectionCard,
  parameters: { layout: 'padded' },
  args: {
    title: 'Section Title',
    children: (
      <p className="text-sm text-slate-600">Section content goes here.</p>
    ),
  },
} satisfies Meta<typeof SurfaceSectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Muted: Story = {
  args: { tone: 'muted', title: 'Active Projects', subtitle: '3 running' },
};

export const Neutral: Story = {
  args: { tone: 'neutral', title: 'Notes' },
};

export const Accent: Story = {
  args: { tone: 'accent', title: 'Highlights', subtitle: 'This week' },
};

export const NoSubtitle: Story = {
  args: { tone: 'muted', title: 'Blockers' },
};

export const WithRichContent: Story = {
  render: () => (
    <SurfaceSectionCard title="Sprint Status" subtitle="Week 16" tone="neutral">
      <ul className="space-y-1 text-sm text-slate-600">
        <li>✅ 8 tasks completed</li>
        <li>🔄 3 tasks in progress</li>
        <li>🚫 1 task blocked</li>
      </ul>
    </SurfaceSectionCard>
  ),
};
