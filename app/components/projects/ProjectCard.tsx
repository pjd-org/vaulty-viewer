import React from 'react';
import type { ProjectSummaryDisplay } from '../../types/display';
import { SoftChip } from '../ui';
import { Card, CardContent, CardHeader } from '../ui/card';

export const ProjectCard: React.FC<{ project: ProjectSummaryDisplay }> = ({
  project,
}) => {
  return (
    <Card className="shadow-[5px_5px_0px_0px_var(--border)] animate-fade-in transition-transform duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--border)]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">
            {project.title}
          </h3>
          <SoftChip
            label={project.statusLabel}
            variant={project.statusVariant}
          />
        </div>
        {project.bestMoveTitle && (
          <p className="mt-1 text-sm text-slate-600">{project.bestMoveTitle}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
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
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{project.progressText}</span>
          {project.etaLabel && <span>{project.etaLabel}</span>}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
