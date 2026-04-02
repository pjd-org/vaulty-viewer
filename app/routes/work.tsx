import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { ProjectsWorkspace } from '../components/projects';
import { WorkspaceScaffold } from '../components/layout';
import { workSearchParams } from '../../src/lib/routes/search-params';

export const Route = createFileRoute('/work')({
  validateSearch: workSearchParams,
  component: WorkRoute,
});

function WorkRoute() {
  const { data, isLoading } = useQuery({
    queryKey: ['work'],
    queryFn: async () => null,
    staleTime: 30_000,
  });

  return (
    <WorkspaceScaffold
      title="Work"
      subtitle="Durable execution lane for tasks, projects, and dependencies."
      summaryItems={[
        {
          label: 'Projects',
          value: 'Live',
          detail: 'Legacy projects index now lands here',
        },
        { label: 'Tasks', value: '—', detail: 'Adapter context ready' },
        {
          label: 'Dependencies',
          value: '—',
          detail: 'Unblock paths and bottlenecks',
        },
        { label: 'Scope', value: 'Portfolio', detail: 'Global work lane' },
      ]}
      primaryTitle="Projects"
      primarySubtitle="Compatibility-preserving project list while the work lane grows."
      primary={
        <>
          <ProjectsWorkspace />
          {!isLoading && data == null && (
            <div data-testid="work-empty-state" className="mt-4 space-y-2">
              <p className="text-sm font-medium text-neutral-600">
                Task and dependency data not yet connected.
              </p>
              <p className="text-xs text-neutral-400">
                Adapter context is wired. Task and dependency workspaces will
                appear once the runtime surface connects.
              </p>
            </div>
          )}
        </>
      }
      asideTitle="Execution Notes"
      asideSubtitle="Task details and dependency paths."
      aside={
        <div data-testid="work-aside-empty-state" className="space-y-2">
          <p className="text-sm font-medium text-neutral-600">
            No item selected.
          </p>
          <p className="text-xs text-neutral-400">
            Select a task or project to see details, blockers, and next steps
            here.
          </p>
        </div>
      }
    />
  );
}
