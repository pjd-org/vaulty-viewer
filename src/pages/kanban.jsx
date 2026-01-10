import React, { useEffect, useMemo, useState } from "react";
import { graphql, Link } from "gatsby";
import Navbar from "../components/Navbar";
import getApiBase from "../utils/api";

const STATUS_COLUMNS = [
  { key: "todo", label: "To Do", sort: (a, b) => (b.priority || 0) - (a.priority || 0) },
  { key: "in-progress", label: "In Progress", sort: (a, b) => (b.priority || 0) - (a.priority || 0) },
  { key: "blocked", label: "Blocked", sort: (a, b) => (b.createdAt || 0) - (a.createdAt || 0) },
  { key: "completed", label: "Completed", sort: (a, b) => (b.completedAt || 0) - (a.completedAt || 0) },
];

const RECENT_COMPLETED_DAYS = 7;

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const normalizeTask = (task = {}) => {
  const slugPath = task.slug ? task.slug.replace(/^\//, "").replace(/\/$/, "") : "";
  const notePath = task.path ? task.path.replace(/\.md$/, "") : slugPath;
  const link = notePath ? `/note?p=${encodeURIComponent(notePath)}` : "#";
  return {
    id: task.id || task.path || link,
    title: task.title || task.path || "Untitled",
    status: (task.status || "todo").toLowerCase(),
    priority: typeof task.priority === "number" ? task.priority : 0,
    estimatedTimeMin: task.estimatedTimeMin,
    tags: task.tags || [],
    goalId: task.goalId,
    projectId: task.projectId,
    completedAt: toDate(task.completedAt)?.getTime() || null,
    createdAt: toDate(task.created)?.getTime() || null,
    path: task.path,
    link,
  };
};

const buildColumns = (tasks, filterTag, filterProject) => {
  const now = Date.now();
  const cutoff = now - RECENT_COMPLETED_DAYS * 24 * 60 * 60 * 1000;

  const filtered = tasks.filter((task) => {
    if (filterTag && !(task.tags || []).includes(filterTag)) return false;
    if (filterProject && task.projectId !== filterProject) return false;
    return true;
  });

  return STATUS_COLUMNS.map((col) => {
    const items = filtered
      .filter((t) => {
        if (col.key === "completed" && t.completedAt && t.completedAt < cutoff) {
          return false;
        }
        return t.status === col.key;
      })
      .sort(col.sort);
    return { ...col, items };
  });
};

export default function KanbanPage({ data }) {
  const [apiStatus, setApiStatus] = useState("unknown");
  const [apiTasks, setApiTasks] = useState([]);
  const [filterTag, setFilterTag] = useState("");
  const [filterProject, setFilterProject] = useState("");

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
    () => buildColumns(tasks, filterTag || "", filterProject || ""),
    [tasks, filterTag, filterProject]
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
      </section>

      <section className="kanban">
        {columns.map((col) => (
          <div key={col.key} className="kanban__column" data-status={col.key}>
            <header className="kanban__column-header">
              <div>
                <p className="muted">{col.label}</p>
                <h3>{col.items.length} task{col.items.length === 1 ? "" : "s"}</h3>
              </div>
              <span className="pill">{col.key}</span>
            </header>
            {col.items.length === 0 ? (
              <div className="kanban__empty">No tasks yet.</div>
            ) : (
              <div className="kanban__cards">
                {col.items.map((task) => (
                  <Link key={task.id} to={task.link} className="kanban-card">
                    <div className="kanban-card__header">
                      <span className="kanban-card__title">{task.title}</span>
                      {task.priority >= 9 && (
                        <span className="kanban-card__priority" title="High priority">
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
                      <span className="muted">Open →</span>
                      {isReadOnly && <span className="pill pill--ghost">read-only</span>}
                    </div>
                  </Link>
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
