import React from 'react';

export interface ExecutionStatsProps {
  vitals: Record<string, unknown>;
}

export function ExecutionStats({ vitals }: ExecutionStatsProps) {
  const tasksToday = (vitals.tasksCompletedToday as number) ?? 0;
  const sessionsWeek = (vitals.sessionsCompletedThisWeek as number) ?? 0;

  if (tasksToday === 0 && sessionsWeek === 0) return null;

  return (
    <section className="mb-5 space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
        Today
      </p>
      <div className="flex gap-6">
        <div className="text-center">
          <span className="block text-2xl font-semibold tabular-nums text-slate-800">
            {tasksToday}
          </span>
          <span className="text-xs text-slate-500">tasks done</span>
        </div>
        <div className="text-center">
          <span className="block text-2xl font-semibold tabular-nums text-slate-800">
            {sessionsWeek}
          </span>
          <span className="text-xs text-slate-500">sessions this week</span>
        </div>
      </div>
    </section>
  );
}
