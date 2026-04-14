import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { KnowledgeNoteCard } from './KnowledgeNoteCard';

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
  title: 'Knowledge / KnowledgeNoteCard',
  component: KnowledgeNoteCard,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: {
    path: 'notes/knowledge/cod-signal-types.md',
    title: 'COD Signal Types',
    audience: 'human',
    domain: 'engineering',
    tags: ['cod', 'frontend', 'types'],
    status: 'stable',
    selected: false,
    workspaceLink: false,
  },
} satisfies Meta<typeof KnowledgeNoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const AgentAudience: Story = {
  args: {
    path: 'notes/agents/system-prompt.md',
    title: 'System Prompt — Vault Agent',
    audience: 'agent',
    domain: 'agents',
    tags: ['system-prompt', 'runtime'],
    status: 'stable',
  },
};

export const BubbleAudience: Story = {
  args: {
    path: 'notes/shared/design-principles.md',
    title: 'Design Principles',
    audience: 'bubble',
    domain: 'design',
    tags: ['ux', 'tokens'],
    status: 'draft',
  },
};

export const DraftStatus: Story = {
  args: {
    title: 'Draft: Event bus architecture',
    status: 'draft',
    audience: 'human',
    domain: 'architecture',
    tags: ['events', 'backend'],
  },
};

export const DeprecatedStatus: Story = {
  args: {
    title: 'Old routing conventions (deprecated)',
    status: 'deprecated',
    audience: 'human',
    tags: ['routing'],
  },
};

export const ManyTags: Story = {
  args: {
    title: 'Comprehensive design system reference',
    audience: 'human',
    domain: 'design',
    tags: [
      'tokens',
      'colors',
      'typography',
      'spacing',
      'dark-mode',
      'animations',
    ],
    status: 'stable',
  },
};

export const NoOptionalFields: Story = {
  args: {
    path: 'notes/misc/plain-note.md',
    title: 'Plain note with no metadata',
    audience: null,
    domain: undefined,
    tags: [],
    status: undefined,
  },
};
