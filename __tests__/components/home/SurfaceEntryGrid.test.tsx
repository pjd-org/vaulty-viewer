import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockLinkProps = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    search,
    ...props
  }: {
    children: React.ReactNode;
    to?: string;
    search?: Record<string, unknown>;
    [key: string]: unknown;
  }) => {
    mockLinkProps({ to, search });
    return (
      <a href={typeof to === 'string' ? to : '#'} {...props}>
        {children}
      </a>
    );
  },
}));

import {
  SurfaceEntryGrid,
  type SurfaceEntryTile,
} from '../../../app/components/home/SurfaceEntryGrid';

const baseTiles: SurfaceEntryTile[] = [
  {
    label: 'Pressure',
    role: 'Active blockers and pressure signals',
    count: 2,
    to: '/work',
    nextStep: 'Review active blockers',
  },
  {
    label: 'Queue',
    role: 'Ranked recommendations ready to execute',
    count: 3,
    to: '/actions',
    nextStep: 'Execute or defer top move',
  },
];

describe('SurfaceEntryGrid', () => {
  beforeEach(() => {
    mockLinkProps.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders tile label, count, and role in default mode', () => {
    render(<SurfaceEntryGrid tiles={baseTiles} />);

    expect(screen.getByText('Pressure')).toBeTruthy();
    expect(screen.getByText('Queue')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(
      screen.getByText('Active blockers and pressure signals')
    ).toBeTruthy();
  });

  it('shows loading placeholder counts when loading is true', () => {
    render(<SurfaceEntryGrid tiles={baseTiles} loading />);

    expect(screen.getAllByText('\u2026')).toHaveLength(2);
  });

  it('falls back to em dash for zero counts', () => {
    render(
      <SurfaceEntryGrid
        tiles={baseTiles.map((tile) => ({ ...tile, count: 0 }))}
      />
    );

    expect(screen.getAllByText('\u2014')).toHaveLength(2);
  });

  it('forwards optional route search payload to Link', () => {
    const tilesWithSearch: SurfaceEntryTile[] = [
      {
        label: 'Queue',
        role: 'Ranked recommendations ready to execute',
        count: 3,
        to: '/actions',
        search: {
          sort: undefined,
          simulatableOnly: undefined,
          selectedId: undefined,
        },
      },
    ];

    render(<SurfaceEntryGrid tiles={tilesWithSearch} />);

    expect(mockLinkProps).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/actions',
        search: {
          sort: undefined,
          simulatableOnly: undefined,
          selectedId: undefined,
        },
      })
    );
  });
});
