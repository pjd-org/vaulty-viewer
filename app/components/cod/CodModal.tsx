import React, { useState } from 'react'
import useCODStatus from '../../../src/hooks/useCODStatus'
import HumanStateForm from '../../../src/components/HumanStateForm'
import {
  normalizeCodSignals,
  deriveCodConstraints,
  getMaxSprintMin,
} from '../../../src/lib/cod-status-logic'
import { toCodDisplayState } from '../../lib/display'
import { SoftPanel, SectionHeader } from '../layout'
import { IconButton, ReasonText } from '../ui'
import { CodSeverityPill } from './CodSeverityPill'
import { CodActionRow } from './CodActionRow'
import { CodConstraintTable } from './CodConstraintTable'
import { CodSignalRow } from './CodSignalRow'
import type { CodSignalStatus } from '../../../src/lib/cod-status-logic'

function signalVariant(s: CodSignalStatus): 'ok' | 'warn' | 'bad' | undefined {
  if (s === 'good') return 'ok'
  if (s === 'warn') return 'warn'
  if (s === 'bad') return 'bad'
  return undefined
}

const REFRESH_ICON = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M13.5 2.5A6.5 6.5 0 1 1 2.5 8" />
    <polyline points="2.5 2.5 2.5 6 6 6" />
  </svg>
)

export function CodModal() {
  const {
    validation,
    humanState,
    warnings,
    loading,
    updating,
    refresh,
    updateHumanState,
  } = useCODStatus()

  const [showForm, setShowForm] = useState(false)

  const constraints = deriveCodConstraints(humanState, validation.status)
  const signals = normalizeCodSignals(humanState)
  const maxSprintMin = getMaxSprintMin(validation.status)
  const canStartSession = validation.status !== 'FAIL'

  const codState = {
    canStartSession,
    maxSprintMin,
    why: warnings,
  }

  const display = {
    ...toCodDisplayState({
      status: validation.status,
      reason: warnings[0] ?? null,
    }),
    constraintItems: constraints.map((c) => ({ label: c.label, value: c.value })),
    signalItems: signals.map((s) => ({
      label: s.label,
      value: `${s.value}${s.unit ?? '%'}`,
      variant: signalVariant(s.status),
    })),
  }

  return (
    <SoftPanel>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <CodSeverityPill variant={display.severityVariant} label={display.severityLabel} />
          <p className="mt-2 text-base font-medium text-neutral-900">{display.headline}</p>
          {display.reasonText && (
            <ReasonText className="mt-1">{display.reasonText}</ReasonText>
          )}
        </div>
        <IconButton
          icon={REFRESH_ICON}
          label="Refresh"
          onClick={() => { void refresh() }}
          disabled={loading}
        />
      </div>

      {/* Action row */}
      <CodActionRow
        actions={display.actionLabels}
        canWork={codState.canStartSession}
        maxSprintMin={codState.maxSprintMin}
        onCheckIn={() => setShowForm(true)}
      />

      {/* Two-col: constraints + signals */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div>
          <SectionHeader title="Constraints" />
          <CodConstraintTable items={display.constraintItems} />
        </div>
        <div>
          <SectionHeader title="Signals" />
          <CodSignalRow items={display.signalItems} />
        </div>
      </div>

      {/* Why this status */}
      {codState.why.length > 0 && (
        <details className="mt-6 rounded-xl border border-neutral-200">
          <summary className="px-4 py-3 text-sm font-medium text-neutral-600 cursor-pointer select-none">
            Why this status
          </summary>
          <div className="px-4 pb-4 space-y-1">
            {codState.why.map((w, i) => (
              <ReasonText key={i}>{w}</ReasonText>
            ))}
          </div>
        </details>
      )}

      {/* Human state form + debug — fully collapsed */}
      <details className="mt-3 rounded-xl border border-neutral-200" open={showForm}>
        <summary className="px-4 py-3 text-xs text-neutral-400 cursor-pointer select-none">
          Update state / debug
        </summary>
        <div className="px-4 pb-4">
          <HumanStateForm
            currentState={{
              ...humanState,
              focusCapacity: humanState.focusCapacity === 'unknown' ? undefined : humanState.focusCapacity,
            }}
            onSubmit={(data) => {
              void updateHumanState(data)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
            loading={updating}
          />
        </div>
      </details>
    </SoftPanel>
  )
}
