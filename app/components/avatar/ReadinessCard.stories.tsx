import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { makeLiveEditStory } from 'storybook-addon-code-editor';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { ReadinessCard } from '../ui/ReadinessCard';
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
  color: 'var(--readiness-deep)',
  sessionType: 'deep work',
  maxFocusCost: 10,
  maxEffortScore: 10,
};

const mediumReadiness: ReadinessState = {
  level: 'medium',
  label: 'Sustained execution',
  description: 'Medium-focus tasks. Avoid switching costs.',
  color: 'var(--readiness-medium)',
  sessionType: 'execution',
  maxFocusCost: 6,
  maxEffortScore: 7,
};

const shallowReadiness: ReadinessState = {
  level: 'shallow',
  label: 'Light work mode',
  description: 'Low-friction tasks only. Avoid deep focus.',
  color: 'var(--readiness-shallow)',
  sessionType: 'light',
  maxFocusCost: 3,
  maxEffortScore: 4,
};

const recoverReadiness: ReadinessState = {
  level: 'recover',
  label: 'Recovery mode',
  description: 'Rest or minimal-effort maintenance only.',
  color: 'var(--readiness-recover)',
  sessionType: 'recovery',
  maxFocusCost: 1,
  maxEffortScore: 2,
};

const meta = {
  title: 'Avatar / ReadinessCard',
  component: ReadinessCard,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: {
    readiness: deepReadiness,
    capacityLabel: 'Full capacity',
    timeBudgetLabel: '2 h available',
  },
} satisfies Meta<typeof ReadinessCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Deep: Story = {};

export const Medium: Story = {
  args: {
    readiness: mediumReadiness,
    capacityLabel: 'Medium capacity',
    timeBudgetLabel: '1 h 30 min available',
  },
};

export const Shallow: Story = {
  args: {
    readiness: shallowReadiness,
    capacityLabel: 'Low capacity',
    timeBudgetLabel: '45 min available',
  },
};

export const Recover: Story = {
  args: {
    readiness: recoverReadiness,
    capacityLabel: 'Very low capacity',
    timeBudgetLabel: null,
  },
};

export const NoTimeBudget: Story = {
  args: {
    readiness: deepReadiness,
    capacityLabel: 'Full capacity',
    timeBudgetLabel: null,
  },
};

export const WithCodeEditor: Story = { ...Deep };

makeLiveEditStory(WithCodeEditor, {
  availableImports: {
    './ReadinessCard': { ReadinessCard },
  },
  code: `import { ReadinessCard } from '../ui/ReadinessCard';

export default () => (
  <ReadinessCard
    readiness={{
      level: 'deep',
      label: 'Deep work window',
      description: 'Good for focused, high-effort execution.',
      color: 'var(--readiness-deep)',
      sessionType: 'deep work',
      maxFocusCost: 10,
      maxEffortScore: 10,
    }}
    capacityLabel="Full capacity"
    timeBudgetLabel="2 h available"
  />
);`,
});
