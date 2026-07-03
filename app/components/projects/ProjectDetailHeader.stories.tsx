import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { ProjectDetailHeader } from './ProjectDetailHeader';
import type { ProjectSummaryDisplay } from '../../types/display';

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

const activeProject: ProjectSummaryDisplay = {
  id: 'proj-vault-v3',
  title: 'Vault V3 — Viewer Redesign',
  statusLabel: 'Active',
  statusVariant: 'success',
  progressText: '18 / 32 tasks done',
  progressPercent: 56,
  etaLabel: 'Apr 28, 2026',
  bestMoveTitle: 'Write Storybook stories for migrated components',
};

const stalledProject: ProjectSummaryDisplay = {
  id: 'proj-api-v2',
  title: 'API V2 Migration',
  statusLabel: 'Blocked',
  statusVariant: 'danger',
  progressText: '7 / 20 tasks done',
  progressPercent: 35,
  etaLabel: null,
  bestMoveTitle: 'Unblock deploy pipeline — waiting on security review',
};

const newProject: ProjectSummaryDisplay = {
  id: 'proj-onboarding',
  title: 'Onboarding Revamp',
  statusLabel: 'Backlog',
  statusVariant: 'default',
  progressText: '0 / 8 tasks done',
  progressPercent: 0,
  etaLabel: null,
  bestMoveTitle: null,
};

const meta = {
  title: 'Projects / ProjectDetailHeader',
  component: ProjectDetailHeader,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: {
    projectId: 'vault-v3',
    project: activeProject,
  },
} satisfies Meta<typeof ProjectDetailHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const Blocked: Story = {
  args: { projectId: 'api-v2', project: stalledProject },
};

export const NoEtaOrBestMove: Story = {
  args: { projectId: 'onboarding', project: newProject },
};

export const NearComplete: Story = {
  args: {
    projectId: 'vault-v3',
    project: {
      ...activeProject,
      progressPercent: 95,
      progressText: '30 / 32 tasks done',
    },
  },
};
