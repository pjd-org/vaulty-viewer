import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { WorkspaceScaffold } from '../components/layout'
import { healthSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/health')({
  validateSearch: healthSearchParams,
  component: HealthRoute,
})

function HealthRoute() {
  return (
    <WorkspaceScaffold
      title="Health"
      subtitle="Platform-integrity lane for freshness, incidents, sync, and degraded services."
      summaryItems={[
        { label: 'Freshness', value: 'Tracked', detail: 'Data age and gaps' },
        { label: 'Integrity', value: 'Scoped', detail: 'Validation and sync posture' },
        { label: 'Incidents', value: 'Live', detail: 'Incident feed shell ready' },
        { label: 'Degraded', value: '0', detail: 'Reserved for runtime status' },
      ]}
      primaryTitle="Health Workspace"
      primarySubtitle="Service and incident list."
      primary={
        <p className="text-sm text-slate-300">
          Health is now a stable destination in the shell. Phase 3 will connect incident feeds and service status tables.
        </p>
      }
      asideTitle="Investigation Panel"
      asideSubtitle="Root cause, related entities, and timeline links."
      aside={<p className="text-sm text-slate-300">Selection-driven investigations will render here.</p>}
    />
  )
}
