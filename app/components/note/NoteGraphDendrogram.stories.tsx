import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { NoteGraphDendrogram } from './NoteGraphDendrogram';

const meta = {
  title: 'Note / NoteGraphDendrogram',
  component: NoteGraphDendrogram,
  parameters: { layout: 'centered' },
  args: {
    rootTitle: 'COD Signal Renderer',
    rootPath: 'notes/tasks/implement-cod-renderer.md',
    width: 480,
    height: 400,
  },
} satisfies Meta<typeof NoteGraphDendrogram>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Default: 8 related notes across 3 collections
// ---------------------------------------------------------------------------
export const Default: Story = {
  args: {
    relatedNotes: [
      {
        path: 'notes/knowledge/cod-signal-types.md',
        score: 0.92,
        reasons: ['shared tags', 'same collection'],
      },
      {
        path: 'notes/knowledge/genie-design-system.md',
        score: 0.87,
        reasons: ['shared tags'],
      },
      {
        path: 'notes/knowledge/react-svelte-patterns.md',
        score: 0.74,
        reasons: ['linked'],
      },
      {
        path: 'notes/decisions/use-css-variables.md',
        score: 0.78,
        reasons: ['referenced by'],
      },
      {
        path: 'notes/decisions/radial-dendrogram-no-d3.md',
        score: 0.65,
      },
      {
        path: 'notes/tasks/write-storybook-stories.md',
        score: 0.71,
        reasons: ['depends on'],
      },
      {
        path: 'notes/tasks/contrast-audit.md',
        score: 0.68,
      },
      {
        path: 'notes/tasks/design-token-cleanup.md',
        score: 0.55,
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// SingleCollection: all notes in the same folder
// ---------------------------------------------------------------------------
export const SingleCollection: Story = {
  args: {
    relatedNotes: [
      {
        path: 'notes/knowledge/cod-signal-types.md',
        score: 0.92,
        reasons: ['same collection'],
      },
      { path: 'notes/knowledge/genie-design-system.md', score: 0.87 },
      { path: 'notes/knowledge/react-svelte-patterns.md', score: 0.74 },
      { path: 'notes/knowledge/vault-architecture.md', score: 0.69 },
      { path: 'notes/knowledge/token-system.md', score: 0.61 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Empty: no related notes
// ---------------------------------------------------------------------------
export const Empty: Story = {
  args: {
    relatedNotes: [],
  },
};

// ---------------------------------------------------------------------------
// ManyCollections: 5 groups stress test
// ---------------------------------------------------------------------------
export const ManyCollections: Story = {
  args: {
    relatedNotes: [
      { path: 'notes/knowledge/cod-signals.md', score: 0.88 },
      { path: 'notes/knowledge/design-tokens.md', score: 0.79 },
      { path: 'notes/decisions/css-vars.md', score: 0.75 },
      { path: 'notes/decisions/no-d3.md', score: 0.66 },
      { path: 'notes/tasks/storybook.md', score: 0.72 },
      { path: 'notes/tasks/contrast.md', score: 0.6 },
      { path: 'core/avatar/Avatar.md', score: 0.58 },
      { path: 'core/world/World.md', score: 0.53 },
      { path: 'inbox/extracted/run-001/draft.md', score: 0.48 },
    ],
  },
};

// ---------------------------------------------------------------------------
// WithClickHandler: demonstrates onNodeClick callback
// ---------------------------------------------------------------------------
export const WithClickHandler: Story = {
  args: {
    relatedNotes: [
      {
        path: 'notes/knowledge/cod-signals.md',
        score: 0.9,
        reasons: ['shared tags'],
      },
      { path: 'notes/decisions/css-vars.md', score: 0.77 },
      { path: 'notes/tasks/storybook.md', score: 0.65 },
    ],
    onNodeClick: (path: string) => alert(`Clicked: ${path}`),
  },
};
