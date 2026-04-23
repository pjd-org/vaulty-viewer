import React from 'react';
import type { ProjectSummaryDisplay } from '../../types/display';
import { SoftChip } from '../ui';

export const ProjectCard: React.FC<{ project: ProjectSummaryDisplay }> = ({
  project,
}) => {
  return (
    <div className="genie-card flex flex-col gap-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h3 className="text-lg font-semibold leading-snug text-[var(--text-primary)]">
            {project.title}
          </h3>
          {project.bestMoveTitle && (
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {project.bestMoveTitle}
            </p>
          )}
        </div>
        <SoftChip label={project.statusLabel} variant={project.statusVariant} />
      </div>
      <div
        className="progress h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={project.progressPercent ?? 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${project.title} progress`}
      >
        <div className="progress-fill h-2" style={{ width: `${project.progressPercent ?? 0}%` }} />
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-tertiary)]">
        <span className="min-w-0 flex-1">{project.progressText}</span>
        {project.etaLabel && <span className="shrink-0 tabular-nums">{project.etaLabel}</span>}
      </div>
    </div>
  );
};

export default ProjectCard;
