import React from 'react';
import { PrimaryButton } from '../ui';

interface ProjectHeaderProps {
  title: string;
  bestMoveTitle?: string | null;
}

export const ProjectDetailHeader: React.FC<{ project: ProjectHeaderProps }> = ({ project }) => {
  return (
    <div className="rounded-2xl bg-surface p-6 shadow flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <p className="text-sm text-neutral-500">{project.bestMoveTitle}</p>
      </div>
      <div>
        <PrimaryButton>Start</PrimaryButton>
      </div>
    </div>
  );
};

export default ProjectDetailHeader;
