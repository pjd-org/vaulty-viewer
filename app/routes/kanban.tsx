import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { apiFetch } from '../../src/utils/api';
import {
  STATUS_COLUMNS,
  buildColumns,
  filterBacklog,
  normalizeTask,
  type KanbanTask,
  type KanbanColumn,
} from '../../src/lib/kanban-logic';

type ApiStatus = 'online' | 'offline' | 'unknown';

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
        apiStatus: 'offline',
        mutatingTaskId: null,
        draggingTaskId: null,
      };
    case 'DRAG_START':
      return { ...state, draggingTaskId: action.taskId };
    case 'DRAG_END':
      return { ...state, draggingTaskId: null };
  }
}

function KanbanRoute() {
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

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await apiFetch('/api/v1/tasks');
        if (res.ok) {
          const body = await res.json();
          const tasks = (body.structuredContent?.tasks || body.tasks || []).map(
            (t: Parameters<typeof normalizeTask>[0]) => normalizeTask(t)
          );
          dispatch({ type: 'TASKS_LOADED', tasks });
        } else {
          dispatch({ type: 'API_OFFLINE' });
        }
      } catch (err) {
        console.warn('[kanban] API unavailable, using static data', err);
        dispatch({ type: 'API_OFFLINE' });
      }
    };
    loadTasks();
  }, []);

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

  const isReadOnly = apiStatus !== 'online';

  const updateStatus = async (task: KanbanTask, status: string) => {
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
      console.warn('[kanban] status update failed', err);
      dispatch({ type: 'MUTATE_FAIL' });
    }
  };

  const handleDragStart = (task: KanbanTask) => {
    if (isReadOnly) return;
    dispatch({ type: 'DRAG_START', taskId: task.id });
  };

  const handleDragEnd = () => {
    dispatch({ type: 'DRAG_END' });
  };

  const handleDrop = (status: string) => {
    if (isReadOnly || !draggingTaskId) return;
    const task = apiTasks.find((t) => t.id === draggingTaskId);
    if (task) {
      updateStatus(task, status);
    } else {
      dispatch({ type: 'DRAG_END' });
    }
  };

  const allowDrop = (e: React.DragEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
  };

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tasker Kanban</p>
          <h1>Visualize task flow</h1>
          <p className="lede">
            Four simple columns to track work.{' '}
            {isReadOnly
              ? 'API offline — read-only view.'
              : 'Drag-drop ready when API supports status updates.'}{' '}
            Recurring tasks are hidden from the board; backlog tasks are listed
            below.
          </p>
        </div>
        <div className="board-stats">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.key} className="board-stat">
              <span className="board-stat__label">{col.label}</span>
              <span className="board-stat__value">
                {totalByStatus[col.key] || 0}
              </span>
            </div>
          ))}
        </div>
      </header>

      <section className="kanban-controls">
        <div className="select-group">
          <label htmlFor="kanban-filter-tag">Filter by tag</label>
          <select
            id="kanban-filter-tag"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            aria-label="Filter by tag"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
        <div className="select-group">
          <label htmlFor="kanban-filter-project">Filter by project</label>
          <select
            id="kanban-filter-project"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            aria-label="Filter by project"
          >
            <option value="">All projects</option>
            {projects.map((proj) => (
              <option key={proj} value={proj}>
                {proj}
              </option>
            ))}
          </select>
        </div>
        <div className="kanban-legend">
          <span className="pill pill--ghost">P9+</span>
          <span className="muted">High priority</span>
          <span className="pill pill--ghost">⏱</span>
          <span className="muted">Estimate</span>
        </div>
        <div className="toggle-group">
          <label>
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
            Show completed
          </label>
        </div>
      </section>

      <section className="kanban">
        {columns.map((col) =>
          (() => {
            const isCompletedColumn = col.key === 'completed';
            const totalItems = col.items.length;
            const visibleItems =
              isCompletedColumn && !expandCompletedColumn
                ? col.items.slice(0, 5)
                : col.items;

            return (
              <div
                key={col.key}
                className={`kanban__column ${draggingTaskId ? 'kanban__column--droppable' : ''}`}
                data-status={col.key}
                onDragOver={allowDrop}
                onDrop={() => handleDrop(col.key)}
              >
                <header className="kanban__column-header">
                  <div>
                    <p className="muted">{col.label}</p>
                    <h3>
                      {totalItems} task{totalItems === 1 ? '' : 's'}
                    </h3>
                  </div>
                  <span className="pill">{col.key}</span>
                </header>
                {totalItems === 0 ? (
                  <div className="kanban__empty">
                    <div className="kanban__empty-icon" aria-hidden="true">
                      {col.key === 'todo'
                        ? '📝'
                        : col.key === 'in-progress'
                          ? '🚀'
                          : col.key === 'blocked'
                            ? '🚧'
                            : '🎉'}
                    </div>
                    <div className="kanban__empty-text">
                      {col.key === 'todo'
                        ? 'No tasks to do'
                        : col.key === 'in-progress'
                          ? 'Nothing in progress'
                          : col.key === 'blocked'
                            ? 'No blockers — great!'
                            : 'Complete some tasks!'}
                    </div>
                    <div className="kanban__empty-hint">
                      {col.key === 'todo'
                        ? 'Create a task in your vault to get started'
                        : col.key === 'completed'
                          ? 'Finished tasks will appear here'
                          : 'Drag tasks here or update status in vault'}
                    </div>
                  </div>
                ) : (
                  <div className="kanban__cards">
                    {visibleItems.map((task) => (
                      <article
                        key={task.id}
                        className={`kanban-card ${
                          draggingTaskId === task.id
                            ? 'kanban-card--dragging'
                            : ''
                        }`}
                        aria-label={task.title}
                        tabIndex={0}
                        draggable={!isReadOnly}
                        onDragStart={() => handleDragStart(task)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="kanban-card__header">
                          <span className="kanban-card__title">
                            {task.title}
                          </span>
                          {task.priority > 0 && (
                            <span
                              className={`kanban-card__priority ${
                                task.priority >= 8
                                  ? 'kanban-card__priority--high'
                                  : task.priority >= 5
                                    ? 'kanban-card__priority--mid'
                                    : ''
                              }`}
                              title={`Priority ${task.priority}`}
                            >
                              P{task.priority}
                            </span>
                          )}
                        </div>
                        <div className="kanban-card__meta">
                          {task.estimatedTimeMin ? (
                            <span className="chip">
                              ⏱{' '}
                              {task.estimatedTimeMin >= 60
                                ? `${Math.round(task.estimatedTimeMin / 60)}h`
                                : `${task.estimatedTimeMin}m`}
                            </span>
                          ) : null}
                          {task.goalId && (
                            <span className="chip">
                              🎯 {task.goalId.replace(/-/g, ' ')}
                            </span>
                          )}
                          {task.projectId && (
                            <span className="chip">🚀 {task.projectId}</span>
                          )}
                        </div>
                        {task.tags?.length ? (
                          <div className="kanban-card__tags">
                            {task.tags
                              .filter(
                                (tag) =>
                                  !tag.startsWith('goal:') && tag !== 'task'
                              )
                              .slice(0, 3)
                              .map((tag) => (
                                <span key={tag} className="tag">
                                  #{tag}
                                </span>
                              ))}
                          </div>
                        ) : null}
                        {task.status === 'blocked' && (
                          <div className="kanban-card__blocked">
                            <span>🚫 Blocked</span>
                          </div>
                        )}
                        <div className="kanban-card__footer">
                          <Link to={task.link} className="pill pill--soft">
                            Open →
                          </Link>
                          {!isReadOnly && task.path ? (
                            <div className="kanban-card__actions">
                              {task.status !== 'completed' ? (
                                <button
                                  type="button"
                                  className="pill pill--ghost"
                                  onClick={() =>
                                    updateStatus(task, 'completed')
                                  }
                                  disabled={mutatingTaskId === task.id}
                                  title="Mark completed"
                                >
                                  ✓ Complete
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="pill pill--ghost"
                                  onClick={() => updateStatus(task, 'todo')}
                                  disabled={mutatingTaskId === task.id}
                                  title="Reopen task"
                                >
                                  ↺ Reopen
                                </button>
                              )}
                              <select
                                aria-label={`Move "${task.title}" to column`}
                                value={task.status}
                                onChange={(e) =>
                                  updateStatus(task, e.target.value)
                                }
                                disabled={mutatingTaskId === task.id}
                                className="pill pill--ghost text-xs"
                              >
                                {STATUS_COLUMNS.map((col) => (
                                  <option key={col.key} value={col.key}>
                                    {col.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <span className="pill pill--ghost">read-only</span>
                          )}
                        </div>
                      </article>
                    ))}
                    {isCompletedColumn && totalItems > 5 ? (
                      <button
                        type="button"
                        className="kanban__more"
                        onClick={() =>
                          setExpandCompletedColumn((prev) => !prev)
                        }
                      >
                        {expandCompletedColumn
                          ? 'Show fewer completed'
                          : `Show ${totalItems - 5} more completed`}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })()
        )}
      </section>

      <section className="kanban backlog-section">
        <header className="kanban__column-header">
          <div>
            <p className="muted">Backlog (non-recurring)</p>
            <h3>
              {backlogTasks.length} task{backlogTasks.length === 1 ? '' : 's'}
            </h3>
          </div>
        </header>
        {backlogTasks.length === 0 ? (
          <div className="kanban__empty">
            <div className="kanban__empty-icon" aria-hidden="true">
              📥
            </div>
            <div className="kanban__empty-text">No backlog tasks</div>
            <div className="kanban__empty-hint">
              Backlog items will appear here
            </div>
          </div>
        ) : (
          <div className="kanban__cards backlog-cards">
            {backlogTasks.map((task) => (
              <article
                key={task.id}
                className="kanban-card"
                aria-label={task.title}
              >
                <div className="kanban-card__header">
                  <span className="kanban-card__title">{task.title}</span>
                  {task.priority > 0 && (
                    <span
                      className={`kanban-card__priority ${
                        task.priority >= 8
                          ? 'kanban-card__priority--high'
                          : task.priority >= 5
                            ? 'kanban-card__priority--mid'
                            : ''
                      }`}
                      title={`Priority ${task.priority}`}
                    >
                      P{task.priority}
                    </span>
                  )}
                </div>
                <div className="kanban-card__meta">
                  {task.estimatedTimeMin ? (
                    <span className="chip">
                      ⏱{' '}
                      {task.estimatedTimeMin >= 60
                        ? `${Math.round(task.estimatedTimeMin / 60)}h`
                        : `${task.estimatedTimeMin}m`}
                    </span>
                  ) : null}
                  {task.projectId && (
                    <span className="chip">🚀 {task.projectId}</span>
                  )}
                  {task.goalId && (
                    <span className="chip">
                      🎯 {task.goalId.replace(/-/g, ' ')}
                    </span>
                  )}
                </div>
                {task.tags?.length ? (
                  <div className="kanban-card__tags">
                    {task.tags
                      .filter(
                        (tag) => !tag.startsWith('goal:') && tag !== 'task'
                      )
                      .slice(0, 3)
                      .map((tag) => (
                        <span key={tag} className="tag">
                          #{tag}
                        </span>
                      ))}
                  </div>
                ) : null}
                <div className="kanban-card__footer">
                  <Link to={task.link} className="pill pill--soft">
                    Open →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
