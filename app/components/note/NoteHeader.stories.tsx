import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { NoteHeader } from './NoteHeader';
import type { NoteHeaderDisplay } from '../../types/display';

const taskDisplay: NoteHeaderDisplay = {
  title: 'Implement COD signal renderer',
  typeLabel: 'Task',
  statusLabel: 'In Progress',
  statusVariant: 'default',
  breadcrumbs: [
    { label: 'notes' },
    { label: 'tasks' },
    { label: 'implement-cod-renderer' },
  ],
  primaryActions: [
    { label: 'Mark Done', variant: 'primary', action: 'done' },
    { label: 'Open in Editor', variant: 'secondary', action: 'edit' },
  ],
};

const decisionDisplay: NoteHeaderDisplay = {
  title: 'Use CSS custom properties for all design tokens',
  typeLabel: 'Decision',
  statusLabel: 'Stable',
  statusVariant: 'success',
  breadcrumbs: [{ label: 'notes' }, { label: 'decisions' }],
  primaryActions: [],
};

const draftDisplay: NoteHeaderDisplay = {
  title: 'Draft architecture proposal for event bus',
  typeLabel: 'Note',
  statusLabel: null,
  statusVariant: 'default',
  breadcrumbs: [{ label: 'inbox' }, { label: 'extracted' }],
  primaryActions: [
    { label: 'Promote to Notes', variant: 'primary', action: 'promote' },
    { label: 'Reject', variant: 'secondary', action: 'reject' },
  ],
};

const meta = {
  title: 'Note / NoteHeader',
  component: NoteHeader,
  parameters: { layout: 'padded' },
  args: { onAction: () => {} },
} satisfies Meta<typeof NoteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TaskNote: Story = {
  args: { display: taskDisplay },
};

export const DecisionNote: Story = {
  args: { display: decisionDisplay },
};

export const DraftNote: Story = {
  args: { display: draftDisplay },
};

export const WithExtraActions: Story = {
  args: {
    display: taskDisplay,
    extraActions: (
      <>
        <button
          type="button"
          className="btn-secondary rounded-xl px-4 py-2 text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          Open graph
        </button>
        <button
          type="button"
          className="btn-secondary rounded-xl px-4 py-2 text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          Search around note
        </button>
      </>
    ),
  },
};

export const NoActions: Story = {
  args: {
    display: { ...decisionDisplay, primaryActions: [] },
  },
};
