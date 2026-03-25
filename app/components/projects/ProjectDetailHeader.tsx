import React from 'react';
import type { ProjectSummaryDisplay } from '../../types/display';
import { PrimaryButton } from '../ui';

export const ProjectDetailHeader: React.FC<{ project: ProjectSummaryDisplay }> = ({ project }) => {
  return (
    <div className="rounded-2xl bg-white p-6 shadow flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <p className="text-sm text-slate-500">{project.bestMoveTitle}</p>
      </div>
      <div>
        <PrimaryButton>Start</PrimaryButton>
      </div>
    </div>
  );
};

export default ProjectDetailHeader;
