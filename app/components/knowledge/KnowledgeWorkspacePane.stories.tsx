import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { KnowledgeWorkspacePane } from './KnowledgeWorkspacePane';

/**
 * NOTE: KnowledgeWorkspacePane fetches note data from the API when `noteId` is
 * provided. These stories only exercise the static branches that render without
 * any network activity:
 *
 * - No `noteId` → dispatches CLEAR → renders the "Select a note" EmptyState + chip bar.
 *
 * Stories that pass a real noteId would require a running API or MSW mocking and
 * are intentionally excluded here.
 */

function makeStubRouter(Story: () => React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Story /> });
  return createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/knowledge'] }),
  });
}

const RouterDecorator = (Story: () => React.ReactNode) => (
  <RouterProvider router={makeStubRouter(Story)} />
);

const meta = {
  title: 'Knowledge / KnowledgeWorkspacePane',
  component: KnowledgeWorkspacePane,
  decorators: [RouterDecorator],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof KnowledgeWorkspacePane>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No noteId selected — shows "Select a note from the browser" empty state. */
export const Empty: Story = {
  args: {},
};

/** No noteId, read mode explicit with project + template context chips shown. */
export const WithContextChips: Story = {
  args: {
    mode: 'read',
    projectId: 'proj-tensura',
    templateId: 'task-template',
    memoryTab: 'decisions',
  },
};

/** Edit mode chip, no note selected. */
export const EditModeEmpty: Story = {
  args: {
    mode: 'edit',
  },
};
