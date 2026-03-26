import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import ProjectsIndex from '../../../app/routes/projects';

describe('ProjectsIndex', () => {
  it('renders projects from API', async () => {
    const fake = [{ id: 'p1', title: 'A Project', statusVariant: 'active', progressPercent: 50, bestMoveTitle: 'Do it' }];
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ projects: fake }) } as any));
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <ProjectsIndex />
      </QueryClientProvider>
    );

    // wait for title to appear
    expect(await screen.findByText('A Project')).toBeDefined();
  });
});
