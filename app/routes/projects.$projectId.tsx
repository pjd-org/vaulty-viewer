import React, { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAllTasks, useNextActions, useUpdateTaskStatus } from "../lib/queries/tasks";
import {
  deriveProjects,
  getProjectTasks,
  type ProjectSummary,
} from "../../src/lib/projects-logic";
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

  return <ProjectDetailContent projectId={projectId} />;
}

function ProjectDetailContent({ projectId }: { projectId: string }) {
  // Fetch project summary via TanStack Query
  const { data: projectDisplay, isLoading: projectLoading } = useQuery({
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
  const reload = () => queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
        status: projectDisplay.statusVariant === 'success' ? 'completed' : 'active',
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
    return derivedProject;
  }, [projectDisplay, derivedProject, projectTasks]);

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
