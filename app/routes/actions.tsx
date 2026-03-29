import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { WorkspaceScaffold } from '../components/layout'
import { actionsSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/actions')({
  validateSearch: actionsSearchParams,
  component: ActionsRoute,
})

function ActionsRoute() {
  return (
    <WorkspaceScaffold
      title="Actions"
      subtitle="Execution console for COD-ranked interventions."
      summaryItems={[
        { label: 'Recommended', value: '12', detail: 'Ready to execute' },
        { label: 'High impact', value: '4', detail: 'Risk-reducing interventions' },
        { label: 'Low friction', value: '6', detail: 'Good quick-command candidates' },
        { label: 'Verification', value: 'Live', detail: 'Feeds back into Home and Project shells' },
      ]}
      primaryTitle="Recommended Actions"
      primarySubtitle="Ranked by urgency, impact, confidence, and reversibility."
      primary={
        <ul className="space-y-3 text-sm text-slate-300">
          <li>Retry failed automation runs with visible verification.</li>
          <li>Approve or defer inbox signals with a clear why-now explanation.</li>
          <li>Surface dry-run capable mutations before irreversible actions.</li>
        </ul>
      }
      asideTitle="Detail Panel"
      asideSubtitle="Selection-driven explanation and controls."
      aside={
        <div className="space-y-3 text-sm text-slate-300">
          <p>Every action view now has a canonical route and search contract.</p>
          <p>Phase 2 will bind these panels to the adapter payloads and mutation loop.</p>
        </div>
      }
    />
  )
}
