import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { ProjectsWorkspace } from '../components/projects';
import { WorkspaceScaffold } from '../components/layout';
import { workSearchParams } from '../../src/lib/routes/search-params';
import { useWorkSurface, type WorkSurfacePayload } from '../lib/viewer-adapter';
import type { NextAction } from '../../src/lib/focus-logic';

export const Route = createFileRoute('/work')({
  validateSearch: workSearchParams,
  component: WorkRoute,
});

function TaskList({ tasks }: { tasks: NextAction[] }) {
  return (
    <ul data-testid="work-task-list" className="space-y-1">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`shrink-0 size-2 rounded-full ${
                task.status === 'blocked' ? 'bg-red-400' : 'bg-emerald-400'
              }`}
            />
            <span className="truncate font-medium">{task.title}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
            {task.effortScore != null && (
              <span title="Effort">{task.effortScore}e</span>
            )}
            {task.estimatedTimeMin != null && (
              <span title="Estimated time">{task.estimatedTimeMin}m</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function TaskSection({ data }: { data: WorkSurfacePayload | undefined }) {
  if (!data) {
    return (
      <div data-testid="work-task-empty-state" className="mt-4 space-y-2">
        <p className="text-sm font-medium text-neutral-600">
          Task and dependency data not yet connected.
        </p>
        <p className="text-xs text-neutral-400">
          Adapter context is wired. Task and dependency workspaces will appear
          once the runtime surface connects.
        </p>
      </div>
    );
  }

  if (data.tasks.length === 0) {
    return (
      <div data-testid="work-task-empty-state" className="mt-4 space-y-2">
        <p className="text-sm font-medium text-neutral-600">No tasks ready.</p>
        <p className="text-xs text-neutral-400">
          All tasks may be blocked or no unblocked tasks remain.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Next Actions</h3>
        <span className="text-xs text-muted-foreground">
          {data.total} tasks · {data.mode}
        </span>
      </div>
      <TaskList tasks={data.tasks} />
    </div>
  );
}

function WorkRoute() {
  const { data, isLoading } = useWorkSurface();

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
        {
          label: 'Tasks',
          value: data ? String(data.total) : '—',
          detail: 'Unblocked next actions',
        },
        {
          label: 'Mode',
          value: data ? data.mode : '—',
          detail: 'COD or local fallback',
        },
        { label: 'Scope', value: 'Portfolio', detail: 'Global work lane' },
      ]}
      primaryTitle="Projects & Tasks"
      primarySubtitle="Projects list and ranked next actions."
      primary={
        isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <ProjectsWorkspace />
            <TaskSection data={data} />
          </>
        )
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
