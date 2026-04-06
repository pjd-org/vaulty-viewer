import React from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { CardGrid } from '../layout';
import ProjectCard from './ProjectCard';
import { EmptyState } from '../ui';
import { fetchProjects } from '../../lib/api/projects';

export function ProjectsWorkspace() {
  const {
    data: projects,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 60_000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          role="status"
          aria-label="Loading projects"
          className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-sky-300"
        />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load projects"
        description="Try reloading the page."
      />
    );
  }

  if (!projects?.length) {
    return (
      <EmptyState
        title="No projects"
        description="Create a project to get started."
      />
    );
  }

  return (
    <CardGrid>
      {projects.map((project) => (
        <div key={project.id} className="col-span-1">
          <Link
            to="/project/$slug"
            params={{ slug: project.id }}
            search={{} as never}
            className="block"
          >
            <ProjectCard project={project} />
          </Link>
        </div>
      ))}
    </CardGrid>
  );
}
