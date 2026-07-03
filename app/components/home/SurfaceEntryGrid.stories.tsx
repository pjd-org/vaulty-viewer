import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { SurfaceEntryGrid } from './SurfaceEntryGrid';
import type { SurfaceEntryTile } from './SurfaceEntryGrid';

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

const baseTiles: SurfaceEntryTile[] = [
  {
    label: 'Inbox',
    role: 'Triage queue',
    count: 4,
    to: '/inbox',
    stateLabel: '4 items waiting',
    nextStep: 'Review extracted items',
  },
  {
    label: 'Tasks',
    role: 'Execution queue',
    count: 12,
    to: '/work',
    stateLabel: '12 active tasks',
    nextStep: 'Start with top-ranked task',
  },
  {
    label: 'Knowledge',
    role: 'Vault notes',
    count: 84,
    to: '/knowledge',
    nextStep: 'Browse notes',
  },
  {
    label: 'Projects',
    role: 'Active work streams',
    count: 3,
    to: '/work',
    nextStep: 'Open project board',
  },
];

const meta = {
  title: 'Home / SurfaceEntryGrid',
  component: SurfaceEntryGrid,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: { tiles: baseTiles, loading: false },
} satisfies Meta<typeof SurfaceEntryGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = { args: { loading: true } };

export const ZeroCounts: Story = {
  args: {
    tiles: baseTiles.map((t) => ({ ...t, count: 0 })),
  },
};

export const ThreeUpWithSearchResets: Story = {
  args: {
    columns: 3,
    tiles: [
      {
        label: 'Pressure',
        role: 'Active blockers and pressure signals',
        count: 2,
        to: '/work',
        nextStep: 'Review active blockers',
      },
      {
        label: 'Queue',
        role: 'Ranked recommendations ready to execute',
        count: 4,
        to: '/actions',
        search: {
          sort: undefined,
          simulatableOnly: undefined,
          selectedId: undefined,
        },
        nextStep: 'Execute or defer top move',
      },
      {
        label: 'Portfolio',
        role: 'Cross-project pressure summary',
        count: 1,
        to: '/portfolio',
        search: { tab: undefined, selectedId: undefined },
        nextStep: 'Inspect impacted projects',
      },
    ],
  },
};
