import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { WorkspaceScaffold } from '../components/layout';
import { automationSearchParams } from '../../src/lib/routes/search-params';

export const Route = createFileRoute('/automation')({
  validateSearch: automationSearchParams,
  component: AutomationRoute,
});

function AutomationRoute() {
  const { data, isLoading } = useQuery({
    queryKey: ['automation'],
    queryFn: async () => null,
    staleTime: 30_000,
  });

  return (
    <WorkspaceScaffold
      title="Automation"
      subtitle="Pipelines, Huey, schedules, and runners in one machine-control lane."
      summaryItems={[
        { label: 'Pipelines', value: '—', detail: 'Adapter context ready' },
        { label: 'Huey', value: '—', detail: 'Queue health pending' },
        { label: 'Stuck runs', value: '—', detail: 'Needs adapter data' },
        { label: 'Schedules', value: '—', detail: 'Today and upcoming' },
      ]}
      primaryTitle="Operational Workspace"
      primarySubtitle="Pipelines, runners, Huey, and schedules."
      primary={
        isLoading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : data == null ? (
          <div data-testid="automation-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No automation data yet.
            </p>
            <p className="text-xs text-neutral-400">
              Adapter context is wired. Data will appear once the runtime
              surface connects.
            </p>
          </div>
        ) : null
      }
      asideTitle="Detail Panel"
      asideSubtitle="Retry, inspect, and verification hooks live here."
      aside={
        <div data-testid="automation-aside-empty-state" className="space-y-2">
          <p className="text-sm font-medium text-neutral-600">
            No item selected.
          </p>
          <p className="text-xs text-neutral-400">
            Select a run, pipeline, or schedule to inspect it here.
          </p>
        </div>
      }
    />
  );
}
