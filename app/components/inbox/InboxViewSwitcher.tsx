import React from 'react'
import { SegmentedControl } from '../ui'

type InboxTab = 'queue' | 'workbench' | 'archive'

interface InboxViewSwitcherProps {
  view: InboxTab
  onChange: (v: InboxTab) => void
  counts: { queue: number; workbench: number; archive: number }
}

export function InboxViewSwitcher({ view, onChange, counts }: InboxViewSwitcherProps) {
  return (
    <SegmentedControl
      value={view}
      onChange={(v) => onChange(v as InboxTab)}
      options={[
        { value: 'queue',     label: `Queue (${counts.queue})` },
        { value: 'workbench', label: `Workbench (${counts.workbench})` },
        { value: 'archive',   label: `Archive (${counts.archive})` },
      ]}
    />
  )
}
