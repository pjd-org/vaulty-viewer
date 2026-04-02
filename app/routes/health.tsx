import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { WorkspaceScaffold } from '../components/layout';
import { healthSearchParams } from '../../src/lib/routes/search-params';

export const Route = createFileRoute('/health')({
  validateSearch: healthSearchParams,
  component: HealthRoute,
});

function HealthRoute() {
  const { data, isLoading } = useQuery({
    queryKey: ['health'],
    // TODO: queryFn always returns null — data is permanently null until the runtime adapter is wired.
    // isLoading is unreachable after first tick. Replace when the health adapter is ready.
    queryFn: async () => null,
    staleTime: 30_000,
  });

  return (
    <WorkspaceScaffold
      title="Health"
      subtitle="Platform-integrity lane for freshness, incidents, sync, and degraded services."
      summaryItems={[
        { label: 'Freshness', value: '—', detail: 'Adapter context ready' },
        {
          label: 'Integrity',
          value: '—',
          detail: 'Validation and sync posture',
        },
        { label: 'Incidents', value: '—', detail: 'Incident feed shell ready' },
        {
          label: 'Degraded',
          value: '0',
          detail: 'Reserved for runtime status',
        },
      ]}
      primaryTitle="Health Workspace"
      primarySubtitle="Service and incident list."
      primary={
        isLoading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : data == null ? (
          <div data-testid="health-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No health data yet.
            </p>
            <p className="text-xs text-neutral-400">
              Adapter context is wired. Incident feeds and service status tables
              will appear once the runtime connects.
            </p>
          </div>
        ) : null
      }
      asideTitle="Investigation Panel"
      asideSubtitle="Root cause, related entities, and timeline links."
      aside={
        <div data-testid="health-aside-empty-state" className="space-y-2">
          <p className="text-sm font-medium text-neutral-600">
            No item selected.
          </p>
          <p className="text-xs text-neutral-400">
            Selection-driven investigations will render here.
          </p>
        </div>
      }
    />
  );
}
