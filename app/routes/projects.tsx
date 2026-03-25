import React from 'react';
import { AppShell, PageFrame, CardGrid } from '../components/layout';
import ProjectCard from '../components/projects/ProjectCard';

const mock = [
  { id: 'p1', title: 'Website revamp', statusVariant: 'active', progressPercent: 42, bestMoveTitle: 'Finalize landing' },
  { id: 'p2', title: 'Onboarding flow', statusVariant: 'paused', progressPercent: 12, bestMoveTitle: 'Draft copy' },
];

export default function ProjectsIndex() {
  return (
    <AppShell>
      <PageFrame title="Projects">
        <CardGrid>
          {mock.map((p) => (
            <div key={p.id} className="col-span-1">
              <ProjectCard project={p} />
            </div>
          ))}
        </CardGrid>
      </PageFrame>
    </AppShell>
  );
}
