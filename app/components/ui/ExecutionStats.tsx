import React from 'react';
import { SectionLabel } from './AvatarPrimitives';
import { MetricLabel } from './Labels';

export interface VitalsData {
  tasksCompletedToday?: number;
  sessionsCompletedThisWeek?: number;
  [key: string]: unknown;
}

export interface ExecutionStatsProps {
  vitals: VitalsData;
}

export function ExecutionStats({ vitals }: ExecutionStatsProps) {
  const tasksToday = vitals.tasksCompletedToday ?? 0;
  const sessionsWeek = vitals.sessionsCompletedThisWeek ?? 0;

  if (tasksToday === 0 && sessionsWeek === 0) return null;

  return (
    <section className="mb-5 space-y-2">
      <SectionLabel>Today</SectionLabel>
      <div className="flex gap-6">
        <MetricLabel value={tasksToday} label="tasks done" />
        <MetricLabel value={sessionsWeek} label="sessions this week" />
      </div>
    </section>
  );
}
