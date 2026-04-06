import React from 'react';
import { Link } from '@tanstack/react-router';

import type { ProjectSummaryDisplay } from '../../types/display';
import { SoftChip } from '../ui';

interface ProjectDetailHeaderProps {
  projectId: string;
  project: ProjectSummaryDisplay;
}

export function ProjectDetailHeader({
  projectId,
  project,
}: ProjectDetailHeaderProps) {
  const progressWidth = Math.max(0, Math.min(100, project.progressPercent));
  const projectLaneSearch = {
    tab: undefined,
    selectedId: undefined,
    noteId: undefined,
    mode: undefined,
    templateId: undefined,
    memoryTab: undefined,
  };
  const automationLaneSearch = {
    tab: undefined,
    subtab: undefined,
    selectedId: undefined,
    autoRefresh: undefined,
  };

  return (
    <div className="genie-surface genie-surface--hero rounded-[28px] p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Project command center
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">
                {project.title}
              </h1>
            </div>
            <SoftChip
              label={project.statusLabel}
              variant={project.statusVariant}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[18px] border border-white/8 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Progress
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-100">
                {project.progressText}
              </p>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuenow={progressWidth}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${project.title} progress`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-300 to-cyan-300"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>

            <div className="rounded-[18px] border border-white/8 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                ETA
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-100">
                {project.etaLabel ?? 'No ETA surfaced'}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Live project timing from the summary feed.
              </p>
            </div>

            <div className="rounded-[18px] border border-white/8 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Best move
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-100">
                {project.bestMoveTitle ?? 'No best move surfaced'}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                COD-ranked next step from the current project summary.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[360px] space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Jump to lane
          </p>
          <div className="grid gap-3">
            <Link
              to="/project/$slug/tasks"
              params={{ slug: projectId }}
              search={projectLaneSearch}
              className="group rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-sky-300/40 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Tasks</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Open the project board and execution queue.
                  </p>
                </div>
                <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sky-100">
                  Open
                </span>
              </div>
            </Link>
            <Link
              to="/project/$slug/knowledge"
              params={{ slug: projectId }}
              search={projectLaneSearch}
              className="group rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-sky-300/40 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Knowledge
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Jump to the project workspace and notes.
                  </p>
                </div>
                <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sky-100">
                  Open
                </span>
              </div>
            </Link>
            <Link
              to="/project/$slug/automation"
              params={{ slug: projectId }}
              search={automationLaneSearch as never}
              className="group rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-sky-300/40 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Automation
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Inspect pipelines, runners, and schedules.
                  </p>
                </div>
                <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sky-100">
                  Open
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailHeader;
