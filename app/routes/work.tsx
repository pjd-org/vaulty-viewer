import React, { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';

import { ProjectsWorkspace } from '../components/projects';
import { WorkspaceScaffold } from '../components/layout';
import { workSearchParams } from '../../src/lib/routes/search-params';
import { useWorkSurface, type WorkSurfacePayload } from '../lib/viewer-adapter';
import type { NextAction } from '../../src/lib/focus-logic';

export const Route = createFileRoute('/work')({
  validateSearch: workSearchParams,
  component: WorkRoute,
});

// ---------------------------------------------------------------------------
// TaskList
// ---------------------------------------------------------------------------

function TaskList({
  tasks,
  selectedId,
  onSelect,
}: {
  tasks: NextAction[];
  selectedId: string | null;
  onSelect: (task: NextAction) => void;
}) {
  return (
    <ul data-testid="work-task-list" className="space-y-1">
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            onClick={() => onSelect(task)}
            className={[
              'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
              selectedId === task.id
                ? 'bg-white/10 text-slate-100'
                : 'text-slate-300 hover:bg-muted/50',
            ].join(' ')}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`size-2 shrink-0 rounded-full ${
                  task.status === 'blocked' ? 'bg-red-400' : 'bg-emerald-400'
                }`}
              />
              <span className="truncate font-medium">{task.title}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
              {task.effortScore != null && (
                <span title="Effort">{task.effortScore}e</span>
              )}
              {task.estimatedTimeMin != null && (
                <span title="Estimated time">{task.estimatedTimeMin}m</span>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// TaskSection
// ---------------------------------------------------------------------------

function TaskSection({
  data,
  selectedId,
  onSelect,
}: {
  data: WorkSurfacePayload | undefined;
  selectedId: string | null;
  onSelect: (task: NextAction) => void;
}) {
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
      <TaskList
        tasks={data.tasks}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaskDetail (aside)
// ---------------------------------------------------------------------------

function TaskDetail({ task }: { task: NextAction }) {
  const blockers =
    (task.blockers as { description?: string }[] | undefined) ?? [];

  return (
    <div className="space-y-4 text-sm" data-testid="work-task-detail">
      <div>
        <p className="font-medium leading-snug text-slate-100">{task.title}</p>
        {task.description && (
          <p className="mt-1 text-xs text-slate-400">{task.description}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {task.effortScore > 0 && (
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-slate-400">
            effort {task.effortScore}
          </span>
        )}
        {task.focusCost > 0 && (
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-slate-400">
            focus {task.focusCost}
          </span>
        )}
        {task.estimatedTimeMin > 0 && (
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-slate-400">
            {task.estimatedTimeMin}m
          </span>
        )}
        {task.dueDate && (
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-300">
            due {task.dueDate}
          </span>
        )}
        <span
          className={[
            'rounded-full px-2 py-0.5 text-[11px]',
            task.status === 'blocked'
              ? 'bg-red-400/15 text-red-300'
              : 'bg-emerald-400/15 text-emerald-300',
          ].join(' ')}
        >
          {task.status}
        </span>
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/6 px-2 py-0.5 text-[11px] text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {blockers.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-slate-500">
            Blockers
          </p>
          <ul className="space-y-1">
            {blockers.map((b, i) => (
              <li key={i} className="text-xs text-red-300">
                {b.description ?? String(b)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to="/note"
        search={{ p: task.path }}
        className="inline-block text-xs text-slate-500 underline underline-offset-2 transition hover:text-slate-300"
      >
        Open note →
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WorkRoute
// ---------------------------------------------------------------------------

function WorkRoute() {
  const { data, isLoading } = useWorkSurface();
  const [selectedTask, setSelectedTask] = useState<NextAction | null>(null);

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
            <TaskSection
              data={data}
              selectedId={selectedTask?.id ?? null}
              onSelect={setSelectedTask}
            />
          </>
        )
      }
      asideTitle="Execution Notes"
      asideSubtitle="Task details and dependency paths."
      aside={
        selectedTask ? (
          <TaskDetail task={selectedTask} />
        ) : (
          <div data-testid="work-aside-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-neutral-600">
              No item selected.
            </p>
            <p className="text-xs text-neutral-400">
              Select a task to see details, blockers, and next steps here.
            </p>
          </div>
        )
      }
    />
  );
}
