import React, { useState } from 'react';
import { GlassSurface } from '@vault/ui';
import useCODStatus from '../../../src/hooks/useCODStatus';
import HumanStateForm from '../../../src/components/HumanStateForm';
import {
  normalizeCodSignals,
  deriveCodConstraints,
  getMaxSprintMin,
  type CodSignalStatus,
} from '../../../src/lib/cod-status-logic';
import { toCodDisplayState } from '../../lib/display';
import { SectionHeader } from '../layout';
import { IconButton, ReasonText } from '../ui';
import { CodSeverityPill } from './CodSeverityPill';
import { CodActionRow } from './CodActionRow';
import { CodConstraintTable } from './CodConstraintTable';
import { CodSignalRow } from './CodSignalRow';

function signalVariant(s: CodSignalStatus): 'ok' | 'warn' | 'bad' | undefined {
  if (s === 'good') return 'ok';
  if (s === 'warn') return 'warn';
  if (s === 'bad') return 'bad';
  return undefined;
}

const REFRESH_ICON = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M13.5 2.5A6.5 6.5 0 1 1 2.5 8" />
    <polyline points="2.5 2.5 2.5 6 6 6" />
  </svg>
);

export function CodModal() {
  const {
    validation,
    humanState,
    warnings,
    loading,
    updating,
    refresh,
    updateHumanState,
  } = useCODStatus();

  const [showForm, setShowForm] = useState(false);

  const constraints = deriveCodConstraints(humanState, validation.status);
  const signals = normalizeCodSignals(humanState);
  const maxSprintMin = getMaxSprintMin(validation.status);
  const canStartSession = validation.status !== 'FAIL';

  const hasNoData =
    (humanState.energy == null || humanState.energy === 0) &&
    (humanState.stress == null || humanState.stress === 0) &&
    (humanState.timeAvailableMin == null ||
      humanState.timeAvailableMin === 0) &&
    (humanState.focusCapacity == null ||
      humanState.focusCapacity === 'unknown');

  const codState = {
    canStartSession,
    maxSprintMin,
    why: warnings,
  };

  const display = {
    ...toCodDisplayState({
      status: hasNoData ? 'UNKNOWN' : validation.status,
      reason: hasNoData
        ? 'No human state data. Check in to calibrate.'
        : (warnings[0] ?? null),
    }),
    constraintItems: constraints.map((c) => ({
      label: c.label,
      value: c.value,
    })),
    signalItems: signals.map((s) => ({
      label: s.label,
      value: `${s.value}${s.unit ?? '%'}`,
      variant: signalVariant(s.status),
    })),
  };

  return (
    <GlassSurface
      as="section"
      variant="elevated"
      radius="2xl"
      shadow="sm"
      className="flex flex-col gap-6 p-5 md:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <CodSeverityPill
            variant={display.severityVariant}
            label={display.severityLabel}
          />
          <p className="mt-2 text-base font-medium text-[var(--text-primary)]">
            {display.headline}
          </p>
          {display.reasonText && (
            <ReasonText className="mt-1">{display.reasonText}</ReasonText>
          )}
        </div>
        <IconButton
          icon={REFRESH_ICON}
          label="Refresh"
          onClick={() => {
            void refresh();
          }}
          disabled={loading}
        />
      </div>

      <CodActionRow
        actions={display.actionLabels}
        canWork={codState.canStartSession}
        maxSprintMin={codState.maxSprintMin}
        onCheckIn={() => setShowForm(true)}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <GlassSurface as="div" variant="base" radius="xl" shadow="xs" className="p-4">
          <SectionHeader title="Constraints" />
          <CodConstraintTable items={display.constraintItems} />
        </GlassSurface>
        <GlassSurface as="div" variant="base" radius="xl" shadow="xs" className="p-4">
          <SectionHeader title="Signals" />
          <CodSignalRow items={display.signalItems} />
        </GlassSurface>
      </div>

      {codState.why.length > 0 && (
        <GlassSurface as="div" variant="base" radius="xl" shadow="xs" className="overflow-hidden">
          <details className="group">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-[var(--text-secondary)]">
              Why this status
            </summary>
            <div className="flex flex-col gap-1 px-4 pb-4">
              {codState.why.map((w, i) => (
                <ReasonText key={i}>{w}</ReasonText>
              ))}
            </div>
          </details>
        </GlassSurface>
      )}

      <GlassSurface
        as="div"
        variant="base"
        radius="xl"
        shadow="xs"
        className="overflow-hidden"
      >
        <details className="group" open={showForm}>
          <summary className="cursor-pointer select-none px-4 py-3 text-xs text-[var(--text-tertiary)]">
            Update state / debug
          </summary>
          <div className="px-4 pb-4">
            <HumanStateForm
              currentState={{
                ...humanState,
                focusCapacity:
                  humanState.focusCapacity === 'unknown'
                    ? undefined
                    : humanState.focusCapacity,
              }}
              onSubmit={(data) => {
                void updateHumanState(data);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
              loading={updating}
            />
          </div>
        </details>
      </GlassSurface>
    </GlassSurface>
  );
}
