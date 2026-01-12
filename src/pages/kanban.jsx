import React, { useEffect, useMemo, useState } from "react";
import { graphql, Link } from "gatsby";
import Navbar from "../components/Navbar";
import getApiBase from "../utils/api";
import { STATUS_COLUMNS, buildColumns, normalizeTask } from "../lib/kanban-logic";

export default function KanbanPage({ data }) {
  const [apiStatus, setApiStatus] = useState("unknown");
  const [apiTasks, setApiTasks] = useState([]);
  const [filterTag, setFilterTag] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [mutatingTaskId, setMutatingTaskId] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  const staticTasks = useMemo(() => {
    const nodes = data?.allMarkdownRemark?.nodes || [];
    return nodes
      .filter((node) => node.fields?.collection === "tasks")
      .map((node) =>
        normalizeTask({
          id: node.id,
          title: node.frontmatter?.title,
          status: node.frontmatter?.status,
          priority: node.frontmatter?.priority,
          estimatedTimeMin: node.frontmatter?.estimatedTimeMin,
          tags: node.frontmatter?.tags,
          goalId: node.frontmatter?.goalId,
          projectId: node.frontmatter?.projectId,
          completedAt: node.frontmatter?.completedAt,
          slug: node.fields?.slug,
        })
      );
  }, [data]);

  const tasks = apiTasks.length > 0 ? apiTasks : staticTasks;

  useEffect(() => {
    const loadTasks = async () => {
      const apiBase = getApiBase();
      if (apiBase === null || apiBase === undefined) return;
      try {
        const res = await fetch(`${apiBase}/api/v1/tasks`);
        if (res.ok) {
          const body = await res.json();
          const apiList = (body.structuredContent?.tasks || body.tasks || []).map((t) =>
            normalizeTask(t)
          );
          setApiTasks(apiList);
          setApiStatus("online");
        } else {
          setApiStatus("offline");
        }
      } catch (err) {
        console.warn("[kanban] API unavailable, using static data", err);
        setApiStatus("offline");
      }
    };
    loadTasks();
  }, []);

  const tags = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [tasks]);

  const projects = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => t.projectId && set.add(t.projectId));
    return Array.from(set).sort();
  }, [tasks]);

  const columns = useMemo(
    () => buildColumns(tasks, filterTag || "", filterProject || "", showCompleted),
    [tasks, filterTag, filterProject, showCompleted]
  );

  const totalByStatus = useMemo(() => {
    return tasks.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      },
      { todo: 0, "in-progress": 0, blocked: 0, completed: 0 }
    );
  }, [tasks]);

  const isReadOnly = apiStatus !== "online";

  const updateStatus = async (task, status) => {
    const apiBase = getApiBase();
    if (apiBase === null || apiBase === undefined) {
      setApiStatus("offline");
      return;
    }
    if (!task.path) return;
    if (task.status === status) return;
    setMutatingTaskId(task.id);
    try {
      const res = await fetch(
        `${apiBase}/api/v1/tasks/${encodeURIComponent(task.path)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) {
        setApiStatus("offline");
        return;
      }
      const body = await res.json();
      const updatedPath = body?.structuredContent?.path || task.path;
      const updatedStatus = body?.structuredContent?.frontmatter?.status || status;
      setApiTasks((prev) => {
        const next = prev.length ? [...prev] : [...tasks];
        return next.map((t) =>
          t.path === task.path || t.id === task.id
            ? { ...t, status: updatedStatus, path: updatedPath }
            : t
        );
      });
      setApiStatus("online");
    } catch (err) {
      console.warn("[kanban] status update failed", err);
      setApiStatus("offline");
    } finally {
      setMutatingTaskId(null);
      setDraggingTaskId(null);
    }
  };

  const handleDragStart = (task) => {
    if (isReadOnly) return;
    setDraggingTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
  };

  const handleDrop = (status) => {
    if (isReadOnly || !draggingTaskId) return;
    const task =
      apiTasks.find((t) => t.id === draggingTaskId) ||
      tasks.find((t) => t.id === draggingTaskId);
    if (task) {
      updateStatus(task, status);
    }
    setDraggingTaskId(null);
  };

  const allowDrop = (e) => {
    if (isReadOnly) return;
    e.preventDefault();
  };

  return (
    <main className="page">
      <Navbar apiStatus={apiStatus} />
      <header className="page-header">
        <div>
          <p className="eyebrow">Tasker Kanban</p>
          <h1>Visualize task flow</h1>
          <p className="lede">
            Four simple columns to track work. {isReadOnly ? "API offline — read-only view." : "Drag-drop ready when API supports status updates."}
          </p>
        </div>
        <div className="board-stats">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.key} className="board-stat">
              <span className="board-stat__label">{col.label}</span>
              <span className="board-stat__value">{totalByStatus[col.key] || 0}</span>
            </div>
          ))}
        </div>
      </header>

      <section className="kanban-controls">
        <div className="select-group">
          <label>Filter by tag</label>
          <select
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
          <label>Filter by project</label>
          <select
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
        {columns.map((col) => (
          <div
            key={col.key}
            className={`kanban__column ${draggingTaskId ? "kanban__column--droppable" : ""}`}
            data-status={col.key}
            onDragOver={allowDrop}
            onDrop={() => handleDrop(col.key)}
          >
            <header className="kanban__column-header">
              <div>
                <p className="muted">{col.label}</p>
                <h3>{col.items.length} task{col.items.length === 1 ? "" : "s"}</h3>
              </div>
              <span className="pill">{col.key}</span>
            </header>
            {col.items.length === 0 ? (
              <div className="kanban__empty">
                <div className="kanban__empty-icon">
                  {col.key === 'todo' ? '📝' : col.key === 'in-progress' ? '🚀' : col.key === 'blocked' ? '🚧' : '🎉'}
                </div>
                <div className="kanban__empty-text">
                  {col.key === 'todo' ? 'No tasks to do' : 
                   col.key === 'in-progress' ? 'Nothing in progress' :
                   col.key === 'blocked' ? 'No blockers — great!' : 
                   'Complete some tasks!'}
                </div>
                <div className="kanban__empty-hint">
                  {col.key === 'todo' ? 'Create a task in your vault to get started' :
                   col.key === 'completed' ? 'Finished tasks will appear here' :
                   'Drag tasks here or update status in vault'}
                </div>
              </div>
            ) : (
              <div className="kanban__cards">
                {col.items.map((task) => (
                  <article
                    key={task.id}
                    className={`kanban-card ${
                      draggingTaskId === task.id ? "kanban-card--dragging" : ""
                    }`}
                    aria-label={task.title}
                    draggable={!isReadOnly}
                    onDragStart={() => handleDragStart(task)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="kanban-card__header">
                      <span className="kanban-card__title">{task.title}</span>
                      {task.priority > 0 && (
                        <span
                          className={`kanban-card__priority ${
                            task.priority >= 8
                              ? "kanban-card__priority--high"
                              : task.priority >= 5
                              ? "kanban-card__priority--mid"
                              : ""
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
                          ⏱ {task.estimatedTimeMin >= 60 ? `${Math.round(task.estimatedTimeMin / 60)}h` : `${task.estimatedTimeMin}m`}
                        </span>
                      ) : null}
                      {task.goalId && <span className="chip">🎯 {task.goalId.replace(/-/g, " ")}</span>}
                      {task.projectId && <span className="chip">🚀 {task.projectId}</span>}
                    </div>
                    {task.tags?.length ? (
                      <div className="kanban-card__tags">
                        {task.tags
                          .filter((tag) => !tag.startsWith("goal:") && tag !== "task")
                          .slice(0, 3)
                          .map((tag) => (
                            <span key={tag} className="tag">
                              #{tag}
                            </span>
                          ))}
                      </div>
                    ) : null}
                      {task.status === "blocked" && (
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
                          {task.status !== "completed" ? (
                            <button
                              className="pill pill--ghost"
                              onClick={() => updateStatus(task, "completed")}
                              disabled={mutatingTaskId === task.id}
                              title="Mark completed"
                            >
                              ✓ Complete
                            </button>
                          ) : (
                            <button
                              className="pill pill--ghost"
                              onClick={() => updateStatus(task, "todo")}
                              disabled={mutatingTaskId === task.id}
                              title="Reopen task"
                            >
                              ↺ Reopen
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="pill pill--ghost">read-only</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}

export const query = graphql`
  {
    allMarkdownRemark(filter: { fields: { collection: { eq: "tasks" } } }) {
      nodes {
        id
        fields {
          slug
          collection
        }
        frontmatter {
          title
          status
          priority
          estimatedTimeMin
          tags
          goalId
          projectId
          completedAt
        }
      }
    }
  }
`;
