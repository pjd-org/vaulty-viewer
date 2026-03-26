import React from 'react';
import type { ProjectSummaryDisplay } from '../../types/display';
import { SoftChip } from '../ui';

export const ProjectCard: React.FC<{ project: ProjectSummaryDisplay }> = ({ project }) => {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{project.title}</h3>
        <SoftChip label={project.statusLabel} variant={project.statusVariant} />
      </div>
      <p className="mt-2 text-sm text-neutral-500">{project.bestMoveTitle}</p>
      <div className="mt-3">
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-2 bg-primary" style={{ width: `${project.progressPercent ?? 0}%` }} />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
