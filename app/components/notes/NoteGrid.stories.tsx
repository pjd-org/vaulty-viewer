import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { NoteGrid } from './NoteGrid';
import type { KnowledgeNoteRef } from '../../lib/viewer-adapter';

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

const mockNotes: KnowledgeNoteRef[] = [
  {
    path: 'notes/knowledge/cod/cod-overview.md',
    title: 'COD Overview',
    audience: 'human',
    domain: 'cod',
    tags: ['cod', 'architecture'],
    status: 'stable',
  },
  {
    path: 'notes/knowledge/cod/signal-types.md',
    title: 'Signal Types Reference',
    audience: 'agent',
    domain: 'cod',
    tags: ['cod', 'signals'],
    status: 'draft',
  },
  {
    path: 'notes/knowledge/vault/event-law.md',
    title: 'Two-Regime Event Law',
    audience: 'bubble',
    domain: 'vault',
    tags: ['events', 'architecture'],
    status: 'stable',
  },
  {
    path: 'notes/knowledge/tasks/effort-scoring.md',
    title: 'Effort Scoring Guidelines',
    audience: 'human',
    domain: 'tasks',
    tags: ['tasks', 'productivity'],
    status: 'stable',
  },
];

const meta = {
  title: 'Notes / NoteGrid',
  component: NoteGrid,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof NoteGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { notes: mockNotes },
};

export const SingleNote: Story = {
  args: { notes: [mockNotes[0]] },
};

export const AllAudiences: Story = {
  args: {
    notes: [
      { ...mockNotes[0], audience: 'human', title: 'Human note' },
      { ...mockNotes[1], audience: 'agent', title: 'Agent note' },
      { ...mockNotes[2], audience: 'bubble', title: 'Bubble note' },
    ],
  },
};

export const Empty: Story = {
  args: { notes: [] },
};

export const ManyNotes: Story = {
  args: {
    notes: Array.from({ length: 10 }, (_, i) => ({
      path: `notes/knowledge/item-${i}.md`,
      title: `Knowledge Note ${i + 1}`,
      audience: (['human', 'agent', 'bubble'] as const)[i % 3],
      domain: `domain-${i % 3}`,
      tags: [`tag-${i}`, 'knowledge'],
      status: i % 2 === 0 ? 'stable' : 'draft',
    })),
  },
};
