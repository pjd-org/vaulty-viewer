import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { WorkspaceScaffold } from '../components/layout';
import { portfolioSearchParams } from '../../src/lib/routes/search-params';

export const Route = createFileRoute('/portfolio')({
  validateSearch: portfolioSearchParams,
  component: PortfolioRoute,
});

function PortfolioRoute() {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => null,
    staleTime: 30_000,
  });

  return (
    <WorkspaceScaffold
      title="Portfolio"
      subtitle="Capital-control lane for allocation, drift, and rebalance actions."
      summaryItems={[
        { label: 'Value', value: '—', detail: 'Adapter context ready' },
        {
          label: 'Drift',
          value: '—',
          detail: 'Route ready for adapter payloads',
        },
        { label: 'Risk', value: '—', detail: 'Detail panel reserved' },
        {
          label: 'Action',
          value: 'Rebalance',
          detail: 'Primary CTA slot established',
        },
      ]}
      primaryTitle="Portfolio Workspace"
      primarySubtitle="Allocation, performance, drift, positions, and risks."
      primary={
        isLoading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : data == null ? (
          <div data-testid="portfolio-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No portfolio data yet.
            </p>
            <p className="text-xs text-neutral-400">
              Adapter context is wired. Charts, risk explanations, and rebalance
              workflows will appear once the runtime surface connects.
            </p>
          </div>
        ) : null
      }
      asideTitle="Action Surface"
      asideSubtitle="Rebalance, create review, or inspect holdings."
      aside={
        <div data-testid="portfolio-aside-empty-state" className="space-y-2">
          <p className="text-sm font-medium text-neutral-600">
            No item selected.
          </p>
          <p className="text-xs text-neutral-400">
            Selection-driven details will render here.
          </p>
        </div>
      }
    />
  );
}
