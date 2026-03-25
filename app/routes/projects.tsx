import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { apiFetch } from "../../src/utils/api";
import { normalizeTask, type KanbanTask } from "../../src/lib/kanban-logic";
import {
  deriveProjects,
  filterProjects,
  mergeProjectsWithNotes,
  normalizeProjectNote,
  sortProjects,
  computeProjectCounts,
  projectStatusLabel,
  type ProjectNote,
  type ProjectSummary,
} from "../../src/lib/projects-logic";

export const Route = createFileRoute("/projects")({
  component: ProjectsRoute,
});

// ---------------------------------------------------------------------------
// Data hook
// ---------------------------------------------------------------------------

function useProjectsData() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [projectNotes, setProjectNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        apiFetch("/api/v1/tasks?status=all&limit=1000"),
        apiFetch("/api/v1/projects"),
      ]);

      if (tasksRes.ok) {
        const body = await tasksRes.json();
        const raw: Parameters<typeof normalizeTask>[0][] =
          body.structuredContent?.tasks ?? body.tasks ?? [];
        setTasks(raw.map(normalizeTask));
        setApiOnline(true);
      } else {
        setApiOnline(false);
      }

      if (projectsRes.ok) {
        const body = await projectsRes.json();
        const raw: Record<string, unknown>[] =
          body.structuredContent?.projects ?? body.projects ?? [];
        setProjectNotes(raw.map(normalizeProjectNote));
      }
    } catch {
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { tasks, projectNotes, loading, apiOnline, reload };
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function StatusChip({ status }: { status: ProjectSummary["status"] }) {
  return (
    <span className={`project-status project-status--${status}`}>
      {projectStatusLabel(status)}
    </span>
  );
}

function ProgressBar({ progress, status }: { progress: number; status: ProjectSummary["status"] }) {
  return (
    <div className="project-progress" aria-label={`${progress}% complete`}>
      <div className="project-progress__track">
        <div
          className={`project-progress__fill project-progress__fill--${status}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <span className="project-progress__pct">{progress}%</span>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  const { id, title, status, progress, priority, taskCounts, domain, horizon, notePath } = project;
  return (
    <Link to="/projects/$projectId" params={{ projectId: id }} className="project-card">
      <div className="project-card__top">
        <h3 className="project-card__title">{title}</h3>
        <StatusChip status={status} />
      </div>
      <ProgressBar progress={progress} status={status} />
      <div className="project-card__meta">
        <span className="project-card__tasks">
          {taskCounts.done}/{taskCounts.total} done
        </span>
        {taskCounts.inProgress > 0 && (
          <span className="chip chip--active">{taskCounts.inProgress} in progress</span>
        )}
        {taskCounts.blocked > 0 && (
          <span className="chip chip--blocked">{taskCounts.blocked} blocked</span>
        )}
        {domain && <span className="chip">{domain}</span>}
        {horizon && <span className="chip chip--ghost">{horizon}</span>}
        {priority > 0 && (
          <span className="project-card__priority">P{priority}</span>
        )}
        {notePath && (
          <span className="chip chip--note" title="Backed by vault project note">●</span>
        )}
      </div>
    </Link>
  );
}

function FilterTabs({
  filter,
  setFilter,
  counts,
}: {
  filter: string;
  setFilter: (f: string) => void;
  counts: ReturnType<typeof computeProjectCounts>;
}) {
  const tabs = [
    { key: "active-only", label: "Active", count: counts.active },
    { key: "all", label: "All", count: counts.all },
    { key: "blocked", label: "Blocked", count: counts.blocked },
    { key: "completed", label: "Completed", count: counts.completed },
  ];
  return (
    <div className="projects-filters">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`projects-filter ${filter === t.key ? "projects-filter--active" : ""}`}
          onClick={() => setFilter(t.key)}
        >
          {t.label}
          {t.count > 0 && <span className="projects-filter__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

function ProjectsRoute() {
  const { tasks, projectNotes, loading, apiOnline } = useProjectsData();
  const [filter, setFilter] = useState("active-only");
  const [sortBy, setSortBy] = useState("priority");

  const projects = useMemo(() => {
    const derived = deriveProjects(tasks);
    return mergeProjectsWithNotes(derived, projectNotes);
  }, [tasks, projectNotes]);
  const counts = useMemo(() => computeProjectCounts(projects), [projects]);

  // Use "all" key to mean show-all including completed
  const filtered = useMemo(
    () => filterProjects(projects, filter === "active-only" ? "active" : filter),
    [projects, filter]
  );
  const sorted = useMemo(() => sortProjects(filtered, sortBy), [filtered, sortBy]);

  return (
    <main className="page projects-page">
      <header className="projects-header">
        <div>
          <p className="eyebrow">Projects</p>
          <h1>What are you working toward?</h1>
        </div>
        <div className="projects-header__actions">
          <Link to="/kanban" className="pill pill--ghost">Global board →</Link>
        </div>
      </header>

      {!apiOnline && (
        <div className="focus-offline">API offline — project data unavailable.</div>
      )}

      {loading ? (
        <div className="focus-loading">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="focus-empty-card">
          <p className="focus-empty-card__title">No projects found.</p>
          <p className="focus-empty-card__desc">
            Tag tasks with a <code>projectId</code> in your vault to create projects here.
          </p>
          <div className="focus-empty-card__actions">
            <Link to="/huey" className="pill pill--soft">Ask Huey →</Link>
            <Link to="/kanban" className="pill pill--soft">Open Board →</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="projects-toolbar">
            <FilterTabs filter={filter} setFilter={setFilter} counts={counts} />
            <div className="projects-sort">
              <label htmlFor="proj-sort" className="sr-only">Sort by</label>
              <select
                id="proj-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="projects-sort__select"
              >
                <option value="priority">Priority</option>
                <option value="progress">Progress</option>
                <option value="tasks">Task count</option>
              </select>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="projects-empty">
              <p>No {filter !== "active-only" ? filter : "active"} projects.</p>
              {filter !== "all" && (
                <button className="pill pill--ghost" onClick={() => setFilter("all")}>
                  Show all
                </button>
              )}
            </div>
          ) : (
            <div className="projects-list">
              {sorted.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
