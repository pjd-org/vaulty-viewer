import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';
import { WorkspaceScaffold } from './WorkspaceScaffold';

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

// ---------------------------------------------------------------------------
// Shared placeholder blocks
// ---------------------------------------------------------------------------

function Placeholder({
  label,
  height = 120,
}: {
  label: string;
  height?: number;
}) {
  return (
    <div
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.03)',
        borderRadius: 10,
        color: '#94a3b8',
        fontSize: 13,
        border: '1px dashed #e2e8f0',
      }}
    >
      {label}
    </div>
  );
}

const meta = {
  title: 'Pages / WorkspaceScaffold',
  component: WorkspaceScaffold,
  decorators: [RouterDecorator],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WorkspaceScaffold>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Home / Focus page
// ---------------------------------------------------------------------------

export const Home: Story = {
  args: {
    title: 'Focus',
    subtitle: 'Tuesday, 14 Apr 2026',
    statusLine: 'Deep work window — 3 tasks matched',
    nextAction: 'Next: Implement COD signal renderer · P7 · 90m',
    summaryItems: [
      { label: 'Tasks', value: '3', detail: 'matched today' },
      { label: 'Sessions', value: '2', detail: 'this week' },
      { label: 'Energy', value: '78', detail: 'high' },
    ],
    primaryTitle: 'Next action',
    primarySubtitle: 'Highest-signal task for right now',
    primary: (
      <div className="space-y-3">
        <Placeholder label="BestMoveCard" height={140} />
        <Placeholder label="HomeTaskCard · todo" height={64} />
        <Placeholder label="HomeTaskCard · todo" height={64} />
      </div>
    ),
    asideTitle: 'Backlog strip',
    asideSubtitle: '8 tasks waiting',
    aside: (
      <div className="space-y-2">
        <Placeholder label="BacklogStripCard" height={52} />
        <Placeholder label="BacklogStripCard" height={52} />
        <Placeholder label="BacklogStripCard" height={52} />
        <Placeholder label="ActiveSessionBanner" height={72} />
        <Placeholder label="RecentSessionsPanel" height={100} />
      </div>
    ),
  },
};

// ---------------------------------------------------------------------------
// Work / Task surface
// ---------------------------------------------------------------------------

export const Work: Story = {
  args: {
    title: 'Work',
    subtitle: 'Task surface',
    statusLine: '12 tasks · 2 in progress',
    summaryItems: [
      { label: 'Todo', value: '7' },
      { label: 'In progress', value: '2' },
      { label: 'Blocked', value: '3' },
    ],
    primaryTitle: 'Task list',
    primarySubtitle: 'All tasks in the current view',
    primary: (
      <div className="space-y-2">
        <Placeholder label="TaskSection · In progress" height={110} />
        <Placeholder label="TaskSection · Todo" height={200} />
        <Placeholder label="TaskSection · Blocked" height={90} />
      </div>
    ),
    asideTitle: 'Task detail',
    asideSubtitle: 'Selected task',
    aside: <Placeholder label="TaskDetail" height={320} />,
  },
};

// ---------------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------------

export const Inbox: Story = {
  args: {
    title: 'Inbox',
    subtitle: 'Pressure signals & pending items',
    statusLine: '5 items · 2 critical',
    summaryItems: [
      { label: 'Critical', value: '2' },
      { label: 'Medium', value: '2' },
      { label: 'Low', value: '1' },
    ],
    primaryTitle: 'Signals',
    primarySubtitle: 'Items requiring your attention',
    primary: (
      <div className="space-y-2">
        <Placeholder label="FilterBar" height={44} />
        <Placeholder label="InboxRow · critical" height={64} />
        <Placeholder label="InboxRow · critical" height={64} />
        <Placeholder label="InboxRow · medium" height={64} />
        <Placeholder label="InboxRow · low" height={64} />
      </div>
    ),
  },
};

// ---------------------------------------------------------------------------
// Notes / Knowledge browser
// ---------------------------------------------------------------------------

export const Notes: Story = {
  args: {
    title: 'Notes',
    subtitle: 'Knowledge base',
    statusLine: '142 notes · 18 tasks · 6 goals',
    summaryItems: [
      { label: 'Notes', value: '142' },
      { label: 'Tasks', value: '18' },
      { label: 'Goals', value: '6' },
    ],
    primaryTitle: 'All notes',
    primarySubtitle: 'Sorted by last modified',
    primary: <Placeholder label="NoteGrid (12 notes)" height={380} />,
  },
};

// ---------------------------------------------------------------------------
// Kanban board
// ---------------------------------------------------------------------------

export const Kanban: Story = {
  args: {
    title: 'Kanban',
    subtitle: 'Task board',
    statusLine: '14 tasks across 5 columns',
    summaryItems: [
      { label: 'Backlog', value: '4' },
      { label: 'Todo', value: '5' },
      { label: 'In progress', value: '2' },
      { label: 'Blocked', value: '3' },
    ],
    primaryTitle: 'Board',
    primarySubtitle: 'Drag to reorder',
    primary: (
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
      >
        <Placeholder label="Backlog column" height={280} />
        <Placeholder label="Todo column" height={280} />
        <Placeholder label="In progress column" height={280} />
        <Placeholder label="Blocked column" height={280} />
      </div>
    ),
  },
};

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export const Goals: Story = {
  args: {
    title: 'Goals',
    subtitle: 'Active objectives',
    statusLine: '4 active goals · 1 stalled',
    summaryItems: [
      { label: 'Active', value: '4' },
      { label: 'Completed', value: '2' },
      { label: 'Stalled', value: '1' },
    ],
    primaryTitle: 'Goals',
    primarySubtitle: 'Tracked long-term objectives',
    primary: (
      <div className="space-y-3">
        <Placeholder label="GoalCard · active" height={96} />
        <Placeholder label="GoalCard · active" height={96} />
        <Placeholder label="GoalCard · stalled" height={96} />
      </div>
    ),
  },
};

// ---------------------------------------------------------------------------
// Knowledge
// ---------------------------------------------------------------------------

export const Knowledge: Story = {
  args: {
    title: 'Knowledge',
    subtitle: 'Graph & metrics',
    statusLine: '142 notes · 8 domains',
    summaryItems: [
      { label: 'Total notes', value: '142' },
      { label: 'Domains', value: '8' },
      { label: 'Linked', value: '63%', detail: 'have backlinks' },
    ],
    primaryTitle: 'Overview',
    primary: (
      <div className="space-y-3">
        <Placeholder label="Domain metrics grid" height={96} />
        <Placeholder label="Recent notes" height={200} />
      </div>
    ),
    asideTitle: 'Graph',
    aside: <Placeholder label="Knowledge graph preview" height={320} />,
  },
};
