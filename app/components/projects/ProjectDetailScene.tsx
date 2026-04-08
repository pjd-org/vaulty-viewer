import React, { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { useAllTasks } from '../../lib/queries/tasks';
import { toProjectSummaryDisplay } from '../../lib/display';
import {
  deriveProjects,
  getProjectTasks,
  type ProjectSummary,
} from '../../../src/lib/projects-logic';
import { SoftPanel } from '../layout';
import { EmptyState } from '../ui';
import SkeletonCard from '../ui/SkeletonCard';
import { BlockersRail, ProjectBoardSection, ProjectDetailHeader } from '.';
import { getProjectQueryOptions } from '../../lib/api/projects';
import {
  useProjectSurface,
  type ProjectSurfacePayload,
} from '../../lib/viewer-adapter';
import type { ProjectSummaryDisplay } from '../../types/display';

const EMPTY_EXECUTION_SNAPSHOT: ProjectSurfacePayload['executionSnapshot'] = {
  activeTasks: [],
  activePipelines: [],
  activeRunners: [],
  hueyJobs: [],
  scheduleItems: [],
};

export function ProjectDetailScene({ projectId }: { projectId: string }) {
  const { data: projectDisplay, isLoading: projectLoading } = useQuery({
    ...getProjectQueryOptions(projectId),
    enabled: !!projectId,
  });

  const { data: allTasks = [], isLoading: tasksLoading } = useAllTasks();

  const projectTasks = useMemo(
    () => getProjectTasks(allTasks, projectId),
    [allTasks, projectId]
  );

  const projects = useMemo(() => deriveProjects(allTasks), [allTasks]);
  const derivedProject = projects.find((project) => project.id === projectId);

  const project: ProjectSummary | undefined = useMemo(() => {
    if (projectDisplay) {
      return {
        id: projectDisplay.id,
        title: projectDisplay.title,
        status:
          projectDisplay.statusVariant === 'success' ? 'completed' : 'active',
        progress: (projectDisplay.progressPercent ?? 0) / 100,
        priority: derivedProject?.priority ?? 0,
        taskCounts: derivedProject?.taskCounts ?? {
          total: projectTasks.length,
          done: projectTasks.filter((task) => task.status === 'done').length,
          inProgress: projectTasks.filter(
            (task) => task.status === 'in-progress'
          ).length,
          blocked: projectTasks.filter((task) => task.status === 'blocked')
            .length,
          todo: projectTasks.filter(
            (task) => !['done', 'in-progress', 'blocked'].includes(task.status)
          ).length,
        },
      };
    }

    return derivedProject;
  }, [derivedProject, projectDisplay, projectTasks]);

  const { data: displaySurface } = useProjectSurface(projectId);
  const pressureSignals = displaySurface?.pressureBand ?? [];
  const decisionQueue = displaySurface?.decisionQueue ?? [];
  const immediateActions = displaySurface?.immediateActions ?? [];
  const verificationRail = displaySurface?.verificationRail ?? [];
  const executionSnapshot =
    displaySurface?.executionSnapshot ?? EMPTY_EXECUTION_SNAPSHOT;
  const contextPanel = displaySurface?.contextPanel ?? [];

  const projectHeader = useMemo<ProjectSummaryDisplay | null>(() => {
    if (!project) return null;

    const fallbackDisplay = toProjectSummaryDisplay({
      id: project.id,
      title: project.title,
      status: project.status,
      taskCount: project.taskCounts.total,
      completedTaskCount: project.taskCounts.done,
      dueDate: project.eta ?? undefined,
      nextAction: decisionQueue[0] ? { title: decisionQueue[0].title } : null,
    });

    return {
      ...(projectDisplay ?? fallbackDisplay),
      bestMoveTitle:
        projectDisplay?.bestMoveTitle ??
        fallbackDisplay.bestMoveTitle ??
        decisionQueue[0]?.title ??
        null,
    };
  }, [decisionQueue, project, projectDisplay]);

  const blockedTasks = useMemo(
    () => projectTasks.filter((task) => task.status === 'blocked'),
    [projectTasks]
  );

  const anyLoading = tasksLoading || projectLoading;

  if (anyLoading && !project && !displaySurface) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-4">
          <SkeletonCard />
          <SoftPanel variant="utility">
            <EmptyState title="Related notes coming soon" />
          </SoftPanel>
        </div>
      </div>
    );
  }

  if (!project) {
    return <EmptyState title={`Project "${projectId}" not found.`} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
      <div className="space-y-6">
        {projectHeader ? (
          <ProjectDetailHeader projectId={projectId} project={projectHeader} />
        ) : (
          <SkeletonCard />
        )}
        {tasksLoading ? (
          <SkeletonCard />
        ) : (
          <ProjectBoardSection tasks={projectTasks} projectId={projectId} />
        )}
      </div>
      <div className="space-y-4">
        {!tasksLoading && <BlockersRail blockedTasks={blockedTasks} />}
        <SoftPanel
          variant="utility"
          title="Pressure Signals"
          subtitle="Scoped project pressure from the adapter layer."
        >
          {pressureSignals.length ? (
            <div className="space-y-3">
              {pressureSignals.slice(0, 3).map((signal) => (
                <div
                  key={signal.id}
                  className="rounded-[18px] border border-slate-200 bg-black/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {signal.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {signal.summary}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-amber-700">
                      {signal.severity}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {signal.whySurfaced}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No project pressure is surfaced."
              description="Project-scoped pressure signals will appear here once the adapter returns them."
            />
          )}
        </SoftPanel>
        <SoftPanel
          variant="utility"
          title="Decision Queue"
          subtitle="Top project-scoped actions from the adapter layer."
        >
          {decisionQueue.length ? (
            <div className="space-y-3">
              {decisionQueue.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-[18px] border border-slate-200 bg-black/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.whyNow}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sky-700">
                      {item.score.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {item.expectedEffect}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No project actions are surfaced."
              description="Once scoped work is available, this rail will explain the next move."
            />
          )}
        </SoftPanel>
        <SoftPanel
          variant="utility"
          title="Immediate Actions"
          subtitle="Low-friction next moves from the adapter layer."
        >
          {immediateActions.length ? (
            <div className="space-y-3">
              {immediateActions.slice(0, 3).map((item) => (
                <article
                  key={item.id}
                  className="rounded-[18px] border border-slate-200 bg-black/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.summary}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sky-700">
                      {item.reversibility}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{item.whyNow}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      to="/actions"
                      search={{
                        sort: undefined,
                        simulatableOnly: undefined,
                        selectedId: item.id,
                      }}
                      className="text-xs font-semibold text-sky-700 underline decoration-sky-500/40 underline-offset-4"
                    >
                      Inspect in Actions
                    </Link>
                    <span className="text-xs text-slate-500">
                      {item.expectedEffect}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No immediate actions are surfaced."
              description="The adapter will surface low-friction actions once they are available."
            />
          )}
        </SoftPanel>
        <SoftPanel
          variant="utility"
          title="Verification Rail"
          subtitle="Project verification outcomes from the adapter layer."
        >
          {verificationRail.length ? (
            <div className="space-y-3">
              {verificationRail.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-[18px] border border-slate-200 bg-black/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.summary}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.status}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-700">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No verification outcomes are surfaced."
              description="When project actions resolve, their verification history will appear here."
            />
          )}
        </SoftPanel>
        <SoftPanel
          variant="utility"
          title="Execution Snapshot"
          subtitle="Active tasks, pipelines, runners, Huey jobs, and schedules."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Active Tasks', items: executionSnapshot.activeTasks },
              { label: 'Pipelines', items: executionSnapshot.activePipelines },
              { label: 'Runners', items: executionSnapshot.activeRunners },
              { label: 'Huey Jobs', items: executionSnapshot.hueyJobs },
              { label: 'Schedules', items: executionSnapshot.scheduleItems },
            ].map((group) => (
              <div
                key={group.label}
                className="rounded-[18px] border border-slate-200 bg-black/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {group.label}
                  </p>
                  <span className="rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-600">
                    {group.items.length}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {group.items.length
                    ? group.items
                        .slice(0, 2)
                        .map((item) => item.title ?? item.id)
                        .join(' · ')
                    : 'No items surfaced'}
                </p>
              </div>
            ))}
          </div>
        </SoftPanel>
        <SoftPanel
          variant="utility"
          title="Context Panel"
          subtitle="COD-selected project context."
        >
          {contextPanel.length ? (
            <div className="space-y-3">
              {contextPanel.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[18px] border border-slate-200 bg-black/5 p-4"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    {item.reasonSelected}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Related notes coming soon"
              description="The context rail is ready for project-linked notes and memories."
            />
          )}
        </SoftPanel>
      </div>
    </div>
  );
}
