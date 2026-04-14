import React from 'react';
import type { ProjectSummaryDisplay } from '../../types/display';
import { SoftChip } from '../ui';

export const ProjectCard: React.FC<{ project: ProjectSummaryDisplay }> = ({
  project,
}) => {
  return (
    <div className="genie-card animate-fade-in transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {project.title}
        </h3>
        <SoftChip label={project.statusLabel} variant={project.statusVariant} />
      </div>
      {project.bestMoveTitle && (
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          {project.bestMoveTitle}
        </p>
      )}
      {/* Progress bar */}
      <div
        className="progress h-2 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={project.progressPercent ?? 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${project.title} progress`}
      >
        <div
          className="progress-fill h-2"
          style={{ width: `${project.progressPercent ?? 0}%` }}
        />
      </div>
      {/* Readiness / next-step line */}
      <div
        className="flex items-center justify-between text-xs mt-2"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <span>{project.progressText}</span>
        {project.etaLabel && <span>{project.etaLabel}</span>}
      </div>
    </div>
  );
};

export default ProjectCard;
