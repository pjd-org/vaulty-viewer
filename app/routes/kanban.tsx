import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { apiFetch, UnauthenticatedError } from '../../src/utils/api';
import {
  STATUS_COLUMNS,
  buildColumns,
  filterBacklog,
  normalizeTask,
  type KanbanTask,
  type KanbanColumn,
} from '../../src/lib/kanban-logic';
import { WorkspaceScaffold } from '../components/layout';
import { EmptyState } from '../components/ui';

type ApiStatus = 'online' | 'offline' | 'error' | 'unknown';

export const Route = createFileRoute('/kanban')({
  component: KanbanRoute,
});

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type KanbanState = {
  apiStatus: ApiStatus;
  apiTasks: KanbanTask[];
  mutatingTaskId: string | null;
  draggingTaskId: string | null;
};

type KanbanAction =
  | { type: 'TASKS_LOADED'; tasks: KanbanTask[] }
  | { type: 'API_OFFLINE' }
  | { type: 'MUTATE_START'; taskId: string }
  | {
      type: 'MUTATE_DONE';
      path: string;
      id: string;
      status: string;
      updatedPath: string;
    }
  | { type: 'MUTATE_FAIL' }
  | { type: 'MUTATE_RETRY' }
  | { type: 'DRAG_START'; taskId: string }
  | { type: 'DRAG_END' };

function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {
    case 'TASKS_LOADED':
      return { ...state, apiTasks: action.tasks, apiStatus: 'online' };
    case 'API_OFFLINE':
      return { ...state, apiStatus: 'offline' };
    case 'MUTATE_START':
      return { ...state, mutatingTaskId: action.taskId };
    case 'MUTATE_DONE':
      return {
        ...state,
        apiStatus: 'online',
        mutatingTaskId: null,
        draggingTaskId: null,
        apiTasks: state.apiTasks.map((t) =>
          t.path === action.path || t.id === action.id
            ? { ...t, status: action.status, path: action.updatedPath }
            : t
        ),
      };
    case 'MUTATE_FAIL':
      return {
        ...state,
        // Transient error: board remains interactive so the user can retry.
        // We don't lock to 'offline' permanently — a single PATCH failure
        // should not disable all drag-drop for the rest of the session.
        apiStatus: 'error',
        mutatingTaskId: null,
        draggingTaskId: null,
      };
    case 'MUTATE_RETRY':
      return { ...state, apiStatus: 'online' };
    case 'DRAG_START':
      return { ...state, draggingTaskId: action.taskId };
    case 'DRAG_END':
      return { ...state, draggingTaskId: null };
  }
}

// ---------------------------------------------------------------------------
// KanbanCard sub-component
// ---------------------------------------------------------------------------

interface KanbanCardProps {
  task: KanbanTask;
  isDragging: boolean;
  isReadOnly: boolean;
  mutatingTaskId: string | null;
  onDragStart: (task: KanbanTask) => void;
  onDragEnd: () => void;
  onStatusChange: (task: KanbanTask, status: string) => void;
}

