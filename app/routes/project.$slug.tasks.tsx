import React from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';

import { SoftPanel } from '../components/layout';
import { EmptyState } from '../components/ui/EmptyState';
import { SoftChip, StatusPill, type TaskStatus } from '../components/ui/Chips';
import { BlockersRail } from '../components/projects/BlockersRail';
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
  const navigate = useNavigate();
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
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-4">
        {taskSummary.map((item) => (
          <div
            key={item.label}
            className="rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-utility)] p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
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
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)]"
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
            <div className="flex flex-col gap-3">
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
                      'block rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-4 transition',
                      active
                        ? 'border-[color-mix(in_srgb,var(--a-sky)_30%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_10%,var(--surf-base))] shadow-sm'
                        : 'hover:border-[var(--border-default)] hover:bg-[var(--surf-elevated)]',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-snug text-[var(--text-primary)]">
                          {task.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
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

        <div className="flex flex-col gap-4">
          <SoftPanel
            variant="utility"
            title="Selected Task"
            subtitle="Detail, status, and the canonical task note link."
          >
            {selectedTask ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold leading-snug text-[var(--text-primary)]">
                      {selectedTask.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
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
                  <div className="rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                      Priority
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
                      {selectedTask.priority}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                      Project
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
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
                    <p className="text-sm text-muted-foreground">No tags yet.</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={selectedTask.link}
                    className="rounded-full border border-[color-mix(in_srgb,var(--a-sky)_30%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_12%,var(--surf-elevated))] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--a-sky)_18%,var(--surf-elevated))]"
                  >
                    Open task note
                  </a>
                  <Link
                    to="/project/$slug/tasks"
                    params={{ slug }}
                    search={buildTaskSearch(search, selectedTask.id)}
                    className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surf-elevated)]"
                  >
                    Keep selected
                  </Link>
                  {selectedTask.path ? (
                    <span className="text-xs text-[var(--text-tertiary)]">
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

          {blockedTasks.length ? (
            <BlockersRail
              blockedTasks={blockedTasks}
              subtitle="Tasks currently holding the project up."
              selectedTaskId={selectedTask?.id}
              showSelectCta
              onSelectTask={(taskId) =>
                void navigate({
                  to: '/project/$slug/tasks',
                  params: { slug },
                  search: buildTaskSearch(search, taskId),
                })
              }
            />
          ) : (
            <SoftPanel
              variant="utility"
              title="Blockers"
              subtitle="Tasks currently holding the project up."
            >
              <EmptyState
                title="No blockers surfaced."
                description="Once a task stalls, it will appear here for faster triage."
              />
            </SoftPanel>
          )}
        </div>
      </div>
    </div>
  );
}
