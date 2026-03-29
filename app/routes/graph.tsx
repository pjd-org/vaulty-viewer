import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { WorkspaceScaffold } from '../components/layout'
import { graphSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/graph')({
  validateSearch: graphSearchParams,
  component: GraphRoute,
})

function GraphRoute() {
  return (
    <WorkspaceScaffold
      title="Graph"
      subtitle="Deep-context lane for knowledge, dependency, incident, and memory graphs."
      summaryItems={[
        { label: 'Global graph', value: 'Ready', detail: 'Route canon established' },
        { label: 'Dependency', value: 'Scoped', detail: 'Project and global views' },
        { label: 'Memory', value: 'Planned', detail: 'Agent and note links' },
        { label: 'Paths', value: 'Searchable', detail: 'Node and path params reserved' },
      ]}
      primaryTitle="Graph Workspace"
      primarySubtitle="Graph canvas and filters."
      primary={<p className="text-sm text-slate-300">Graph now has a canonical shell route and URL contract.</p>}
      asideTitle="Entity Inspector"
      asideSubtitle="Selected node, path, and linked actions."
      aside={<p className="text-sm text-slate-300">Entity detail will render here in later phases.</p>}
    />
  )
}
