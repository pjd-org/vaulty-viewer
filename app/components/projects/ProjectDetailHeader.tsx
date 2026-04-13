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
    <div className="genie-surface genie-surface--hero rounded-[28px] p-6 space-y-6">
      {/* ── Row 1: title + status ────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Project command center
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-800">
            {project.title}
          </h1>
        </div>
        <SoftChip label={project.statusLabel} variant={project.statusVariant} />
      </div>

      {/* ── Row 2: stat cards + jump-to-lane ─────────────────────────── */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
      >
        {/* Progress */}
        <div className="rounded-[18px] border border-slate-200 bg-black/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Progress
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {project.progressText}
          </p>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-black/10"
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

        {/* ETA */}
        <div className="rounded-[18px] border border-slate-200 bg-black/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            ETA
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {project.etaLabel ?? 'No ETA surfaced'}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Live project timing from the summary feed.
          </p>
        </div>

        {/* Best Move — spans both columns */}
        <div className="col-span-2 rounded-[18px] border border-slate-200 bg-black/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Best move
          </p>
          <p className="mt-2 text-sm font-semibold leading-snug text-slate-800">
            {project.bestMoveTitle ?? 'No best move surfaced'}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            COD-ranked next step from the current project summary.
          </p>
        </div>

        {/* Jump to Lane — spans both columns */}
        <div className="col-span-2 rounded-[18px] border border-slate-200 bg-black/5 p-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Jump to lane
          </p>
          {[
            {
              to: '/project/$slug/tasks' as const,
              label: 'Tasks',
              desc: 'Board & execution queue',
              search: projectLaneSearch,
            },
            {
              to: '/project/$slug/knowledge' as const,
              label: 'Knowledge',
              desc: 'Workspace & notes',
              search: projectLaneSearch,
            },
            {
              to: '/project/$slug/automation' as const,
              label: 'Automation',
              desc: 'Pipelines & runners',
              search: automationLaneSearch as never,
            },
          ].map((lane) => (
            <Link
              key={lane.label}
              to={lane.to}
              params={{ slug: projectId }}
              search={lane.search}
              className="group flex items-center justify-between gap-2 rounded-[14px] border border-slate-200 bg-white/60 px-3 py-2 transition-colors hover:border-sky-500/40 hover:bg-sky-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {lane.label}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {lane.desc}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                Open
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailHeader;
