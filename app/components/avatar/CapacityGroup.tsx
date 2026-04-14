import React from 'react';
import {
  formatTimeBudget,
  deriveCapacityGuidance,
  isMetricReal,
  type CapacityInput,
} from '../../../src/lib/readiness-logic';

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
      <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
        Capacity
      </p>
      <div className="flex flex-wrap gap-2">
        {time && (
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700">
            {time} available
          </span>
        )}
        {isMetricReal(capacity.focusCostMax) && (
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-700">
            Focus ≤ {capacity.focusCostMax}
          </span>
        )}
        {isMetricReal(capacity.effortScoreMax) && (
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-700">
            Effort ≤ {capacity.effortScoreMax}
          </span>
        )}
      </div>
      {guidance && <p className="mt-1 text-xs text-slate-500">{guidance}</p>}
    </section>
  );
}
