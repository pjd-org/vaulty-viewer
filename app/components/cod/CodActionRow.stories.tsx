import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { CodActionRow } from './CodActionRow';
import type { Recommendation } from '../../lib/viewer-adapter';

const RouterDecorator = (Story: () => React.ReactNode) => {
  const rootRoute = createRootRoute({ component: () => <Story /> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  return <RouterProvider router={router} />;
};

const recommendations: Recommendation[] = [
  {
    id: 'rec-1',
    title: 'Kick off phase-3 implementation',
    summary: 'Phase 3 plan is approved and all blockers resolved.',
    actionType: 'approve',
    surfacedBy: 'cod',
    sourceSignalIds: [],
    sourceEntities: [],
    score: 0.91,
    scoreBreakdown: {
      urgency: 0.8,
      impact: 0.9,
      blockageRemoval: 0.7,
      reversibility: 0.6,
      confidence: 0.88,
    },
    whyNow: 'All blockers resolved. Milestone window opens today.',
    expectedEffect: 'Unblocks 4 dependent tasks and closes Q2 gap.',
    confidence: 0.88,
    reversibility: 'medium',
  },
  {
    id: 'rec-2',
    title: 'Defer low-priority refactor ticket',
    summary: 'Low reward, high effort — reschedule to next sprint.',
    actionType: 'defer',
    surfacedBy: 'cod',
    sourceSignalIds: [],
    sourceEntities: [],
    score: 0.45,
    scoreBreakdown: {
      urgency: 0.2,
      impact: 0.4,
      blockageRemoval: 0.1,
      reversibility: 0.9,
      confidence: 0.72,
    },
    whyNow: 'Low urgency; no milestone dependency.',
    expectedEffect: 'Frees focus for higher-priority work.',
    confidence: 0.72,
    reversibility: 'high',
  },
];

const meta = {
  title: 'COD / CodActionRow',
  component: CodActionRow,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CodActionRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const V3Recommendations: Story = {
  args: {
    recommendations,
    onExecute: () => {},
    onSimulate: () => {},
    onDefer: () => {},
  },
};

export const SingleRecommendation: Story = {
  args: {
    recommendations: [recommendations[0]],
    onExecute: () => {},
    onSimulate: () => {},
  },
};

export const V1LegacyActions: Story = {
  args: {
    actions: ['Start 25m sprint', 'Check in', 'Browse safe tasks'],
    canWork: true,
    onCheckIn: () => {},
  },
};

export const V1Disabled: Story = {
  args: {
    actions: ['Start 25m sprint', 'Start full session'],
    canWork: false,
  },
};
