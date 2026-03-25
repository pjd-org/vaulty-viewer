import React from 'react'
import { Link } from '@tanstack/react-router'
import { SoftPanel } from '../layout'
import { MetaRow } from '../ui'
import type { ReadinessState } from '../../../src/lib/readiness-logic'

interface ReadinessCardProps {
  readiness: ReadinessState
  capacityLabel: string
  timeBudgetLabel: string | null
}

export function ReadinessCard({ readiness, capacityLabel, timeBudgetLabel }: ReadinessCardProps) {
  const metaItems = [
    ...(timeBudgetLabel ? [{ label: timeBudgetLabel }] : []),
    { label: capacityLabel },
  ]

  return (
    <SoftPanel>
      <div
        className="inline-flex items-center gap-2 mb-1"
        style={{ color: readiness.color }}
      >
        <span className="text-xl font-semibold">{readiness.label}</span>
      </div>
      <p className="text-sm text-slate-500 mt-1 mb-5">{readiness.description}</p>

      {metaItems.length > 0 && (
        <MetaRow items={metaItems} className="mb-5" />
      )}

      <Link
        to="/"
        className="inline-flex bg-[#4f8cff] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#3d7de8] transition-colors"
      >
        Start {readiness.sessionType} session
      </Link>
    </SoftPanel>
  )
}
