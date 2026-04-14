import React, { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/src/lib/utils';

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
import { useLoginRedirectOnUnauthenticated } from '../../hooks/use-login-redirect';

const EMPTY_EXECUTION_SNAPSHOT: ProjectSurfacePayload['executionSnapshot'] = {
  activeTasks: [],
  activePipelines: [],
  activeRunners: [],
  hueyJobs: [],
  scheduleItems: [],
};

function severityBadge(severity?: string) {
  const s = (severity ?? '').toLowerCase();
  const map: Record<string, string> = {
    critical:
      'bg-[color-mix(in_srgb,var(--a-rose)_15%,transparent)] text-[var(--text-danger)]',
    high: 'bg-[color-mix(in_srgb,var(--a-sun)_15%,transparent)] text-[var(--text-warning)]',
    medium:
      'bg-[color-mix(in_srgb,var(--a-sky)_15%,transparent)] text-[var(--text-info)]',
    low: 'bg-[var(--surf-utility)] text-[var(--text-tertiary)]',
  };
  return cn(
    'rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] shrink-0',
    map[s] ?? 'bg-[var(--surf-utility)] text-[var(--text-tertiary)]'
  );
}

export function ProjectDetailScene({
  projectId,
  accentColor,
}: {
  projectId: string;
  accentColor?: string;
}) {
  const accent = accentColor ?? 'var(--a-sky)';
  const {
    data: projectDisplay,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    ...getProjectQueryOptions(projectId),
    enabled: !!projectId,
  });

  const {
    data: allTasks = [],
    isLoading: tasksLoading,
    error: tasksError,
  } = useAllTasks();

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

  const { data: displaySurface, error: displaySurfaceError } =
    useProjectSurface(projectId);
  const isUnauthenticated = useLoginRedirectOnUnauthenticated(
    projectError ?? tasksError ?? displaySurfaceError
  );
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

  if (isUnauthenticated) return null;

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
          <ProjectDetailHeader
            projectId={projectId}
            project={projectHeader}
            accentColor={accentColor}
          />
        ) : (
          <SkeletonCard />
        )}
        {tasksLoading ? (
          <SkeletonCard />
        ) : (
          <ProjectBoardSection
            tasks={projectTasks}
            projectId={projectId}
            accentColor={accentColor}
          />
        )}
      </div>
      <div className="space-y-4">
        {!tasksLoading && (
          <BlockersRail blockedTasks={blockedTasks} accentColor={accentColor} />
        )}
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
                  className="rounded-[18px] border border-[var(--border-glass)] bg-[var(--surf-utility)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {signal.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {signal.summary}
                      </p>
                    </div>
                    <span className={severityBadge(signal.severity)}>
                      {signal.severity}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[var(--text-tertiary)]">
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
                  className="rounded-[18px] border border-[var(--border-glass)] bg-[var(--surf-utility)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {item.whyNow}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-info)]"
                      style={{
                        background: `color-mix(in srgb, ${accent} 15%, transparent)`,
                      }}
                    >
                      {item.score.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[var(--text-tertiary)]">
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
                  className="rounded-[18px] border border-[var(--border-glass)] bg-[var(--surf-utility)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {item.summary}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-info)]"
                      style={{
                        background: `color-mix(in srgb, ${accent} 15%, transparent)`,
                      }}
                    >
                      {item.reversibility}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                    {item.whyNow}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      to="/actions"
                      search={{
                        sort: undefined,
                        simulatableOnly: undefined,
                        selectedId: item.id,
                      }}
                      className="text-xs font-semibold text-[var(--text-info)] underline decoration-[var(--text-info)]/40 underline-offset-4"
                    >
                      Inspect in Actions
                    </Link>
                    <span className="text-xs text-[var(--text-tertiary)]">
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
                  className="rounded-[18px] border border-[var(--border-glass)] bg-[var(--surf-utility)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {item.summary}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {item.status}
                      </p>
                    </div>
                    <span className="rounded-full bg-[color-mix(in_srgb,var(--a-mint)_15%,transparent)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-success)]">
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
                className="rounded-[18px] border border-[var(--border-glass)] bg-[var(--surf-utility)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {group.label}
                  </p>
                  <span className="rounded-full bg-[var(--surf-utility)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                    {group.items.length}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
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
                  className="rounded-[18px] border border-[var(--border-glass)] bg-[var(--surf-utility)] p-4"
                >
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {item.summary}
                  </p>
                  <p className="mt-3 text-xs text-[var(--text-tertiary)]">
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
