import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { NoteMetaRail } from './NoteMetaRail';
import type { NoteLifecycle } from '../../../src/lib/note-logic';

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

const canonicalLifecycle: NoteLifecycle = {
  source: 'canonical',
  isTask: false,
  isCanonicalTask: false,
  isStaged: false,
  canPromote: false,
  canReject: false,
  canComplete: false,
  canReview: false,
  runId: null,
  targetPath: null,
  reviewStatus: null,
};

const inboxLifecycle: NoteLifecycle = {
  source: 'inbox',
  isTask: false,
  isCanonicalTask: false,
  isStaged: true,
  canPromote: true,
  canReject: true,
  canComplete: false,
  canReview: false,
  runId: 'run-2026-04-14-001',
  targetPath: 'notes/tasks/implement-feature.md',
  reviewStatus: 'pending',
};

const taskFrontmatter = {
  title: 'Implement COD signal renderer',
  type: 'task',
  status: 'in-progress',
  priority: 8,
  dueDate: '2026-04-18',
  created: '2026-03-15',
  tags: ['frontend', 'cod', 'viewer'],
};

const relatedNotes = [
  {
    path: 'notes/knowledge/cod-signal-types.md',
    score: 0.92,
    reasons: ['shared tags'],
  },
  {
    path: 'notes/decisions/use-css-variables.md',
    score: 0.78,
  },
  {
    path: 'notes/tasks/write-storybook-stories.md',
    score: 0.71,
  },
];

const meta = {
  title: 'Note / NoteMetaRail',
  component: NoteMetaRail,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
  args: {
    frontmatter: taskFrontmatter,
    lifecycle: canonicalLifecycle,
    relatedNotes,
    path: 'notes/tasks/implement-cod-renderer.md',
  },
} satisfies Meta<typeof NoteMetaRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TaskNote: Story = {};

export const HighPriority: Story = {
  args: {
    frontmatter: { ...taskFrontmatter, priority: 9, status: 'blocked' },
  },
};

export const NoRelatedNotes: Story = {
  args: { relatedNotes: [] },
};

export const InboxLifecycle: Story = {
  args: {
    frontmatter: {
      title: 'Draft extraction',
      type: 'note',
      created: '2026-04-14',
    },
    lifecycle: inboxLifecycle,
    relatedNotes: [],
    path: 'inbox/extracted/run-001/draft.md',
  },
};

export const MinimalFrontmatter: Story = {
  args: {
    frontmatter: { title: 'Untitled' },
    lifecycle: canonicalLifecycle,
    relatedNotes: [],
    path: 'notes/misc/untitled.md',
  },
};
