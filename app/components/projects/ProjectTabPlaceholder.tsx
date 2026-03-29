import React from 'react'

import { SoftPanel } from '../layout'

interface ProjectTabPlaceholderProps {
  title: string
  description: string
}

export function ProjectTabPlaceholder({
  title,
  description,
}: ProjectTabPlaceholderProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
      <SoftPanel title={title} subtitle="Phase 1 scaffold" variant="elevated">
        <div className="space-y-3 text-sm text-slate-300">
          <p>{description}</p>
          <p>
            This view now resolves inside the canonical project shell and is
            ready for Phase 3 and Phase 4 feature work.
          </p>
        </div>
      </SoftPanel>
      <SoftPanel
        title="Why it is here"
        subtitle="Viewer V3 shell contract"
        variant="utility"
      >
        <ul className="space-y-2 text-sm text-slate-300">
          <li>Project routes now share one scoped command-center shell.</li>
          <li>Tabs are URL-addressable and safe to link directly.</li>
          <li>Verification stays visible at the global shell level.</li>
        </ul>
      </SoftPanel>
    </div>
  )
}
