import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { SurfaceLinkChip } from './SurfaceChrome';

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

const meta = {
  title: 'UI / Molecules / SurfaceLinkChip',
  component: SurfaceLinkChip,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: {
    to: '/',
    children: 'Link',
  },
} satisfies Meta<typeof SurfaceLinkChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: { tone: 'neutral', children: 'Neutral' },
};

export const Accent: Story = {
  args: { tone: 'accent', children: 'Accent' },
};

export const Muted: Story = {
  args: { tone: 'muted', children: 'Muted' },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex gap-3 flex-wrap">
      <SurfaceLinkChip to="/" tone="neutral">
        Neutral
      </SurfaceLinkChip>
      <SurfaceLinkChip to="/" tone="accent">
        Accent
      </SurfaceLinkChip>
      <SurfaceLinkChip to="/" tone="muted">
        Muted
      </SurfaceLinkChip>
    </div>
  ),
};
