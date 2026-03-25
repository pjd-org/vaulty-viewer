import React from 'react';
import { AppShell, PageFrame } from '../components/layout';
import ProjectDetailHeader from '../components/projects/ProjectDetailHeader';

export default function ProjectDetail({ params }: { params: { projectId: string } }) {
  const project = { id: params.projectId, title: 'Project X', statusVariant: 'active', progressPercent: 55, bestMoveTitle: 'Ship MVP' };
  return (
    <AppShell>
      <PageFrame title={project.title}>
        <ProjectDetailHeader project={project} />
        <div className="mt-6">Scoped board and blockers go here (placeholder)</div>
      </PageFrame>
    </AppShell>
  );
}
