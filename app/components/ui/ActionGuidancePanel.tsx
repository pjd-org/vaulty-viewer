import React from 'react';
import { Link } from '@tanstack/react-router';
import {
  formatTimeBudget,
  type ReadinessState,
  type CapacityInput,
} from '../../../src/lib/readiness-logic';
import { SectionLabel } from './AvatarPrimitives';
import { linkButtonClass } from './LinkButton';

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
      <SectionLabel>What to do now</SectionLabel>
      <p className="text-sm text-[var(--text-secondary)]">
        {readiness.description}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/"
          search={{ session: '1' }}
          className={linkButtonClass.primary}
        >
          Start {readiness.sessionType} session
          {budget > 0 && ` (${formatTimeBudget(Math.min(budget, 90))})`}
        </Link>
        <Link to={tasksHref} className={linkButtonClass.secondary}>
          See matched tasks
        </Link>
      </div>
    </section>
  );
}
