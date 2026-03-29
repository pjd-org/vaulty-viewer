import React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { WorkspaceScaffold } from '../components/layout'
import { bubbleSearchParams } from '../../src/lib/routes/search-params'

export const Route = createFileRoute('/bubble')({
  validateSearch: bubbleSearchParams,
  component: BubbleRoute,
})

function BubbleRoute() {
  return (
    <WorkspaceScaffold
      title="Bubble"
      subtitle="Behavioral control lane for pressure, drift, momentum, and rewards."
      summaryItems={[
        { label: 'Momentum', value: 'Monitored', detail: 'Trend surface ready' },
        { label: 'Pressure', value: 'Visible', detail: 'COD signals belong here' },
        { label: 'Rewards', value: 'Scoped', detail: 'Action surface reserved' },
        { label: 'Energy', value: 'Tracked', detail: 'Phase 3 chart hooks' },
      ]}
      primaryTitle="Bubble Workspace"
      primarySubtitle="Interpretation on the left, intervention on the right."
      primary={
        <p className="text-sm text-slate-300">
          Bubble is now part of the canonical command loop shell instead of living as implied context.
        </p>
      }
      asideTitle="Intervention Panel"
      asideSubtitle="Adjust state or create follow-up."
      aside={<p className="text-sm text-slate-300">Selection-driven bubble actions will render here.</p>}
    />
  )
}
