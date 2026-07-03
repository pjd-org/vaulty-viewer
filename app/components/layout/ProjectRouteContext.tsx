import React from 'react'

import type { ProjectSurfacePayload } from '../../lib/viewer-adapter'
import type { SummaryRowItem } from './SummaryRow'

export interface ProjectRouteShellContextValue {
  projectId: string
  projectPath: string
  summaryItems: readonly SummaryRowItem[]
  projectSurface: ProjectSurfacePayload | null
}

const ProjectRouteShellContext = React.createContext<ProjectRouteShellContextValue | null>(null)

export function ProjectRouteShellProvider({
  value,
  children,
}: {
  value: ProjectRouteShellContextValue
  children: React.ReactNode
}) {
  return (
    <ProjectRouteShellContext.Provider value={value}>
      {children}
    </ProjectRouteShellContext.Provider>
  )
}

export function useProjectRouteShellContext() {
  return React.useContext(ProjectRouteShellContext)
}