const KanbanCard = React.memo(function KanbanCard({
  task,
  isDragging,
  isReadOnly,
  mutatingTaskId,
  onDragStart,
  onDragEnd,
  onStatusChange,
}: KanbanCardProps) {
  return (
    <article
      aria-label={task.title}
      tabIndex={0}
      draggable={!isReadOnly}
      onDragStart={() => onDragStart(task)}
      onDragEnd={onDragEnd}
      className={[
        'rounded-[14px] border p-3 transition select-none',
        isDragging
          ? 'border-primary/30 bg-primary/5 opacity-60'
          : 'border-border bg-muted/40 hover:bg-muted/60',
        !isReadOnly ? 'cursor-grab active:cursor-grabbing' : '',
      ].join(' ')}
    >
      {/* Title + priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium leading-snug text-foreground">
          {task.title}
        </span>
        {task.priority > 0 && (
          <span
            className={[
              'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
              task.priority >= 8
                ? 'bg-destructive/10 text-destructive'
                : task.priority >= 5
                  ? 'bg-warning/10 text-warning'
                  : 'bg-muted text-muted-foreground',
            ].join(' ')}
            title={`Priority ${task.priority}`}
          >
            P{task.priority}
          </span>
        )}
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-1 mb-2">
        {task.estimatedTimeMin ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            ⏱{' '}
            {task.estimatedTimeMin >= 60
              ? `${Math.round(task.estimatedTimeMin / 60)}h`
              : `${task.estimatedTimeMin}m`}
          </span>
        ) : null}
        {task.goalId && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            🎯 {task.goalId.replace(/-/g, ' ')}
          </span>
        )}
        {task.projectId && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            🚀 {task.projectId}
          </span>
        )}
      </div>

      {/* Tags */}
      {task.tags?.length ? (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags
            .filter((tag) => !tag.startsWith('goal:') && tag !== 'task')
            .slice(0, 3)
            .map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
              >
                #{tag}
              </span>
            ))}
        </div>
      ) : null}

      {/* Blocked badge */}
      {task.status === 'blocked' && (
        <div className="mb-2 rounded-[8px] bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
          🚫 Blocked
        </div>
      )}

      {/* Footer: open link + actions */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <Link
          to={task.link}
          className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground transition hover:bg-muted/80"
        >
          Open →
        </Link>
        {!isReadOnly && task.path ? (
          <div className="flex items-center gap-1">
            {task.status !== 'completed' ? (
              <button
                type="button"
                onClick={() => onStatusChange(task, 'completed')}
                disabled={mutatingTaskId === task.id}
                title="Mark completed"
                aria-label="Mark completed"
                className="rounded-full bg-success/10 px-2 py-1 text-[11px] text-success transition hover:bg-success/20 disabled:opacity-40"
              >
                ✓
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStatusChange(task, 'todo')}
                disabled={mutatingTaskId === task.id}
                title="Reopen task"
                aria-label="Reopen task"
                className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-muted/80 disabled:opacity-40"
              >
                ↺
              </button>
            )}
            <select
              aria-label={`Move "${task.title}" to column`}
              value={task.status}
              onChange={(e) => onStatusChange(task, e.target.value)}
              disabled={mutatingTaskId === task.id}
              className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground focus-visible:outline-none disabled:opacity-40"
            >
              {STATUS_COLUMNS.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            read-only
          </span>
        )}
      </div>
    </article>
  );
});

// ---------------------------------------------------------------------------
// KanbanRoute
// ---------------------------------------------------------------------------

