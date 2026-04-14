import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { ProjectCard } from './ProjectCard';
import type { ProjectSummaryDisplay } from '../../types/display';

const meta = {
  title: 'Projects / ProjectCard',
  component: ProjectCard,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const base: ProjectSummaryDisplay = {
  id: 'proj-001',
  title: 'Vault Platform Redesign',
  statusLabel: 'On track',
  statusVariant: 'success',
  progressText: '18 / 30 tasks',
  progressPercent: 60,
  etaLabel: 'Jun 15',
  bestMoveTitle: 'Implement COD signal renderer',
};

export const Default: Story = {
  args: { project: base },
};

export const AtRisk: Story = {
  args: {
    project: {
      ...base,
      title: 'API v2 Migration',
      statusLabel: 'At risk',
      statusVariant: 'warning',
      progressText: '5 / 20 tasks',
      progressPercent: 25,
      etaLabel: 'Overdue',
      bestMoveTitle: 'Unblock auth middleware PR',
    },
  },
};

export const Blocked: Story = {
  args: {
    project: {
      ...base,
      title: 'Mobile App Launch',
      statusLabel: 'Blocked',
      statusVariant: 'danger',
      progressText: '10 / 15 tasks',
      progressPercent: 67,
      etaLabel: null,
      bestMoveTitle: 'Resolve App Store review rejection',
    },
  },
};

export const Completed: Story = {
  args: {
    project: {
      ...base,
      title: 'Phase 1 Foundation',
      statusLabel: 'Completed',
      statusVariant: 'default',
      progressText: '30 / 30 tasks',
      progressPercent: 100,
      etaLabel: null,
      bestMoveTitle: null,
    },
  },
};

export const NoBestMove: Story = {
  args: {
    project: {
      ...base,
      bestMoveTitle: null,
      etaLabel: null,
    },
  },
};

export const LowProgress: Story = {
  args: {
    project: {
      ...base,
      title: 'New Research Initiative',
      statusLabel: 'On track',
      statusVariant: 'success',
      progressText: '1 / 25 tasks',
      progressPercent: 4,
      etaLabel: 'Dec 1',
      bestMoveTitle: 'Define scope document',
    },
  },
};
