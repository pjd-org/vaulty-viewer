import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { ActionGuidancePanel } from './ActionGuidancePanel';
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

const mediumReadiness: ReadinessState = {
  level: 'medium',
  label: 'Sustained execution',
  description: 'Medium-focus tasks. Avoid switching costs.',
  color: 'var(--readiness-medium, #3b82f6)',
  sessionType: 'steady',
  maxFocusCost: 6,
  maxEffortScore: 6,
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
  title: 'Avatar / ActionGuidancePanel',
  component: ActionGuidancePanel,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: {
    readiness: deepReadiness,
    capacity: { timeBudgetMin: 90, focusCostMax: 7, effortScoreMax: 7 },
  },
} satisfies Meta<typeof ActionGuidancePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DeepWork: Story = {};

export const SteadyWork: Story = {
  args: {
    readiness: mediumReadiness,
    capacity: { timeBudgetMin: 60, focusCostMax: 6, effortScoreMax: 6 },
  },
};

export const LightWork: Story = {
  args: {
    readiness: shallowReadiness,
    capacity: { timeBudgetMin: 30, focusCostMax: 4, effortScoreMax: 4 },
  },
};

export const Recovery: Story = {
  args: {
    readiness: recoverReadiness,
    capacity: { timeBudgetMin: 15, focusCostMax: 2, effortScoreMax: 2 },
  },
};

export const NoBudget: Story = {
  args: {
    readiness: mediumReadiness,
    capacity: {},
  },
};

export const WithFocusFilter: Story = {
  args: {
    readiness: shallowReadiness,
    capacity: { timeBudgetMin: 45, focusCostMax: 3, effortScoreMax: 3 },
  },
};
