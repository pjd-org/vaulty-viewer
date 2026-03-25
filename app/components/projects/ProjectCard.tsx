import React from 'react';
import type { ProjectSummaryDisplay } from '../../types/display';
import { StatusPill } from '../ui';

export const ProjectCard: React.FC<{ project: ProjectSummaryDisplay }> = ({ project }) => {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{project.title}</h3>
        <StatusPill>{project.statusVariant}</StatusPill>
      </div>
      <p className="mt-2 text-sm text-slate-500">{project.bestMoveTitle}</p>
      <div className="mt-3">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-2 bg-sky-500" style={{ width: `${project.progressPercent ?? 0}%` }} />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
