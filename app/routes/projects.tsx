import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell, PageFrame, CardGrid } from '../components/layout';
import ProjectCard from '../components/projects/ProjectCard';
import EmptyState from '../components/ui/EmptyState';
import { fetchProjects } from '../lib/api/projects';

export default function ProjectsIndex() {
  const [featureEnabled, setFeatureEnabled] = useState(true);

  useEffect(() => {
    // Feature flag: local override via localStorage 'viewer.feature.projects' === 'false' disables
    try {
      const v = typeof window !== 'undefined' ? window.localStorage.getItem('viewer.feature.projects') : null;
      if (v === 'false') setFeatureEnabled(false);
    } catch (_) {
      // ignore
    }
  }, []);

  const { data: projects, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 1000 * 60 * 1,
    retry: 1,
  });

  if (!featureEnabled) {
    return (
      <AppShell>
        <PageFrame title="Projects">
          <EmptyState title="Projects feature disabled" description="Enable viewer.feature.projects to view this page." />
        </PageFrame>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageFrame title="Projects">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#4f8cff]" />
          </div>
        ) : isError ? (
          <EmptyState title="Failed to load projects" description="Try reloading the page." />
        ) : !projects || projects.length === 0 ? (
          <EmptyState title="No projects" description="Create a project to get started." />
        ) : (
          <CardGrid>
            {projects.map((p) => (
              <div key={p.id} className="col-span-1">
                <a href={`/projects/${encodeURIComponent(p.id)}`} className="block">
                  <ProjectCard project={p} />
                </a>
              </div>
            ))}
          </CardGrid>
        )}
      </PageFrame>
    </AppShell>
  );
}
