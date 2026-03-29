import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { WorkspaceScaffold } from '../components/layout'
import { portfolioSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/portfolio')({
  validateSearch: portfolioSearchParams,
  component: PortfolioRoute,
})

function PortfolioRoute() {
  return (
    <WorkspaceScaffold
      title="Portfolio"
      subtitle="Capital-control lane for allocation, drift, and rebalance actions."
      summaryItems={[
        { label: 'Value', value: 'Tracked', detail: 'Portfolio summary scaffolded' },
        { label: 'Drift', value: 'Visible', detail: 'Route ready for adapter payloads' },
        { label: 'Risk', value: 'Pending', detail: 'Detail panel reserved' },
        { label: 'Action', value: 'Rebalance', detail: 'Primary CTA slot established' },
      ]}
      primaryTitle="Portfolio Workspace"
      primarySubtitle="Allocation, performance, drift, positions, and risks."
      primary={
        <p className="text-sm text-slate-300">
          The portfolio lane is now a first-class route in the shell. Phase 3 will bind charts,
          risk explanations, and rebalance workflows to this surface.
        </p>
      }
      asideTitle="Action Surface"
      asideSubtitle="Rebalance, create review, or inspect holdings."
      aside={<p className="text-sm text-slate-300">Selection-driven details will render here.</p>}
    />
  )
}
