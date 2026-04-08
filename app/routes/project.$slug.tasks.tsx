import React from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';

import { SoftPanel } from '../components/layout';
import { EmptyState } from '../components/ui/EmptyState';
import { SoftChip, StatusPill, type TaskStatus } from '../components/ui/Chips';
import { getAllTasksQueryOptions, useAllTasks } from '../lib/queries/tasks';
import type { KanbanTask } from '../../src/lib/kanban-logic';
import { projectSearchParams } from '../../src/lib/routes/search-params';

const STATUS_ORDER: Record<TaskStatus, number> = {
  backlog: 0,
  todo: 1,
  'in-progress': 2,
  blocked: 3,
  done: 4,
};

export const Route = createFileRoute('/project/$slug/tasks')({
  validateSearch: projectSearchParams,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(getAllTasksQueryOptions());
  },
  component: ProjectTasksRoute,
});

function normalizeTaskStatus(status: string): TaskStatus {
  const normalized = status.toLowerCase();
  if (normalized === 'in_progress') return 'in-progress';
  if (normalized === 'completed') return 'done';
  if (normalized === 'blocked') return 'blocked';
  if (normalized === 'backlog') return 'backlog';
  if (normalized === 'done') return 'done';
  return 'todo';
}

function sortTasks(a: KanbanTask, b: KanbanTask) {
  const statusDelta =
    STATUS_ORDER[normalizeTaskStatus(a.status)] -
    STATUS_ORDER[normalizeTaskStatus(b.status)];
  return (
    b.priority - a.priority || statusDelta || a.title.localeCompare(b.title)
  );
}

function buildTaskSearch(
  search: ReturnType<typeof Route.useSearch>,
  selectedId: string
) {
  return {
    ...search,
    selectedId,
  };
}

function ProjectTasksRoute() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { data: allTasks = [], isLoading, error } = useAllTasks();

  const projectTasks = React.useMemo(
    () => allTasks.filter((task) => task.projectId === slug).sort(sortTasks),
    [allTasks, slug]
  );

  const selectedTask =
    projectTasks.find((task) => task.id === search.selectedId) ??
    projectTasks[0] ??
    null;

  const blockedTasks = React.useMemo(
    () =>
      projectTasks.filter(
        (task) => normalizeTaskStatus(task.status) === 'blocked'
      ),
    [projectTasks]
  );

  const taskSummary = React.useMemo(
    () => [
      { label: 'Total', value: projectTasks.length },
      {
        label: 'Open',
        value: projectTasks.filter(
          (task) => normalizeTaskStatus(task.status) !== 'done'
        ).length,
      },
      { label: 'Blocked', value: blockedTasks.length },
      { label: 'Selected', value: selectedTask ? 1 : 0 },
    ],
    [blockedTasks.length, projectTasks, selectedTask]
  );

  const selectedTaskTags = selectedTask?.tags ?? [];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-4">
        {taskSummary.map((item) => (
          <div
            key={item.label}
            className="rounded-[18px] border border-slate-200 bg-black/3 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-800">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <SoftPanel
          variant="elevated"
          title="Task Queue"
          subtitle="Choose a project task to inspect its detail and note link."
        >
          {isLoading && !projectTasks.length ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-[18px] border border-slate-200 bg-black/3"
                />
              ))}
            </div>
          ) : error && !projectTasks.length ? (
            <EmptyState
              title="Project tasks are temporarily unavailable."
              description="The project shell is intact. Retry once the task feed responds again."
            />
          ) : projectTasks.length === 0 ? (
            <EmptyState
              title="No tasks surfaced for this project."
              description="When scoped work lands, it will appear here with the selected task detail rail."
            />
          ) : (
            <div className="space-y-3">
              {projectTasks.map((task) => {
                const active = selectedTask?.id === task.id;
                const taskStatus = normalizeTaskStatus(task.status);

                return (
                  <Link
                    key={task.id}
                    to="/project/$slug/tasks"
                    params={{ slug }}
                    search={buildTaskSearch(search, task.id)}
                    className={[
                      'block rounded-[18px] border p-4 transition',
                      active
                        ? 'border-sky-300 bg-sky-50 shadow-[0_18px_45px_rgba(56,189,248,0.10)]'
                        : 'border-slate-200 bg-black/3 hover:border-slate-300 hover:bg-black/5',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          {task.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {task.estimatedTimeMin != null &&
                          task.estimatedTimeMin > 0
                            ? `${task.estimatedTimeMin}m estimated`
                            : 'No estimate yet'}
                        </p>
                      </div>
                      <StatusPill status={taskStatus} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {task.tags?.slice(0, 4).map((tag) => (
                        <SoftChip key={tag} label={tag} />
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </SoftPanel>

        <div className="space-y-4">
          <SoftPanel
            variant="utility"
            title="Selected Task"
            subtitle="Detail, status, and the canonical task note link."
          >
            {selectedTask ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">
                      {selectedTask.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedTask.estimatedTimeMin != null &&
                      selectedTask.estimatedTimeMin > 0
                        ? `${selectedTask.estimatedTimeMin}m estimate`
                        : 'No estimate yet'}
                    </p>
                  </div>
                  <StatusPill
                    status={normalizeTaskStatus(selectedTask.status)}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-slate-200 bg-black/3 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Priority
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-800">
                      {selectedTask.priority}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-black/3 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Project
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {slug}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedTaskTags.length ? (
                    selectedTaskTags.map((tag) => (
                      <SoftChip key={tag} label={tag} />
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No tags yet.</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={selectedTask.link}
                    className="text-sm font-semibold text-sky-700 underline decoration-sky-400/60 underline-offset-4"
                  >
                    Open task note
                  </a>
                  {selectedTask.path ? (
                    <span className="text-xs text-slate-500">
                      {selectedTask.path}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No task selected."
                description="Pick a task from the queue to inspect its detail rail."
              />
            )}
          </SoftPanel>

          <SoftPanel
            variant="utility"
            title="Blockers"
            subtitle="Tasks currently holding the project up."
          >
            {blockedTasks.length ? (
              <div className="space-y-3">
                {blockedTasks.map((task) => (
                  <Link
                    key={task.id}
                    to="/project/$slug/tasks"
                    params={{ slug }}
                    search={buildTaskSearch(search, task.id)}
                    className="block rounded-[18px] border border-slate-200 bg-black/3 p-4 transition hover:border-slate-300 hover:bg-black/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {task.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {task.estimatedTimeMin != null &&
                          task.estimatedTimeMin > 0
                            ? `${task.estimatedTimeMin}m estimated`
                            : 'No estimate yet'}
                        </p>
                      </div>
                      <StatusPill status="blocked" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No blockers surfaced."
                description="Once a task stalls, it will appear here for faster triage."
              />
            )}
          </SoftPanel>
        </div>
      </div>
    </div>
  );
}
