import React from 'react';
import {
  formatTimeBudget,
  deriveCapacityGuidance,
  isMetricReal,
  type CapacityInput,
} from '../../../src/lib/readiness-logic';
import { SectionLabel } from './AvatarPrimitives';
import { SoftChip } from './Chips';

export interface CapacityGroupProps {
  capacity: CapacityInput;
}

export function CapacityGroup({ capacity }: CapacityGroupProps) {
  const time = formatTimeBudget(capacity.timeBudgetMin);
  const guidance = deriveCapacityGuidance(capacity);
  const hasAny =
    isMetricReal(capacity.timeBudgetMin) ||
    isMetricReal(capacity.focusCostMax) ||
    isMetricReal(capacity.effortScoreMax);

  if (!hasAny && !guidance) return null;

  return (
    <section className="mb-5 space-y-2">
      <SectionLabel>Capacity</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {time && <SoftChip variant="sky" label={`${time} available`} />}
        {isMetricReal(capacity.focusCostMax) && (
          <SoftChip
            variant="violet"
            label={`Focus ≤ ${capacity.focusCostMax}`}
          />
        )}
        {isMetricReal(capacity.effortScoreMax) && (
          <SoftChip
            variant="indigo"
            label={`Effort ≤ ${capacity.effortScoreMax}`}
          />
        )}
      </div>
      {guidance && <p className="mt-1 text-xs text-slate-500">{guidance}</p>}
    </section>
  );
}
