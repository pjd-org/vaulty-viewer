import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { ReadinessHeader } from './ReadinessHeader';
import type { ReadinessState } from '../../../src/lib/readiness-logic';

function makeStubRouter(Story: () => React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Story /> });
  return createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
}

const RouterDecorator = (Story: () => React.ReactNode) => (
  <RouterProvider router={makeStubRouter(Story)} />
);

const deepReadiness: ReadinessState = {
  level: 'deep',
  label: 'Deep work window',
  description: 'Good for focused, high-effort execution.',
  color: 'var(--readiness-deep, #10b981)',
  sessionType: 'deep',
  maxFocusCost: undefined,
  maxEffortScore: undefined,
};

const shallowReadiness: ReadinessState = {
  level: 'shallow',
  label: 'Light task mode',
  description: 'Prefer short, low-friction tasks. Avoid deep work.',
  color: 'var(--readiness-shallow, #f59e0b)',
  sessionType: 'light',
  maxFocusCost: 4,
  maxEffortScore: 4,
};

const recoverReadiness: ReadinessState = {
  level: 'recover',
  label: 'Recovery mode',
  description: 'Low energy and high stress. Minimal execution recommended.',
  color: 'var(--readiness-recover, #ef4444)',
  sessionType: 'minimal',
  maxFocusCost: 2,
  maxEffortScore: 2,
};

const meta = {
  title: 'Avatar / ReadinessHeader',
  component: ReadinessHeader,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: {
    profile: { name: 'Darry', title: 'Systems Builder' },
    readiness: deepReadiness,
    flags: {},
    stale: false,
    updated: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    loading: false,
    apiStatus: 'online',
    onRefresh: () => {},
    capacityLabel: 'Focus ≤ 6 · Effort ≤ 6',
    timeBudgetLabel: '1h 30m',
  },
} satisfies Meta<typeof ReadinessHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Online: Story = {
  args: { apiStatus: 'online' },
};

export const Offline: Story = {
  args: { apiStatus: 'offline' },
};

export const Loading: Story = {
  args: { loading: true },
};

export const Stale: Story = {
  args: {
    stale: true,
    updated: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
};

export const WithFlags: Story = {
  args: {
    flags: { stagnation: true, entropyWarning: true },
    stale: true,
    updated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
};

export const ShallowMode: Story = {
  args: {
    readiness: shallowReadiness,
    capacityLabel: 'Focus ≤ 4 · Effort ≤ 4',
    timeBudgetLabel: '45m',
  },
};

export const RecoveryMode: Story = {
  args: {
    readiness: recoverReadiness,
    capacityLabel: 'Focus ≤ 2 · Effort ≤ 2',
    timeBudgetLabel: null,
    flags: { stagnation: true },
  },
};

export const AnonymousProfile: Story = {
  args: {
    profile: {},
    timeBudgetLabel: null,
    capacityLabel: 'No capacity set',
  },
};

export const NoTimeBudget: Story = {
  args: {
    timeBudgetLabel: null,
    capacityLabel: 'No capacity set',
  },
};