function KanbanRoute() {
  const navigate = useNavigate();
  const [{ apiStatus, apiTasks, mutatingTaskId, draggingTaskId }, dispatch] =
    useReducer(kanbanReducer, {
      apiStatus: 'unknown',
      apiTasks: [],
      mutatingTaskId: null,
      draggingTaskId: null,
    });
  const [filterTag, setFilterTag] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [expandCompletedColumn, setExpandCompletedColumn] = useState(false);

  const tasks = apiTasks;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/tasks');
      if (res.ok) {
        const body = await res.json();
        const tasks = (body.structuredContent?.tasks || body.tasks || []).map(
          (t: Parameters<typeof normalizeTask>[0]) => normalizeTask(t)
        );
        dispatch({ type: 'TASKS_LOADED', tasks });
      } else if (res.status === 401) {
        navigate({ to: '/login' });
      } else {
        dispatch({ type: 'API_OFFLINE' });
      }
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        navigate({ to: '/login' });
      } else {
        console.warn('[kanban] API unavailable, using static data', err);
        dispatch({ type: 'API_OFFLINE' });
      }
    }
  }, [navigate]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [tasks]);

  const projects = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.projectId && set.add(t.projectId));
    return Array.from(set).sort();
  }, [tasks]);

  const columns = useMemo<KanbanColumn[]>(
    () =>
      buildColumns(
        tasks,
        filterTag || '',
        filterProject || '',
        showCompleted,
        true // exclude recurring from board
      ),
    [tasks, filterTag, filterProject, showCompleted]
  );

  const backlogTasks = useMemo(
    () =>
      filterBacklog(
        tasks,
        filterTag || '',
        filterProject || '',
        true // exclude recurring from backlog view
      ),
    [tasks, filterTag, filterProject]
  );

  const totalByStatus = useMemo(() => {
    return tasks.reduce<Record<string, number>>(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      },
      { todo: 0, 'in-progress': 0, blocked: 0, completed: 0 }
    );
  }, [tasks]);

  const isReadOnly = apiStatus === 'offline' || apiStatus === 'unknown';

  const updateStatus = useCallback(
    async (task: KanbanTask, status: string) => {
      if (!task.path) return;
      if (task.status === status) return;
      dispatch({ type: 'MUTATE_START', taskId: task.id });
      try {
        const res = await apiFetch(
          `/api/v1/tasks/${encodeURIComponent(task.path)}/status`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          }
        );
        if (res.status === 401) {
          dispatch({ type: 'MUTATE_FAIL' });
          navigate({ to: '/login' });
          return;
        }
        if (!res.ok) {
          dispatch({ type: 'MUTATE_FAIL' });
          return;
        }
        const body = await res.json();
        dispatch({
          type: 'MUTATE_DONE',
          path: task.path,
          id: task.id,
          status: body?.structuredContent?.frontmatter?.status || status,
          updatedPath: body?.structuredContent?.path || task.path,
        });
      } catch (err) {
        if (err instanceof UnauthenticatedError) {
          navigate({ to: '/login' });
        } else {
          console.warn('[kanban] status update failed', err);
        }
        dispatch({ type: 'MUTATE_FAIL' });
      }
    },
    [navigate]
  );

  const handleDragStart = useCallback(
    (task: KanbanTask) => {
      if (isReadOnly) return;
      dispatch({ type: 'DRAG_START', taskId: task.id });
    },
    [isReadOnly]
  );

  const handleDragEnd = useCallback(() => {
    dispatch({ type: 'DRAG_END' });
  }, []);

  const handleDrop = useCallback(
    (status: string) => {
      if (isReadOnly || !draggingTaskId) return;
      const task = apiTasks.find((t) => t.id === draggingTaskId);
      if (task) {
        updateStatus(task, status);
      } else {
        dispatch({ type: 'DRAG_END' });
      }
    },
    [isReadOnly, draggingTaskId, apiTasks, updateStatus]
  );

  const allowDrop = useCallback(
    (e: React.DragEvent) => {
      if (isReadOnly) return;
      e.preventDefault();
    },
    [isReadOnly]
  );

  const summaryItems = STATUS_COLUMNS.map((col) => ({
    label: col.label,
    value: String(totalByStatus[col.key] || 0),
    detail: `Tasks in ${col.label.toLowerCase()}`,
  }));

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadTasks();
    setIsRefreshing(false);
  }, [loadTasks]);

  const refreshButton = (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-muted/60 disabled:opacity-50"
    >
      {isRefreshing ? 'Refreshing…' : 'Refresh'}
    </button>
  );

  const statusBadge = (
    <span
      className={[
        'rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]',
        apiStatus === 'online'
          ? 'bg-success/10 text-success'
          : apiStatus === 'error'
            ? 'bg-warning/10 text-warning'
            : 'bg-destructive/10 text-destructive',
      ].join(' ')}
    >
      {apiStatus === 'online'
        ? 'Live'
        : apiStatus === 'error'
          ? 'Retry safe'
          : 'Offline — read-only'}
    </span>
  );

  return (
    <WorkspaceScaffold
      title="Kanban"
      subtitle="Visualize task flow across four columns. Recurring tasks are excluded."
      actions={
        <div className="flex items-center gap-2">
          {refreshButton}
          {statusBadge}
        </div>
      }
      summaryItems={summaryItems}
      primaryTitle="Board"
      primarySubtitle={
        isReadOnly
          ? 'API offline — read-only view.'
          : apiStatus === 'error'
            ? 'Last update failed — retrying is safe.'
            : 'Drag cards to move tasks between columns.'
      }
      primary={
        <div className="flex flex-col gap-6">
          {/* Board columns — horizontally scrollable on narrow viewports */}
          <div className="overflow-x-auto -mx-1 px-1 pb-2">
            <div className="flex gap-4 min-w-[680px]">
              {columns.map((col) => {
                const isCompletedColumn = col.key === 'completed';
                const totalItems = col.items.length;
                const visibleItems =
                  isCompletedColumn && !expandCompletedColumn
                    ? col.items.slice(0, 5)
                    : col.items;

                return (
                  <div
                    key={col.key}
                    className={[
                      'flex-1 min-w-[160px] rounded-[18px] border p-3 transition',
                      draggingTaskId
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-muted/40',
                    ].join(' ')}
                    data-status={col.key}
                    onDragOver={allowDrop}
                    onDrop={() => handleDrop(col.key)}
                  >
                    {/* Column header */}
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {col.label}
                      </p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {totalItems}
                      </span>
                    </div>

                    {totalItems === 0 ? (
                      <div className="flex flex-col items-center gap-1 py-6 text-center">
                        <span className="text-2xl" aria-hidden="true">
                          {col.key === 'todo'
                            ? '📝'
                            : col.key === 'in-progress'
                              ? '🚀'
                              : col.key === 'blocked'
                                ? '🚧'
                                : '🎉'}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {col.key === 'todo'
                            ? 'Nothing to do'
                            : col.key === 'in-progress'
                              ? 'Nothing in progress'
                              : col.key === 'blocked'
                                ? 'No blockers'
                                : 'All clear'}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {visibleItems.map((task) => (
                          <KanbanCard
                            key={task.id}
                            task={task}
                            isDragging={draggingTaskId === task.id}
                            isReadOnly={isReadOnly}
                            mutatingTaskId={mutatingTaskId}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onStatusChange={updateStatus}
                          />
                        ))}
                        {isCompletedColumn && totalItems > 5 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandCompletedColumn((prev) => !prev)
                            }
                            className="w-full cursor-pointer rounded-[12px] border border-border bg-muted/40 py-2 text-xs text-muted-foreground transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          >
                            {expandCompletedColumn
                              ? 'Show fewer'
                              : `+${totalItems - 5} more`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backlog */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Backlog
              </p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {backlogTasks.length}
              </span>
            </div>
            {backlogTasks.length === 0 ? (
              <EmptyState
                title="No backlog tasks"
                description="Backlog items will appear here."
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {backlogTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    isDragging={false}
                    isReadOnly
                    mutatingTaskId={null}
                    onDragStart={() => {}}
                    onDragEnd={() => {}}
                    onStatusChange={async () => {}}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      }
      asideTitle="Filters"
      asideSubtitle="Narrow the board view."
      aside={
        <div className="flex flex-col gap-5">
          {/* Tag filter */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="kanban-filter-tag"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              Tag
            </label>
            <select
              id="kanban-filter-tag"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full rounded-[12px] border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:border-primary focus-visible:outline-none"
            >
              <option value="">All tags</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Project filter */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="kanban-filter-project"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              Project
            </label>
            <select
              id="kanban-filter-project"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full rounded-[12px] border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:border-primary focus-visible:outline-none"
            >
              <option value="">All projects</option>
              {projects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>
          </div>

          {/* Show completed toggle */}
          <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-border bg-muted/40 px-4 py-3 text-sm text-foreground transition hover:bg-muted/60">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="h-4 w-4 accent-sky-400"
            />
            Show completed
          </label>

          {/* Legend */}
          <div className="rounded-[12px] border border-border bg-muted/40 px-4 py-3 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Legend
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                P9+
              </span>
              High priority
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⏱
              </span>
              Time estimate
            </div>
          </div>
        </div>
      }
    />
  );
}
