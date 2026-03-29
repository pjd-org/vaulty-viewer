import React from 'react';
import { PrimaryButton } from '../ui';

interface ProjectHeaderProps {
  title: string;
  bestMoveTitle?: string | null;
}

export const ProjectDetailHeader: React.FC<{ project: ProjectHeaderProps }> = ({ project }) => {
  return (
    <div className="genie-surface genie-surface--hero p-6 flex items-center justify-between">
      <div className="genie-content">
        <h1 className="text-2xl font-semibold text-slate-800">{project.title}</h1>
        <p className="text-sm text-slate-600">{project.bestMoveTitle}</p>
      </div>
      <div>
        <PrimaryButton>Start</PrimaryButton>
      </div>
    </div>
  );
};

export default ProjectDetailHeader;
