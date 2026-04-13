import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockRouteState = vi.hoisted(() => ({
  params: { slug: 'rent-stability-pantin' },
  search: {
    selectedId: undefined as string | undefined,
    tab: undefined as string | undefined,
    noteId: undefined as string | undefined,
    mode: undefined as 'read' | 'edit' | undefined,
    templateId: undefined as string | undefined,
    memoryTab: undefined as string | undefined,
  },
}));

const mockUseProjectSurface = vi.hoisted(() => vi.fn());

vi.mock('../../app/lib/viewer-adapter', () => ({
  useProjectSurface: (_slug: string) => mockUseProjectSurface(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
    useParams: () => mockRouteState.params,
    useSearch: () => mockRouteState.search,
  }),
  Link: ({
    to,
    params,
    search,
    className,
    children,
    ...props
  }: {
    to?: string;
    params?: Record<string, unknown>;
    search?: Record<string, unknown>;
    className?: string;
    children?: React.ReactNode;
  }) => (
    <a
      data-link-to={to}
      data-link-params={params ? JSON.stringify(params) : ''}
      data-link-search={search ? JSON.stringify(search) : ''}
      className={className}
      {...props}
    >
      {children}
    </a>
  ),
}));

import { Route } from '../../app/routes/project.$slug.timeline';

const RouteComponent = Route.options.component as React.ComponentType;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('project timeline surface', () => {
  beforeEach(() => {
    mockRouteState.params = { slug: 'rent-stability-pantin' };
    mockRouteState.search = {
      selectedId: undefined,
      tab: undefined,
      noteId: undefined,
      mode: undefined,
      templateId: undefined,
      memoryTab: undefined,
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('shows empty state when no timeline events are present', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        timelineHints: [],
        verificationRail: [],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getByText('No timeline events surfaced.')).toBeTruthy();
    expect(screen.getAllByText('Timeline Events').length).toBeGreaterThan(0);
    expect(screen.getByText('Verification Rail')).toBeTruthy();
    expect(screen.getByText('No verification outcomes.')).toBeTruthy();
  });

  it('renders timeline events and verification rail from adapter data', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        timelineHints: [
          {
            id: 'evt-1',
            title: 'Lease signed',
            type: 'milestone',
            status: 'done',
          },
          {
            id: 'evt-2',
            title: 'Inspection scheduled',
            type: 'event',
            status: 'pending',
          },
        ],
        verificationRail: [
          { id: 'ver-1', summary: 'Deposit verified', status: 'success' },
          { id: 'ver-2', summary: 'Document check pending', status: 'pending' },
        ],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getAllByText('Lease signed').length).toBeGreaterThan(0);
    expect(screen.getByText('Inspection scheduled')).toBeTruthy();
    expect(screen.getByText('Deposit verified')).toBeTruthy();
    expect(screen.getByText('Document check pending')).toBeTruthy();
  });

  it('shows selected event detail when selectedId matches a timeline hint', () => {
    mockRouteState.search = { ...mockRouteState.search, selectedId: 'evt-1' };

    mockUseProjectSurface.mockReturnValue({
      data: {
        timelineHints: [
          {
            id: 'evt-1',
            title: 'Lease signed',
            type: 'milestone',
            status: 'done',
          },
          {
            id: 'evt-2',
            title: 'Inspection scheduled',
            type: 'event',
            status: 'pending',
          },
        ],
        verificationRail: [],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getByText('Selected Event')).toBeTruthy();
    const detailHeadings = screen.getAllByText('Lease signed');
    expect(detailHeadings.length).toBeGreaterThan(0);
    expect(screen.getByText('evt-1')).toBeTruthy();
  });

  it('does not render an empty paragraph when hint.type is undefined', () => {
    mockUseProjectSurface.mockReturnValue({
      data: {
        timelineHints: [
          {
            id: 'evt-no-type',
            title: 'Untyped event',
            type: undefined,
            status: 'pending',
          },
        ],
        verificationRail: [],
      },
      isLoading: false,
      error: null,
    });

    render(<RouteComponent />);

    expect(screen.getAllByText('Untyped event').length).toBeGreaterThan(0);
    // An empty <p> would match '' — ensure no empty text nodes pollute the DOM
    const allParagraphs = document.querySelectorAll('p');
    const emptyParas = Array.from(allParagraphs).filter(
      (p) => p.textContent === ''
    );
    expect(emptyParas.length).toBe(0);
  });
});
