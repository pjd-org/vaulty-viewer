import React from 'react'
import { SegmentedControl } from '../ui'

type InboxTab = 'signals' | 'queue' | 'workbench' | 'archive'

interface InboxViewSwitcherProps {
  value: InboxTab
  onValueChange: (v: InboxTab) => void
  counts: { signals: number; queue: number; workbench: number; archive: number }
}

export function InboxViewSwitcher({ value, onValueChange, counts }: InboxViewSwitcherProps) {
  return (
    <SegmentedControl
      value={value}
      onChange={(v) => onValueChange(v as InboxTab)}
      options={[
        { value: 'signals',   label: `Signals (${counts.signals})` },
        { value: 'queue',     label: `Staged (${counts.queue})` },
        { value: 'workbench', label: `Workbench (${counts.workbench})` },
        { value: 'archive',   label: `Archive (${counts.archive})` },
      ]}
    />
  )
}
