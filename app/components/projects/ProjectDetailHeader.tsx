import React from 'react';
import { Link } from '@tanstack/react-router';

import type { ProjectSummaryDisplay } from '../../types/display';
import { SoftChip } from '../ui';

const statCardClass =
  'rounded-[18px] border border-[var(--border-glass)] bg-[var(--surf-utility)] p-4';
const statLabelClass =
  'text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]';
const statValueClass = 'mt-2 text-sm font-semibold text-[var(--text-primary)]';
const statSubtextClass =
  'mt-2 text-xs leading-relaxed text-[var(--text-tertiary)]';

interface ProjectDetailHeaderProps {
  projectId: string;
  project: ProjectSummaryDisplay;
  /** Override the primary accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

export function ProjectDetailHeader({
  projectId,
  project,
  accentColor,
}: ProjectDetailHeaderProps) {
  const accent = accentColor ?? 'var(--a-sky)';
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
          <p className={statLabelClass}>Project command center</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
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
        <div className={statCardClass}>
          <p className={statLabelClass}>Progress</p>
          <p className={statValueClass}>{project.progressText}</p>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-black/10"
            role="progressbar"
            aria-valuenow={progressWidth}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${project.title} progress`}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progressWidth}%`,
                background: `linear-gradient(to right, ${accent}, var(--a-mint))`,
              }}
            />
          </div>
        </div>

        {/* ETA */}
        <div className={statCardClass}>
          <p className={statLabelClass}>ETA</p>
          <p className={statValueClass}>
            {project.etaLabel ?? 'No ETA surfaced'}
          </p>
          <p className={statSubtextClass}>
            Live project timing from the summary feed.
          </p>
        </div>

        {/* Best Move — spans both columns */}
        <div className={`col-span-2 ${statCardClass}`}>
          <p className={statLabelClass}>Best move</p>
          <p className={`${statValueClass} leading-snug`}>
            {project.bestMoveTitle ?? 'No best move surfaced'}
          </p>
          <p className={statSubtextClass}>
            COD-ranked next step from the current project summary.
          </p>
        </div>

        {/* Jump to Lane — spans both columns */}
        <div className={`col-span-2 ${statCardClass} space-y-2`}>
          <p className={statLabelClass}>Jump to lane</p>
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
              className="group flex items-center justify-between gap-2 rounded-[14px] border border-[var(--border-glass)] bg-[var(--surf-glass)] px-3 py-2 transition-colors"
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = `color-mix(in srgb, ${accent} 40%, transparent)`;
                el.style.background = `color-mix(in srgb, ${accent} 10%, transparent)`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = '';
                el.style.background = '';
              }}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {lane.label}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                  {lane.desc}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-info)]"
                style={{
                  background: `color-mix(in srgb, ${accent} 20%, transparent)`,
                }}
              >
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
