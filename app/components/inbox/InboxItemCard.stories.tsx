import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import {
  createRouter,
  createMemoryHistory,
  createRootRoute,
  RouterProvider,
} from '@tanstack/react-router';

import { InboxItemCard } from './InboxItemCard';
import type { InboxItemDisplay } from '../../types/display';

/* ── Router stub ──────────────────────────────────────────────────────────── *
 * InboxItemCard renders <Link> from TanStack Router, which requires a router
 * context.  We create a minimal in-memory router just for Storybook.
 * ─────────────────────────────────────────────────────────────────────────── */
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

/* ── Mock data ───────────────────────────────────────────────────────────── */
const baseItem: InboxItemDisplay = {
  title: 'Agent proposed deleting 3 archived project notes',
  originLabel: 'signals_infer',
  contextSnippet: 'notes/projects/tensura/archive/phase-2-retro.md',
  ageLabel: '2 h ago',
  actions: ['inspect', 'promote', 'reject'],
  isBlocked: false,
  runId: 'run_01jwabcxyz',
};

const baseDetail = {
  summary:
    'The infer run detected 3 notes in the archive folder that have had no backlinks or edits in over 90 days. It is proposing a hard delete.',
  whySurfaced:
    'No backlinks or edits in 90+ days; flagged by retention heuristic.',
  severity: 'medium' as const,
  inboxBucket: 'needs_approval',
  rejectionReason: null,
  runId: 'run_01jwabcxyz',
  runAction: 'delete_notes',
  sourceId: 'notes/projects/tensura/archive/phase-2-retro.md',
  reversibility: 'low' as const,
};

/* ── Meta ────────────────────────────────────────────────────────────────── */
const meta = {
  title: 'Inbox / InboxItemCard',
  component: InboxItemCard,
  decorators: [RouterDecorator],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Single inbox item card. Row click opens the InspectOverlay modal. Promote/Reject actions are injected by the parent (inbox route).',
      },
    },
  },
  args: {
    onInspect: () => {},
    onPromote: () => {},
    onReject: () => {},
  },
} satisfies Meta<typeof InboxItemCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Stories ─────────────────────────────────────────────────────────────── */

/** Full detail, all actions, medium severity, irreversible. */
export const Default: Story = {
  args: {
    item: baseItem,
    detail: baseDetail,
  },
};

/** High severity, reversible action. */
export const HighSeverity: Story = {
  args: {
    item: {
      ...baseItem,
      title: 'Agent wants to push a breaking schema migration',
      contextSnippet: 'notes/core/world/schema-v4.md',
    },
    detail: {
      ...baseDetail,
      severity: 'high',
      reversibility: 'high',
      whySurfaced:
        'Schema mutation would change 12 downstream consumers; confidence 0.38.',
      runAction: 'apply_migration',
    },
  },
};

/** Critical severity — red bar, red dot. */
export const CriticalSeverity: Story = {
  args: {
    item: {
      ...baseItem,
      title: 'Agent is proposing to purge the entire .sugar directory',
      contextSnippet: '._sugar/',
      ageLabel: '5 min ago',
    },
    detail: {
      ...baseDetail,
      severity: 'critical',
      reversibility: 'low',
      whySurfaced: 'Triggered by mismatched law hash after a failed apply.',
      runAction: 'purge_directory',
    },
  },
};

/** No promote/reject — inspect-only mode (e.g. Archive tab). */
export const NoActions: Story = {
  args: {
    item: {
      ...baseItem,
      actions: ['inspect'],
      originLabel: 'conversation',
    },
    detail: {
      ...baseDetail,
      inboxBucket: 'rejected_user',
      rejectionReason:
        'Operator manually rejected — not relevant to current phase.',
    },
    onPromote: undefined,
    onReject: undefined,
  },
};

/** Blocked item — hatched background, Blocked chip. */
export const Blocked: Story = {
  args: {
    item: {
      ...baseItem,
      title: 'Merge phase-3 plan into roadmap',
      isBlocked: true,
      actions: ['inspect'],
    },
    detail: {
      ...baseDetail,
      inboxBucket: 'needs_action',
      whySurfaced: 'Depends on phase-2 sign-off which is not yet complete.',
      reversibility: 'medium',
    },
    onPromote: undefined,
    onReject: undefined,
  },
};

/** Modal footer includes a "Convert to task" panel. */
export const WithConvertPanel: Story = {
  args: {
    item: baseItem,
    detail: baseDetail,
    convertPanel: (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors"
        onClick={() => alert('Convert to task panel')}
      >
        Convert to task…
      </button>
    ),
  },
};

/** Minimal item — no detail, no optional props. */
export const Minimal: Story = {
  args: {
    item: {
      title: 'Unnamed run result',
      originLabel: 'manual',
      contextSnippet: '',
      ageLabel: '',
      actions: ['inspect'],
      isBlocked: false,
      runId: null,
    },
    detail: undefined,
    onPromote: undefined,
    onReject: undefined,
  },
};
