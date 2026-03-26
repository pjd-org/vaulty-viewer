import React from 'react'
import { AppShell as GenieAppShell } from '@vault/ui'

interface AppShellProps {
  /** Left rail slot — pass a <SidebarRail> */
  rail?: React.ReactNode
  /** Right context panel slot */
  panel?: React.ReactNode
  /** Show/hide right panel */
  panelOpen?: boolean
  children: React.ReactNode
}

export function AppShell({ rail, panel, panelOpen = false, children }: AppShellProps) {
  return (
    <GenieAppShell rail={rail} panel={panel} panelOpen={panelOpen}>
      {children}
    </GenieAppShell>
  )
}
