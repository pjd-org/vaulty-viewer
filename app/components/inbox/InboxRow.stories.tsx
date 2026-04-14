import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { InboxRow } from './InboxRow';
import type { InboxItem } from '../../lib/viewer-adapter';
import type { Run } from './InboxRow';

const baseItem: InboxItem = {
  id: 'inbox-001',
  kind: 'failure',
  title: 'API health check failed on /api/v1/tasks',
  summary: 'The endpoint returned 503 twice in the last 10 minutes.',
  severity: 'high',
  surfacedBy: 'cod',
  sourceType: 'task',
  sourceId: 'src-001',
  surfacedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  whySurfaced:
    'Repeated health check failures detected by the runtime watcher.',
  reversibility: 'high',
  inboxBucket: 'needs_action',
};

const baseRun: Run = {
  runId: 'run-abc123',
  runType: 'signals_infer',
  itemCount: 3,
  confidence: 0.91,
  items: [],
};

const meta = {
  title: 'Inbox / InboxRow',
  component: InboxRow,
  parameters: { layout: 'padded' },
  args: {
    item: baseItem,
    onInspect: () => {},
    onPromote: () => {},
    onReject: () => {},
    actionInFlight: false,
  },
} satisfies Meta<typeof InboxRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithRun: Story = {
  args: { run: baseRun },
};

export const CriticalSeverity: Story = {
  args: {
    item: {
      ...baseItem,
      severity: 'critical',
      title: 'Database write failure — data loss risk',
    },
    run: baseRun,
  },
};

export const MediumSeverity: Story = {
  args: {
    item: {
      ...baseItem,
      severity: 'medium',
      title: 'Stale note detected in knowledge base',
      whySurfaced: 'Note has not been updated in 30 days.',
      reversibility: 'medium',
    },
  },
};

export const Irreversible: Story = {
  args: {
    item: {
      ...baseItem,
      title: 'Delete archived pipeline data',
      severity: 'low',
      reversibility: 'low',
      whySurfaced: 'Scheduled purge — irreversible action.',
    },
    run: { ...baseRun, runType: 'manual', confidence: undefined, itemCount: 1 },
  },
};

export const ActionInFlight: Story = {
  args: { run: baseRun, actionInFlight: true },
};

export const NoActions: Story = {
  args: {
    item: { ...baseItem, inboxBucket: 'rejected_user', rejectionType: 'user' },
    onPromote: undefined,
    onReject: undefined,
  },
};

export const ConversationRun: Story = {
  args: {
    item: {
      ...baseItem,
      severity: 'medium',
      title: 'Task extracted from conversation',
    },
    run: {
      ...baseRun,
      runType: 'conversation',
      confidence: 0.75,
      itemCount: 1,
    },
  },
};
