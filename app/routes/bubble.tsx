import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { WorkspaceScaffold } from '../components/layout';
import { bubbleSearchParams } from '../../src/lib/routes/search-params';

export const Route = createFileRoute('/bubble')({
  validateSearch: bubbleSearchParams,
  component: BubbleRoute,
});

function BubbleRoute() {
  const { data, isLoading } = useQuery({
    queryKey: ['bubble'],
    queryFn: async () => null,
    staleTime: 30_000,
  });

  return (
    <WorkspaceScaffold
      title="Bubble"
      subtitle="Behavioral control lane for pressure, drift, momentum, and rewards."
      summaryItems={[
        { label: 'Momentum', value: '—', detail: 'Adapter context ready' },
        { label: 'Pressure', value: '—', detail: 'COD signals belong here' },
        { label: 'Rewards', value: '—', detail: 'Action surface reserved' },
        { label: 'Energy', value: '—', detail: 'Chart hooks ready' },
      ]}
      primaryTitle="Bubble Workspace"
      primarySubtitle="Interpretation on the left, intervention on the right."
      primary={
        isLoading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : data == null ? (
          <div data-testid="bubble-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No bubble data yet.
            </p>
            <p className="text-xs text-neutral-400">
              Adapter context is wired. Pressure, momentum, and reward surfaces
              will appear once the runtime connects.
            </p>
          </div>
        ) : null
      }
      asideTitle="Intervention Panel"
      asideSubtitle="Adjust state or create follow-up."
      aside={
        <div data-testid="bubble-aside-empty-state" className="space-y-2">
          <p className="text-sm font-medium text-neutral-600">
            No item selected.
          </p>
          <p className="text-xs text-neutral-400">
            Selection-driven bubble actions will render here.
          </p>
        </div>
      }
    />
  );
}
