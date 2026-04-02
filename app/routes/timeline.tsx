import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { WorkspaceScaffold } from '../components/layout';
import { timelineSearchParams } from '../../src/lib/routes/search-params';

export const Route = createFileRoute('/timeline')({
  validateSearch: timelineSearchParams,
  component: TimelineRoute,
});

function TimelineRoute() {
  const { data, isLoading } = useQuery({
    queryKey: ['timeline'],
    queryFn: async () => null,
    staleTime: 30_000,
  });

  return (
    <WorkspaceScaffold
      title="Timeline"
      subtitle="Replay and audit surface for interventions, incidents, rejections, and runs."
      summaryItems={[
        {
          label: 'Mode',
          value: 'Audit',
          detail: 'Live and replay params reserved',
        },
        { label: 'Interventions', value: '—', detail: 'Adapter context ready' },
        {
          label: 'Rejections',
          value: '—',
          detail: 'User vs automated stays distinct',
        },
        {
          label: 'Runs',
          value: '—',
          detail: 'Huey, pipelines, schedules, agents',
        },
      ]}
      primaryTitle="Event Stream"
      primarySubtitle="Timeline list and filter controls."
      primary={
        isLoading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : data == null ? (
          <div data-testid="timeline-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No timeline events yet.
            </p>
            <p className="text-xs text-neutral-400">
              Adapter context is wired. Live and audit event streams will appear
              once the runtime surface connects.
            </p>
          </div>
        ) : null
      }
      asideTitle="Event Detail"
      asideSubtitle="Before/after state, actors, context, and replay."
      aside={
        <div data-testid="timeline-aside-empty-state" className="space-y-2">
          <p className="text-sm font-medium text-neutral-600">
            No event selected.
          </p>
          <p className="text-xs text-neutral-400">
            Detailed event inspection lands here.
          </p>
        </div>
      }
    />
  );
}
