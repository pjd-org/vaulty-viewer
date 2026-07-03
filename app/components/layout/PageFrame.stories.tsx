import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { PageFrame } from './PageFrame';

const meta = {
  title: 'Layout / PageFrame',
  component: PageFrame,
  parameters: { layout: 'padded' },
  args: {
    title: 'Dashboard',
    children: (
      <div
        className="rounded-[18px] p-6"
        style={{ background: 'var(--surf-utility)' }}
      >
        Page content goes here
      </div>
    ),
  },
} satisfies Meta<typeof PageFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSubtitle: Story = {
  args: {
    title: 'Knowledge',
    subtitle: 'Browse, search, and manage your vault notes.',
  },
};

export const WithStatusLine: Story = {
  args: {
    title: 'Inbox',
    subtitle: 'Triage incoming extractions and proposals.',
    statusLine: '4 items pending review',
    nextAction: '→ Open Inbox to triage',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Projects',
    subtitle: 'All active work streams.',
    actions: (
      <button
        type="button"
        className="btn-secondary rounded-xl px-4 py-2 text-sm font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        + New Project
      </button>
    ),
  },
};

export const Full: Story = {
  args: {
    title: 'Work Surface',
    subtitle: 'Execution queue and project command center.',
    statusLine: '12 tasks in queue · 3 blocked',
    nextAction: '→ Start with the top-ranked task',
    actions: (
      <button
        type="button"
        className="btn-secondary rounded-xl px-4 py-2 text-sm font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        Session planner
      </button>
    ),
  },
};
