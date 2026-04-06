import React from 'react';
import type { ProjectSummaryDisplay } from '../../types/display';
import { SoftChip } from '../ui';

export const ProjectCard: React.FC<{ project: ProjectSummaryDisplay }> = ({
  project,
}) => {
  return (
    <div className="genie-surface genie-surface--elevated p-6 transition-transform hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          {project.title}
        </h3>
        <SoftChip label={project.statusLabel} variant={project.statusVariant} />
      </div>
      <p className="mt-2 text-sm text-slate-600">{project.bestMoveTitle}</p>
      <div className="mt-3">
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
      </div>
    </div>
  );
};

export default ProjectCard;
