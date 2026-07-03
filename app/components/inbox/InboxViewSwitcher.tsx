import React from 'react'
import { SegmentedControl } from '../ui'

type InboxTab = 'queue' | 'workbench' | 'archive'

interface InboxViewSwitcherProps {
  value: InboxTab
  onValueChange: (v: InboxTab) => void
  counts: { queue: number; workbench: number; archive: number }
}

export function InboxViewSwitcher({ value, onValueChange, counts }: InboxViewSwitcherProps) {
  return (
    <SegmentedControl
      value={value}
      onChange={(v) => onValueChange(v as InboxTab)}
      options={[
        { value: 'queue',     label: `Queue (${counts.queue})` },
        { value: 'workbench', label: `Workbench (${counts.workbench})` },
        { value: 'archive',   label: `Archive (${counts.archive})` },
      ]}
    />
  )
}
