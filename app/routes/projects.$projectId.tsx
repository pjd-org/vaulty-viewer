import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { apiFetch } from "../../src/utils/api";
import {
  normalizeTask,
  buildColumns,
  type KanbanTask,
  type KanbanColumn,
} from "../../src/lib/kanban-logic";
import {
  deriveProjects,
  getProjectTasks,
  normalizeProjectNote,
  projectStatusLabel,
  type ProjectNote,
  type ProjectSummary,
} from "../../src/lib/projects-logic";
import {
  normalizeNextAction,
  formatScore,
  formatDuration,
  type NextAction,
} from "../../src/lib/focus-logic";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectDetailRoute,
});

// ---------------------------------------------------------------------------
// Data hook
// ---------------------------------------------------------------------------

function useProjectDetail(projectId: string) {
  const [allTasks, setAllTasks] = useState<KanbanTask[]>([]);
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [projectNote, setProjectNote] = useState<ProjectNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, actionsRes, projectsRes] = await Promise.all([
        apiFetch("/api/v1/tasks?status=all&limit=1000"),
        apiFetch("/api/v1/tasks/next-actions?max=20"),
        apiFetch("/api/v1/projects"),
      ]);
      if (tasksRes.ok) {
        const body = await tasksRes.json();
        const raw: Parameters<typeof normalizeTask>[0][] =
          body.structuredContent?.tasks ?? body.tasks ?? [];
        setAllTasks(raw.map(normalizeTask));
        setApiOnline(true);
      } else {
        setApiOnline(false);
      }
      if (actionsRes.ok) {
        const body = await actionsRes.json();
        const raw: Record<string, unknown>[] =
          body.structuredContent?.tasks ?? body.tasks ?? [];
        setNextActions(raw.map(normalizeNextAction));
      }
      if (projectsRes.ok) {
        const body = await projectsRes.json();
        const raw: Record<string, unknown>[] =
          body.structuredContent?.projects ?? body.projects ?? [];
        const notes = raw.map(normalizeProjectNote);
        // Match by id or domain
        const match =
          notes.find((n) => n.id === projectId) ??
          notes.find((n) => n.domain === projectId) ??
          null;
        setProjectNote(match);
      }
    } catch {
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateStatus = useCallback(
    async (task: KanbanTask, status: string) => {
      if (!task.path || task.status === status) return;
      setMutatingId(task.id);
      try {
        const res = await apiFetch(
          `/api/v1/tasks/${encodeURIComponent(task.path)}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }
        );
        if (res.ok) {
          setAllTasks((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...t, status } : t
            )
          );
        }
      } finally {
        setMutatingId(null);
      }
    },
    []
  );

  return { allTasks, nextActions, projectNote, loading, apiOnline, reload, mutatingId, updateStatus };
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ProjectHeader({
  project,
  taskCounts,
}: {
  project: ProjectSummary;
  taskCounts: { total: number; done: number; blocked: number };
}) {
  const pct = project.taskCounts.total > 0
    ? Math.round((project.taskCounts.done / project.taskCounts.total) * 100)
    : 0;
  return (
    <header className="project-header">
      <div className="project-header__top">
        <div>
          <p className="eyebrow">Project</p>
          <h1 className="project-header__title">{project.title}</h1>
          {(project.domain || project.horizon) && (
            <div className="project-header__tags">
              {project.domain && <span className="chip">{project.domain}</span>}
              {project.horizon && <span className="chip chip--ghost">{project.horizon}</span>}
            </div>
          )}
        </div>
        <span className={`project-status project-status--${project.status}`}>
          {projectStatusLabel(project.status)}
        </span>
      </div>
      <div className="project-header__progress">
        <div className="project-progress__track">
          <div
            className={`project-progress__fill project-progress__fill--${project.status}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="project-progress__pct">{pct}%</span>
      </div>
      <div className="project-header__meta">
        <span>{project.taskCounts.done}/{project.taskCounts.total} tasks done</span>
        {project.taskCounts.inProgress > 0 && (
          <span className="chip chip--active">{project.taskCounts.inProgress} in progress</span>
        )}
        {project.taskCounts.blocked > 0 && (
          <span className="chip chip--blocked">{project.taskCounts.blocked} blocked</span>
        )}
        {project.notePath && (
          <a
            href={`/note?p=${encodeURIComponent(project.notePath.replace(/\.md$/, ''))}`}
            className="chip chip--ghost"
          >
            Open note →
          </a>
        )}
      </div>
    </header>
  );
}

function BestMovePanel({
  task,
  onStart,
  onSkip,
  mutating,
}: {
  task: NextAction;
  onStart: (t: NextAction) => void;
  onSkip: (t: NextAction) => void;
  mutating: boolean;
}) {
  return (
    <section className="best-move-panel">
      <p className="focus-section-label">Best move now</p>
      <div className="best-move-panel__card">
        <div className="best-move-panel__top">
          <h3 className="best-move-panel__title">{task.title}</h3>
          <span className="chip chip--score">◆ {formatScore(task.score)}</span>
        </div>
        <div className="best-move-panel__meta">
          {task.effortScore != null && (
            <span className="chip">effort {task.effortScore}</span>
          )}
          {task.focusCost != null && (
            <span className="chip">focus {task.focusCost}</span>
          )}
          {task.estimatedTimeMin != null && (
            <span className="chip">⏱ {formatDuration(task.estimatedTimeMin)}</span>
          )}
        </div>
        <div className="best-move-panel__actions">
          <button
            className="pill pill--primary"
            onClick={() => onStart(task)}
            disabled={mutating}
          >
            Start →
          </button>
          <button
            className="pill pill--ghost"
            onClick={() => onSkip(task)}
            disabled={mutating}
          >
            Skip
          </button>
          {task.path && (
            <Link
              to={`/note/${encodeURIComponent(task.path)}`}
              className="pill pill--ghost"
            >
              Open note
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function ProjectBoardCard({
  task,
  onComplete,
  onReopen,
  mutating,
  readOnly,
}: {
  task: KanbanTask;
  onComplete: (t: KanbanTask) => void;
  onReopen: (t: KanbanTask) => void;
  mutating: boolean;
  readOnly: boolean;
}) {
  return (
    <article className="kanban-card">
      <div className="kanban-card__header">
        <span className="kanban-card__title">{task.title}</span>
        {task.priority > 0 && (
          <span
            className={`kanban-card__priority ${
              task.priority >= 8 ? "kanban-card__priority--high" : ""
            }`}
          >
            P{task.priority}
          </span>
        )}
      </div>
      <div className="kanban-card__footer">
        <Link to={task.link} className="pill pill--soft">Open →</Link>
        {!readOnly && task.path && (
          task.status !== "completed" ? (
            <button
              className="pill pill--ghost"
              onClick={() => onComplete(task)}
              disabled={mutating}
            >
              ✓
            </button>
          ) : (
            <button
              className="pill pill--ghost"
              onClick={() => onReopen(task)}
              disabled={mutating}
            >
              ↺
            </button>
          )
        )}
      </div>
    </article>
  );
}

function ProjectBoard({
  columns,
  onComplete,
  onReopen,
  mutatingId,
  readOnly,
}: {
  columns: KanbanColumn[];
  onComplete: (t: KanbanTask) => void;
  onReopen: (t: KanbanTask) => void;
  mutatingId: string | null;
  readOnly: boolean;
}) {
  const activeColumns = columns.filter((c) => c.key !== "completed");
  const completedCol = columns.find((c) => c.key === "completed");

  return (
    <section className="project-board">
      <p className="focus-section-label">Board</p>
      <div className="project-board__columns">
        {activeColumns.map((col) => (
          <div key={col.key} className="project-board__col">
            <header className="project-board__col-header">
              <span className="project-board__col-label">{col.label}</span>
              <span className="project-board__col-count">{col.items.length}</span>
            </header>
            {col.items.length === 0 ? (
              <div className="project-board__empty">—</div>
            ) : (
              <div className="project-board__cards">
                {col.items.map((t) => (
                  <ProjectBoardCard
                    key={t.id}
                    task={t}
                    onComplete={onComplete}
                    onReopen={onReopen}
                    mutating={mutatingId === t.id}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {completedCol && completedCol.items.length > 0 && (
        <details className="project-board__completed">
          <summary>
            {completedCol.items.length} completed
          </summary>
          <div className="project-board__cards project-board__cards--compact">
            {completedCol.items.slice(0, 10).map((t) => (
              <div key={t.id} className="project-board__done-item">
                <span className="project-board__done-title">{t.title}</span>
                <Link to={t.link} className="pill pill--ghost" style={{ fontSize: 11 }}>
                  →
                </Link>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

function BlockersPanel({ tasks }: { tasks: KanbanTask[] }) {
  if (!tasks.length) return null;
  return (
    <section className="blockers-panel">
      <p className="focus-section-label">
        Blockers <span className="chip chip--blocked">{tasks.length}</span>
      </p>
      <div className="blockers-panel__list">
        {tasks.map((t) => (
          <Link key={t.id} to={t.link} className="blockers-panel__item">
            <span className="blockers-panel__title">{t.title}</span>
            <span className="pill pill--ghost" style={{ fontSize: 11 }}>Open →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

function ProjectDetailRoute() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const { allTasks, nextActions, projectNote, loading, apiOnline, reload, mutatingId, updateStatus } =
    useProjectDetail(projectId);

  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const projectTasks = useMemo(
    () => getProjectTasks(allTasks, projectId),
    [allTasks, projectId]
  );

  // Build project summary: prefer real project note data, fall back to task derivation
  const projects = useMemo(() => deriveProjects(allTasks), [allTasks]);
  const derivedProject = projects.find((p) => p.id === projectId);
  const project: ProjectSummary | undefined = useMemo(() => {
    if (!derivedProject && !projectNote) return undefined;
    const base: ProjectSummary = derivedProject ?? {
      id: projectNote!.id,
      title: projectNote!.title,
      status: (projectNote!.status === 'completed' ? 'completed' : 'active') as ProjectSummary['status'],
      progress: 0,
      priority: projectNote!.priority,
      taskCounts: { total: 0, done: 0, inProgress: 0, blocked: 0, todo: 0 },
    };
    if (!projectNote) return base;
    return {
      ...base,
      title: projectNote.title,
      priority: projectNote.priority,
      horizon: projectNote.horizon,
      domain: projectNote.domain,
      notePath: projectNote.path,
    };
  }, [derivedProject, projectNote, projectId]);

  const projectNextActions = useMemo(
    () =>
      nextActions
        .filter((a) => !skipped.has(a.id))
        .filter(
          (a) =>
            (a as NextAction & { projectId?: string }).projectId === projectId ||
            projectTasks.some((t) => t.id === a.id || t.path === a.path)
        ),
    [nextActions, skipped, projectId, projectTasks]
  );

  const bestMove = projectNextActions[0] ?? null;

  const columns = useMemo(
    () => buildColumns(projectTasks, "", "", true, false),
    [projectTasks]
  );

  const blockedTasks = useMemo(
    () => projectTasks.filter((t) => t.status === "blocked"),
    [projectTasks]
  );

  const handleStart = async (task: NextAction) => {
    if (!task.path) return;
    const kt = projectTasks.find((t) => t.path === task.path || t.id === task.id);
    if (kt) await updateStatus(kt, "in-progress");
  };

  const handleSkip = (task: NextAction) => {
    setSkipped((prev) => new Set([...prev, task.id]));
  };

  const handleComplete = (task: KanbanTask) => updateStatus(task, "completed");
  const handleReopen = (task: KanbanTask) => updateStatus(task, "todo");

  const startSession = async () => {
    const taskIds = projectNextActions.slice(0, 5).map((t) => t.id);
    if (!taskIds.length) return;
    try {
      const res = await apiFetch("/cod/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds, budgetMin: 60 }),
      });
      if (res.ok) {
        const body = await res.json();
        const id =
          body.structuredContent?.id ?? body.id ?? (body as Record<string, unknown>).sessionId;
        if (id) {
          navigate({ to: `/session/${id}` });
          return;
        }
      }
    } catch {
      // fallback
    }
    reload();
  };

  if (loading) {
    return (
      <main className="page">
        <div className="focus-loading">Loading project…</div>
      </main>
    );
  }

  if (!project && !loading) {
    return (
      <main className="page">
        <nav className="breadcrumb">
          <Link to="/projects" className="back-link">← Projects</Link>
        </nav>
        <div className="focus-empty-card">
          <p className="focus-empty-card__title">Project "{projectId}" not found.</p>
          <div className="focus-empty-card__actions">
            <Link to="/projects" className="pill pill--soft">← Back to projects</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page project-detail-page">
      <nav className="breadcrumb">
        <Link to="/projects" className="back-link">← Projects</Link>
      </nav>

      {!apiOnline && (
        <div className="focus-offline">API offline — some data may be stale.</div>
      )}

      {project && (
        <ProjectHeader
          project={project}
          taskCounts={project.taskCounts}
        />
      )}

      <div className="project-detail__actions">
        {projectNextActions.length > 0 && (
          <button className="pill pill--primary" onClick={startSession}>
            + Start session
          </button>
        )}
        <Link to="/kanban" className="pill pill--ghost">Global board →</Link>
      </div>

      {bestMove ? (
        <BestMovePanel
          task={bestMove}
          onStart={handleStart}
          onSkip={handleSkip}
          mutating={mutatingId !== null}
        />
      ) : (
        projectTasks.length > 0 && (
          <div className="project-no-actions">
            <p>No COD-ranked actions for this project. All tasks may be blocked or completed.</p>
          </div>
        )
      )}

      <BlockersPanel tasks={blockedTasks} />

      {columns.length > 0 && projectTasks.length > 0 && (
        <ProjectBoard
          columns={columns}
          onComplete={handleComplete}
          onReopen={handleReopen}
          mutatingId={mutatingId}
          readOnly={!apiOnline}
        />
      )}

      {projectTasks.length === 0 && !loading && (
        <div className="focus-empty-card">
          <p className="focus-empty-card__title">No tasks in this project yet.</p>
          <div className="focus-empty-card__actions">
            <Link to="/huey" className="pill pill--soft">Ask Huey →</Link>
            <Link to="/kanban" className="pill pill--soft">Open board →</Link>
          </div>
        </div>
      )}
    </main>
  );
}
