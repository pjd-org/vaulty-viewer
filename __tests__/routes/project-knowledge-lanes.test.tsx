import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { ProjectKnowledgeLaneShell } from '../../app/components/projects/ProjectKnowledgeLaneShell';

const knowledgeSurfaceMock = vi.fn(
  ({
    noteId,
    workspaceTo,
    workspaceParams,
  }: {
    noteId?: string;
    workspaceTo?: string;
    workspaceParams?: Record<string, string>;
  }) => (
    <div data-testid="knowledge-surface">
      {noteId ?? 'no-note'}::{workspaceTo ?? 'no-route'}::
      {workspaceParams?.slug ?? 'no-slug'}
    </div>
  )
);

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  );

  return {
    ...actual,
    Link: ({
      to,
      params,
      search,
      className,
      children,
    }: {
      to: string;
      params?: Record<string, string>;
      search?: Record<string, unknown>;
      className?: string;
      children: React.ReactNode;
    }) => {
      const resolvedTo = Object.entries(params ?? {}).reduce(
        (acc, [key, value]) => acc.replace(`$${key}`, String(value)),
        to
      );
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(search ?? {})) {
        if (value === undefined || value === null) continue;
        query.set(key, String(value));
      }
      const href = `${resolvedTo}${query.toString() ? `?${query.toString()}` : ''}`;
      return (
        <a href={href} className={className}>
          {children}
        </a>
      );
    },
  };
});

vi.mock('../../app/components/knowledge/KnowledgeWorkspaceSurface', () => ({
  KnowledgeWorkspaceSurface: (props: {
    noteId?: string;
    workspaceTo?: string;
    workspaceParams?: Record<string, string>;
  }) => knowledgeSurfaceMock(props),
}));

afterEach(() => {
  cleanup();
  knowledgeSurfaceMock.mockClear();
});

describe('ProjectKnowledgeLaneShell', () => {
  it('renders the shared notes workspace inside the project lane and keeps route-aware links', async () => {
    // KnowledgeWorkspaceSurface may be lazy-loaded - use findByTestId
    const { findByTestId } = render(
      <ProjectKnowledgeLaneShell
        slug="rent-stability-pantin"
        tab="notes"
        noteId="notes/knowledge/human/engineering/typescript-guide.md"
        mode="edit"
        templateId="workspace-template"
        memoryTab="recent"
      />
    );

    // Wait for lazy-loaded surface
    const surface = await findByTestId(
      'knowledge-surface',
      {},
      { timeout: 2000 }
    );
    expect(surface.textContent).toContain(
      'notes/knowledge/human/engineering/typescript-guide.md'
    );
    expect(knowledgeSurfaceMock).toHaveBeenCalled();
    expect(knowledgeSurfaceMock.mock.calls[0]?.[0]).toMatchObject({
      noteId: 'notes/knowledge/human/engineering/typescript-guide.md',
      workspaceTo: '/project/$slug/knowledge',
      workspaceParams: { slug: 'rent-stability-pantin' },
    });
    expect(
      screen.getByRole('link', { name: 'Notes' }).getAttribute('href')
    ).toBe(
      '/project/rent-stability-pantin/knowledge?tab=notes&noteId=notes%2Fknowledge%2Fhuman%2Fengineering%2Ftypescript-guide.md&mode=edit&templateId=workspace-template&memoryTab=recent'
    );
    expect(
      screen.getByRole('link', { name: 'Views' }).getAttribute('href')
    ).toBe(
      '/project/rent-stability-pantin/knowledge?tab=views&noteId=notes%2Fknowledge%2Fhuman%2Fengineering%2Ftypescript-guide.md&mode=edit&templateId=workspace-template&memoryTab=recent'
    );
  });

  it('renders placeholder lanes for views and memories', () => {
    render(
      <ProjectKnowledgeLaneShell slug="rent-stability-pantin" tab="views" />
    );
    expect(screen.getByText('Project Knowledge Views')).toBeTruthy();

    cleanup();

    render(
      <ProjectKnowledgeLaneShell
        slug="rent-stability-pantin"
        tab="memories"
        memoryTab="recent"
      />
    );
    expect(screen.getByText('Project Memories')).toBeTruthy();
    expect(
      screen.getByText(
        'Agent and project memories will render here for recent.'
      )
    ).toBeTruthy();
  });
});
