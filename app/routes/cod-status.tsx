import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PageFrame } from '../components/layout'
import { CodModal } from '../components/cod'

export const Route = createFileRoute('/cod-status')({
  component: CODStatusRoute,
})

function CODStatusRoute() {
  return (
    <main className="space-y-6">
      <PageFrame title="Readiness" subtitle="Can you work now, and under what constraints?">
        <CodModal />
      </PageFrame>
    </main>
  )
}
