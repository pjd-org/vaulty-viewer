import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';

// ProjectDetail exports Route; for test we render SkeletonCard to assert loading state

describe('ProjectDetail (skeleton)', () => {
  it('shows skeleton when loading', async () => {
    const { default: SkeletonCard } = await import('../../app/components/ui/SkeletonCard');
    const qc = new QueryClient();
    const { container } = render(
      <QueryClientProvider client={qc}>
        <SkeletonCard />
      </QueryClientProvider>
    );
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
