import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAllTasks, useNextActions, useUpdateTaskStatus } from "../lib/queries/tasks";
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
import SkeletonCard from "../components/ui/SkeletonCard";
import {
  ProjectDetailHeader,
  ProjectBoardSection,
  BlockersRail,
} from "../components/projects";
import { fetchProjectById } from "../lib/api/projects";

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

  // Feature flag check (localStorage override). Default enabled.
  const [featureEnabled, setFeatureEnabled] = useState(true);
  useEffect(() => {
    try {
      const v = typeof window !== 'undefined' ? window.localStorage.getItem('viewer.feature.projects') : null;
      if (v === 'false') setFeatureEnabled(false);
    } catch (_) {
      // ignore
    }
  }, []);

  if (!featureEnabled) {
    return (
      <main className="space-y-6">
        <PageFrame title="Project" subtitle="Feature disabled">
          <EmptyState title="Projects feature disabled" description="Enable viewer.feature.projects to view this page." />
        </PageFrame>
      </main>
    );
  }

  // Fetch project summary via TanStack Query
  const { data: projectDisplay, isLoading: projectLoading, isError: projectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60,
    retry: 1,
  });

  const queryClient = useQueryClient();
  const { data: allTasks = [], isLoading: tasksLoading } = useAllTasks();
  const { data: nextActions = [] } = useNextActions();
  const updateStatusMutation = useUpdateTaskStatus();
  const apiOnline = true;
  const reload = () => queryClient.invalidateQueries(['tasks']);
  const mutatingId = updateStatusMutation.isLoading ? 'mutating' : null;
  const updateStatus = (task: any, status: string) => updateStatusMutation.mutate({ path: task.path ?? task.id, status });

  const projectTasks = useMemo(
    () => getProjectTasks(allTasks, projectId),
    [allTasks, projectId]
  );

  const projects = useMemo(() => deriveProjects(allTasks), [allTasks]);
  const derivedProject = projects.find((p) => p.id === projectId);

  // Prefer projectDisplay (API) for title/status/progress when available
  const project: ProjectSummary | undefined = useMemo(() => {
    if (projectDisplay) {
      return {
        id: projectDisplay.id,
        title: projectDisplay.title,
        status: projectDisplay.statusVariant === 'completed' ? 'completed' : 'active',
        progress: (projectDisplay.progressPercent ?? 0) / 100,
        priority: derivedProject?.priority ?? 0,
        taskCounts: derivedProject?.taskCounts ?? {
          total: projectTasks.length,
          done: projectTasks.filter((t) => t.status === 'done').length,
          inProgress: projectTasks.filter((t) => t.status === 'in-progress').length,
          blocked: projectTasks.filter((t) => t.status === 'blocked').length,
          todo: projectTasks.filter((t) => !['done','in-progress','blocked'].includes(t.status)).length,
        },
      };
    }
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
  }, [projectDisplay, derivedProject, projectNote, projectTasks]);

  const blockedTasks = useMemo(
    () => projectTasks.filter((t) => t.status === "blocked"),
    [projectTasks]
  );

  const anyLoading = tasksLoading || projectLoading;

  if (anyLoading) {
    return (
      <main className="space-y-6">
        <PageFrame title="Project" subtitle="Loading…">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <SkeletonCard />
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-4">
              <SkeletonCard />
              <SoftPanel>
                <EmptyState title="Related notes coming soon" />
              </SoftPanel>
            </div>
          </div>
        </PageFrame>
      </main>
    );
  }

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
