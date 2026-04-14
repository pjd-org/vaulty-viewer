import React from 'react';
import { Link } from '@tanstack/react-router';
import {
  formatTimeBudget,
  type ReadinessState,
  type CapacityInput,
} from '../../../src/lib/readiness-logic';

export interface ActionGuidancePanelProps {
  readiness: ReadinessState;
  capacity: CapacityInput;
}

export function ActionGuidancePanel({
  readiness,
  capacity,
}: ActionGuidancePanelProps) {
  const focusParam = readiness.maxFocusCost;
  const effortParam = readiness.maxEffortScore;
  const budget = capacity.timeBudgetMin ?? 60;

  const tasksHref =
    focusParam !== undefined || effortParam !== undefined
      ? `/?maxFocusCost=${focusParam ?? ''}&maxEffort=${effortParam ?? ''}`
      : '/';

  return (
    <section className="mb-5 space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
        What to do now
      </p>
      <p className="text-sm text-slate-600">{readiness.description}</p>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/"
          search={{ session: '1' }}
          className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-200"
        >
          Start {readiness.sessionType} session
          {budget > 0 && ` (${formatTimeBudget(Math.min(budget, 90))})`}
        </Link>
        <Link
          to={tasksHref}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-black/5"
        >
          See matched tasks
        </Link>
      </div>
    </section>
  );
}
