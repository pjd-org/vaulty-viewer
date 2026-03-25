import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { apiFetch } from "../../src/utils/api";
import {
  normalizeTask,
  type KanbanTask,
} from "../../src/lib/kanban-logic";
import {
  deriveProjects,
  getProjectTasks,
  normalizeProjectNote,
  type ProjectNote,
  type ProjectSummary,
} from "../../src/lib/projects-logic";
import {
  normalizeNextAction,
  type NextAction,
} from "../../src/lib/focus-logic";
import { PageFrame, SoftPanel } from "../components/layout";
import { EmptyState } from "../components/ui";
import {
  ProjectDetailHeader,
  ProjectBoardSection,
  BlockersRail,
} from "../components/projects";

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
// Route
// ---------------------------------------------------------------------------

function ProjectDetailRoute() {
  const { projectId } = Route.useParams();
  const { allTasks, nextActions, projectNote, loading, apiOnline, reload, mutatingId, updateStatus } =
    useProjectDetail(projectId);

  const projectTasks = useMemo(
    () => getProjectTasks(allTasks, projectId),
    [allTasks, projectId]
  );

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
  }, [derivedProject, projectNote]);

  const blockedTasks = useMemo(
    () => projectTasks.filter((t) => t.status === "blocked"),
    [projectTasks]
  );

  if (loading) {
    return (
      <main className="space-y-6">
        <PageFrame title="Project" subtitle="Loading…">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#4f8cff]" />
          </div>
        </PageFrame>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="space-y-6">
        <PageFrame
          title="Project not found"
          actions={
            <Link to="/projects" className="text-sm text-slate-500 hover:text-[#4f8cff] transition-colors">
              ← Projects
            </Link>
          }
        >
          <EmptyState title={`Project "${projectId}" not found.`} />
        </PageFrame>
      </main>
    );
  }

  const counts = project.taskCounts;

  return (
    <main className="space-y-6">
      <PageFrame
        title={project.title}
        subtitle={`${counts.done} / ${counts.total} tasks`}
        actions={
          <Link to="/projects" className="text-sm text-slate-500 hover:text-[#4f8cff] transition-colors">
            ← Projects
          </Link>
        }
      >
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <ProjectDetailHeader
              project={project}
              taskCounts={{
                todo: counts.todo,
                inProgress: counts.inProgress,
                done: counts.done,
                blocked: counts.blocked,
              }}
            />
            <ProjectBoardSection tasks={projectTasks} projectId={projectId} />
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <BlockersRail blockedTasks={blockedTasks} />
            <SoftPanel>
              <EmptyState title="Related notes coming soon" />
            </SoftPanel>
          </div>
        </div>
      </PageFrame>
    </main>
  );
}
