import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import Navbar from './Navbar';

/**
 * Navbar uses `useRouterState` to derive the active link, so it requires a
 * TanStack Router context. Each story wraps with a RouterProvider initialised
 * to a specific path so the correct nav item appears highlighted.
 */

function makeStubRouter(initialPath: string, Story: () => React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Story /> });
  return createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

function withRouter(path: string) {
  return (Story: () => React.ReactNode) => (
    <RouterProvider router={makeStubRouter(path, Story)} />
  );
}

const meta = {
  title: 'Shell / Navbar',
  component: Navbar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HomeActive: Story = {
  decorators: [withRouter('/')],
  args: { apiStatus: 'online' },
};

export const WorkActive: Story = {
  decorators: [withRouter('/work')],
  args: { apiStatus: 'online' },
};

export const KnowledgeActive: Story = {
  decorators: [withRouter('/knowledge')],
  args: { apiStatus: 'online' },
};

export const InboxActive: Story = {
  decorators: [withRouter('/inbox')],
  args: { apiStatus: 'online' },
};

export const ApiOffline: Story = {
  decorators: [withRouter('/')],
  args: { apiStatus: 'offline' },
};

export const ApiUnknown: Story = {
  decorators: [withRouter('/')],
  args: { apiStatus: 'unknown' },
};
