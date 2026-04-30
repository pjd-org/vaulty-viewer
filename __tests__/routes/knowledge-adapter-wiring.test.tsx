import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { KnowledgeSurfacePayload } from '../../app/lib/viewer-adapter';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockUseKnowledgeSurface = vi.hoisted(() => vi.fn());
const mockUseKnowledgeHealth = vi.hoisted(() =>
  vi.fn(() => ({ data: undefined, isLoading: false, error: null }))
);
const mockUseKnowledgeByAudience = vi.hoisted(() =>
  vi.fn(() => ({ data: [], isLoading: false, error: null }))
);

vi.mock('../../app/lib/viewer-adapter', () => ({
  useKnowledgeSurface: () => mockUseKnowledgeSurface(),
  useKnowledgeHealth: () => mockUseKnowledgeHealth(),
  useKnowledgeByAudience: (_audience: string) => mockUseKnowledgeByAudience(),
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  );
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      href: '/',
      state: {},
      key: 'test-location',
    }),
    Link: ({
      to,
      children,
      className,
    }: {
      to?: string;
      children?: React.ReactNode;
      className?: string;
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
    useRouterState: vi.fn(() => ({ location: { pathname: '/' } })),
  };
});

// Stub out heavy sub-components that make their own network calls
vi.mock('../../src/components/KnowledgeHealthBanner', () => ({
  default: () => <div data-testid="health-banner" />,
}));

vi.mock('../../src/components/KnowledgeNoteCard', () => ({
  default: ({ title }: { title: string }) => (
    <div data-testid="note-card">{title}</div>
  ),
}));

vi.mock('../../src/components/Skeletons', () => ({
  SkeletonCardGrid: () => <div data-testid="skeleton" />,
}));

vi.mock('../../app/components/knowledge/KnowledgeWorkspacePane', () => ({
  KnowledgeWorkspacePane: () => <div data-testid="workspace-pane" />,
}));

// apiFetch must be stubbed so the component's own useEffect fetches don't fire
vi.mock('../../src/utils/api', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ json: () => Promise.resolve({}) })),
}));

// ---------------------------------------------------------------------------
// Import component under test AFTER mocks are in place
// ---------------------------------------------------------------------------

import { KnowledgeWorkspaceSurface } from '../../app/components/knowledge/KnowledgeWorkspaceSurface';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const knowledgeSurface: KnowledgeSurfacePayload = {
  selectedContext: [
    {
      id: 'ctx-1',
      contextType: 'note',
      title: 'Active context note alpha',
      summary: 'Context summary alpha.',
      sourceId: 'ctx-1',
      sourcePath: 'notes/ctx-1.md',
      reasonSelected: 'Recently active in the knowledge workspace.',
      linkedEntities: [],
    },
    {
      id: 'ctx-2',
      contextType: 'note',
      title: 'Active context note beta',
      summary: 'Context summary beta.',
      sourceId: 'ctx-2',
      sourcePath: 'notes/ctx-2.md',
      reasonSelected: 'Linked to current project.',
      linkedEntities: [],
    },
  ],
  linkedEntities: [
    { id: 'entity-1', type: 'note', title: 'Linked entity one' },
    { id: 'entity-2', type: 'task', title: 'Linked task two' },
  ],
  suggestedTemplates: [
    { id: 'tmpl-1', type: 'note', title: 'Decision template' },
  ],
  suggestedActions: [
    {
      actionType: 'link_note',
      label: 'Link this note',
      mutationRef: {
        domain: 'knowledge',
        operation: 'create_task',
        targetId: 'ctx-1',
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('knowledge adapter wiring', () => {
  beforeEach(() => {
    mockUseKnowledgeSurface.mockReturnValue({
      data: knowledgeSurface,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders selectedContext items from the adapter', () => {
    render(<KnowledgeWorkspaceSurface />);
    expect(screen.getByText('Active context note alpha')).toBeTruthy();
    expect(screen.getByText('Active context note beta')).toBeTruthy();
  });

  it('renders suggestedActions from the adapter', () => {
    render(<KnowledgeWorkspaceSurface />);
    expect(screen.getByText('Link this note')).toBeTruthy();
  });

  it('renders a loading state when adapter isLoading is true', () => {
    mockUseKnowledgeSurface.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<KnowledgeWorkspaceSurface />);
    expect(screen.getByTestId('knowledge-adapter-loading')).toBeTruthy();
  });
});
