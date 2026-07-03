import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { RecentSessionsPanel } from './RecentSessionsPanel';
import type { SessionSummary } from '../../../src/lib/focus-logic';

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

const sessions: SessionSummary[] = [
  {
    id: 'sess-001',
    title: 'Auth feature sprint',
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 'sess-002',
    title: 'Bug triage',
    startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 'sess-003',
    title: undefined,
    startedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    endedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    status: 'aborted',
  },
];

const meta = {
  title: 'Home / RecentSessionsPanel',
  component: RecentSessionsPanel,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof RecentSessionsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSessions: Story = {
  args: { sessions },
};

export const SingleSession: Story = {
  args: { sessions: [sessions[0]] },
};

export const Empty: Story = {
  args: { sessions: [] },
  // renders nothing — confirms null branch
};

export const NoTitles: Story = {
  args: {
    sessions: sessions.map((s) => ({ ...s, title: undefined })),
  },
};
