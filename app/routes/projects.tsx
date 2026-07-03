import React from 'react';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/projects')({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/projects' || location.pathname === '/projects/') {
      throw redirect({
        to: '/work',
        replace: true,
        search: {},
      })
    }
  },
  component: ProjectsIndex,
});

function ProjectsIndex() {
  return <Outlet />;
}

export default ProjectsIndex;
