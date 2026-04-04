import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (_path: string) => (options: Record<string, unknown>) => ({
    options,
  }),
  useSearch: () => ({ tab: undefined, selectedId: undefined }),
}));

vi.mock('../../app/components/layout', () => ({
  WorkspaceScaffold: ({
    primary,
    aside,
  }: {
    primary?: React.ReactNode;
    aside?: React.ReactNode;
  }) => (
    <div>
      <div data-testid="scaffold-primary">{primary}</div>
      <div data-testid="scaffold-aside">{aside}</div>
    </div>
  ),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

import { useQuery } from '@tanstack/react-query';
const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;

import { Route as ArchiveRouteModule } from '../../app/routes/archive';
const ArchiveComponent = ArchiveRouteModule.options
  .component as React.ComponentType;

describe('archive route — loading state', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    });
  });

  it('renders loading indicator', () => {
    render(<ArchiveComponent />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });
});

describe('archive route — empty / null data', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: false,
    });
  });

  it('renders empty state when no data', () => {
    render(<ArchiveComponent />);
    expect(screen.getByTestId('archive-empty-state')).toBeTruthy();
  });

  it('renders aside empty state', () => {
    render(<ArchiveComponent />);
    expect(screen.getByTestId('archive-aside-empty-state')).toBeTruthy();
  });
});

describe('archive route — with archive data', () => {
  const ARCHIVE_DATA = {
    rejectedUser: [
      { id: 'a', title: 'User Rejected Note', inboxBucket: 'rejected_user' },
    ],
    rejectedAutomated: [
      {
        id: 'b',
        title: 'Auto Rejected One',
        inboxBucket: 'rejected_automated',
      },
      {
        id: 'c',
        title: 'Auto Rejected Two',
        inboxBucket: 'rejected_automated',
      },
    ],
    deferred: [{ id: 'd', title: 'Deferred Note', inboxBucket: 'deferred' }],
    total: 4,
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: ARCHIVE_DATA,
      isError: false,
    });
  });

  it('renders archive list container', () => {
    render(<ArchiveComponent />);
    expect(screen.getByTestId('archive-list')).toBeTruthy();
  });

  it('renders user-rejected section', () => {
    render(<ArchiveComponent />);
    expect(screen.getByTestId('archive-user-rejected-section')).toBeTruthy();
  });

  it('renders automated-rejected section', () => {
    render(<ArchiveComponent />);
    expect(
      screen.getByTestId('archive-automated-rejected-section')
    ).toBeTruthy();
  });

  it('renders deferred section', () => {
    render(<ArchiveComponent />);
    expect(screen.getByTestId('archive-deferred-section')).toBeTruthy();
  });
});
