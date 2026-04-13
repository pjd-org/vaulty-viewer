import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';

import { ProjectsWorkspace } from '../components/projects';
import { WorkspaceScaffold } from '../components/layout';
import { RouteLoadingState } from '../components/ui';
import { useLoginRedirectOnUnauthenticated } from '../hooks/use-login-redirect';
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

// ---------------------------------------------------------------------------
// TaskList — rows expand inline to show TaskDetail
// ---------------------------------------------------------------------------

function TaskList({
  tasks,
  selectedId,
  onSelect,
}: {
  tasks: NextAction[];
  selectedId: string | null;
  onSelect: (task: NextAction | null) => void;
}) {
  return (
    <ul
      data-testid="work-task-list"
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
    >
      {tasks.map((task) => {
        const isExpanded = selectedId === task.id;
        return (
          <li key={task.id} className="rounded-2xl border border-slate-200 bg-white/80 shadow-[0_6px_18px_-14px_rgba(15,23,42,0.45)]">
            <button
              type="button"
              onClick={() => onSelect(isExpanded ? null : task)}
              aria-expanded={isExpanded}
              className={[
                'flex w-full items-start justify-between rounded-2xl px-4 py-3 text-sm transition-colors',
                isExpanded
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="flex min-w-0 items-start gap-2">
                <span
                  className={`mt-1 size-2 shrink-0 rounded-full ${
                    task.status === 'blocked' ? 'bg-red-400' : 'bg-emerald-400'
                  }`}
                />
                <div className="min-w-0">
                  <span className="line-clamp-2 text-left font-semibold text-slate-800">
                    {task.title}
                  </span>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{task.priority}p</span>
                    <span>·</span>
                    <span>{task.estimatedTimeMin ?? 0}m</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    task.status === 'blocked'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {task.status}
                </span>
                <span
                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  aria-hidden="true"
                >
                  ›
                </span>
              </div>
            </button>
            {isExpanded && (
              <div className="mx-2 mb-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 animate-fade-in">
                <TaskDetail task={task} />
              </div>
            )}
          </li>
        );
      })}
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
  onSelect: (task: NextAction | null) => void;
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
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">
          Next Actions
        </h3>
        <span className="text-xs font-medium text-slate-500">
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
        <p className="font-medium leading-snug text-slate-800">{task.title}</p>
        {task.description ? (
          <p className="mt-1 text-xs text-slate-500">{task.description}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-400 italic">
            No description. Open the note to add context.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {task.priority > 0 && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-700">
            p{task.priority}
          </span>
        )}
        {task.effortScore > 0 && (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-slate-500">
            effort {task.effortScore}
          </span>
        )}
        {task.focusCost > 0 && (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-slate-500">
            focus {task.focusCost}
          </span>
        )}
        {task.estimatedTimeMin > 0 && (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-slate-500">
            {task.estimatedTimeMin}m
          </span>
        )}
        {task.dueDate && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">
            due {task.dueDate}
          </span>
        )}
        <span
          className={[
            'rounded-full px-2 py-0.5 text-[11px]',
            task.status === 'blocked'
              ? 'bg-red-100 text-red-700'
              : 'bg-emerald-100 text-emerald-700',
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
              className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-slate-500"
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
              <li key={i} className="text-xs text-red-600">
                {b.description ?? String(b)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {task.path && (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/note"
            search={{ p: task.path }}
            className="inline-block text-xs text-slate-500 underline underline-offset-2 transition hover:text-slate-700"
          >
            Open note →
          </Link>
          <Link
            to="/knowledge"
            search={{ tab: 'notes' }}
            onClick={() => {
              try {
                const hint =
                  task.tags.length > 0
                    ? task.tags[0]
                    : task.title.split(' ').slice(0, 3).join(' ');
                sessionStorage.setItem('knowledge-search-hint', hint);
              } catch {
                // sessionStorage unavailable — silently skip
              }
            }}
            className="inline-block text-xs text-sky-600 underline underline-offset-2 transition hover:text-sky-800"
          >
            Related knowledge →
          </Link>
          <Link
            to="/huey"
            onClick={() => {
              try {
                sessionStorage.setItem('huey-task-hint', task.title);
              } catch {
                // sessionStorage unavailable — silently skip
              }
            }}
            className="inline-block text-xs text-violet-600 underline underline-offset-2 transition hover:text-violet-800"
          >
            Ask Huey about this →
          </Link>
        </div>
      )}
      {!task.path && (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/knowledge"
            search={{ tab: 'notes' }}
            onClick={() => {
              try {
                sessionStorage.setItem(
                  'knowledge-search-hint',
                  task.title.split(' ').slice(0, 3).join(' ')
                );
              } catch {
                // sessionStorage unavailable — silently skip
              }
            }}
            className="inline-block text-xs text-sky-600 underline underline-offset-2 transition hover:text-sky-800"
          >
            Related knowledge →
          </Link>
          <Link
            to="/huey"
            onClick={() => {
              try {
                sessionStorage.setItem('huey-task-hint', task.title);
              } catch {
                // sessionStorage unavailable — silently skip
              }
            }}
            className="inline-block text-xs text-violet-600 underline underline-offset-2 transition hover:text-violet-800"
          >
            Ask Huey about this →
          </Link>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// WorkRoute
// ---------------------------------------------------------------------------

function WorkRoute() {
  const { data, isLoading, error } = useWorkSurface();
  const [selectedTask, setSelectedTask] = useState<NextAction | null>(null);
  const [taskFilter, setTaskFilter] = useState<'all' | 'ready' | 'blocked'>(
    'all'
  );
  const isUnauthenticated = useLoginRedirectOnUnauthenticated(error);
  const blockedCount = useMemo(
    () => data?.tasks.filter((t) => t.status === 'blocked').length ?? 0,
    [data]
  );
  const readyCount = useMemo(
    () => data?.tasks.filter((t) => t.status !== 'blocked').length ?? 0,
    [data]
  );
  const filteredData = useMemo(() => {
    if (!data) return data;
    if (taskFilter === 'ready') {
      return { ...data, tasks: data.tasks.filter((t) => t.status !== 'blocked') };
    }
    if (taskFilter === 'blocked') {
      return { ...data, tasks: data.tasks.filter((t) => t.status === 'blocked') };
    }
    return data;
  }, [data, taskFilter]);

  // Clear selection if the selected task is no longer in the refreshed data
  useEffect(() => {
    if (!selectedTask || !filteredData) return;
    const stillExists = filteredData.tasks.some((t) => t.id === selectedTask.id);
    if (!stillExists) setSelectedTask(null);
  }, [filteredData, selectedTask]);

  if (isUnauthenticated) return null;

  return (
    <WorkspaceScaffold
      title="Work"
      subtitle="Durable execution lane for tasks, projects, and dependencies."
      statusLine={
        data
          ? `${data.total} task${data.total !== 1 ? 's' : ''} unblocked · ${data.mode} mode`
          : undefined
      }
      nextAction="→ Expand a task to inspect blockers, or open a project to see its full board."
      summaryItems={[
        {
          label: 'Projects',
          value: 'Live',
          detail: 'All projects — click to open',
        },
        {
          label: 'Tasks',
          value: data ? String(data.total) : '—',
          detail:
            data && data.total > 0
              ? `${data.total} unblocked — expand any to inspect`
              : 'No unblocked tasks in range',
        },
        {
          label: 'Mode',
          value: data ? data.mode : '—',
          detail:
            data?.mode === 'cod'
              ? 'COD-ranked priority'
              : 'Local fallback order',
        },
        {
          label: 'Scope',
          value: 'Portfolio',
          detail: 'Global work lane — all projects',
        },
      ]}
      primaryTitle="Projects & Tasks"
      primarySubtitle="Projects list and ranked next actions."
      primary={
        isLoading ? (
          <RouteLoadingState label="Loading project lanes..." />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Total
                </p>
                <p className="mt-1 text-3xl font-semibold leading-none text-slate-800">
                  {data?.total ?? 0}
                </p>
                <div className="mt-2 h-px w-12 bg-slate-300" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Ready
                </p>
                <p className="mt-1 text-3xl font-semibold leading-none text-emerald-700">
                  {readyCount}
                </p>
                <div className="mt-2 h-px w-12 bg-emerald-300" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Blocked
                </p>
                <p className="mt-1 text-3xl font-semibold leading-none text-red-700">
                  {blockedCount}
                </p>
                <div className="mt-2 h-px w-12 bg-red-300" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTaskFilter('all')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                    taskFilter === 'all'
                      ? 'border-slate-800 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  All ({data?.total ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter('ready')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                    taskFilter === 'ready'
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Ready ({readyCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter('blocked')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                    taskFilter === 'blocked'
                      ? 'border-red-700 bg-red-700 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Blocked ({blockedCount})
                </button>
              </div>
            </div>
            <ProjectsWorkspace />
            <TaskSection
              data={filteredData}
              selectedId={selectedTask?.id ?? null}
              onSelect={setSelectedTask}
            />
          </>
        )
      }
    />
  );
}
