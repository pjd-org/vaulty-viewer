import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { apiFetch } from "../../src/utils/api";
import { normalizeTask, type KanbanTask } from "../../src/lib/kanban-logic";
import {
  deriveProjects,
  filterProjects,
  mergeProjectsWithNotes,
  normalizeProjectNote,
  sortProjects,
  type ProjectNote,
  type ProjectSummary,
} from "../../src/lib/projects-logic";
import { PageFrame } from "../components/layout";
import { EmptyState } from "../components/ui";
import { ProjectCard } from "../components/projects";

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
// Route
// ---------------------------------------------------------------------------

function ProjectsRoute() {
  const { tasks, projectNotes, loading } = useProjectsData();
  const navigate = useNavigate();

  const projects = useMemo(() => {
    const derived = deriveProjects(tasks);
    return mergeProjectsWithNotes(derived, projectNotes);
  }, [tasks, projectNotes]);

  const sorted = useMemo(
    () => sortProjects(filterProjects(projects, "active"), "priority"),
    [projects]
  );

  return (
    <main className="space-y-6">
      <PageFrame title="Projects" subtitle="Execution containers">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#4f8cff]" />
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No projects found"
            description="Tag tasks with a projectId in your vault to create projects here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() =>
                  navigate({ to: "/projects/$projectId", params: { projectId: p.id } })
                }
              />
            ))}
          </div>
        )}
      </PageFrame>
    </main>
  );
}
