import React, { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useGoals } from '../../src/hooks/useGoals';
import GoalCard from '../../src/components/GoalCard';
import {
  computeCounts,
  filterGoals,
  sortGoals,
  computeSummary,
} from '../../src/lib/goals-logic';
import { dispatchNavOverlay } from '../../src/lib/nav-overlays';
import { WorkspaceScaffold } from '../components/layout';
import { EmptyState } from '../components/ui';

export const Route = createFileRoute('/goals')({
  component: GoalsRoute,
});

interface Goal {
  id: string;
  title: string;
  status: string;
  progress: number;
  priority: number;
  stats: {
    total: number;
    completed: number;
    totalEffort?: number;
    completedEffort?: number;
    blocked?: number;
  };
  tasks: Array<{
    id?: string;
    path?: string;
    title: string;
    status: string;
    effortScore?: number;
  }>;
  targetDate?: string;
  eta?: string;
}

function GoalsRoute() {
  const { goals, loading, error, refresh, apiStatus, updatedAt } = useGoals();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');

  const counts = computeCounts(goals as Parameters<typeof computeCounts>[0]);
  const filteredGoals = filterGoals(
    goals as Parameters<typeof filterGoals>[0],
    filter
  );
  const sortedGoals = sortGoals(filteredGoals, sortBy);

  const {
    totalTasks,
    completedTasks,
    totalEffort,
    completedEffort,
    overallProgress,
  } = computeSummary(goals as Parameters<typeof computeSummary>[0]);

  const summaryItems = [
    {
      label: 'Goals',
      value: loading ? '…' : String(goals.length),
      detail: 'Total goals tracked',
    },
    {
      label: 'Tasks done',
      value: loading ? '…' : `${completedTasks}/${totalTasks}`,
      detail: 'Completed vs total linked tasks',
    },
    {
      label: 'Progress',
      value: loading ? '…' : `${overallProgress}%`,
      detail: 'Overall weighted progress',
    },
    {
      label: 'Effort',
      value: loading ? '…' : `${completedEffort}/${totalEffort}`,
      detail: 'Effort points completed',
    },
  ] as const;

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status filter pills */}
      <div className="flex overflow-hidden rounded-full border border-slate-200 bg-black/3">
        {(
          [
            { key: 'all', label: 'All', count: counts.all },
            { key: 'active', label: 'Active', count: counts.active },
            { key: 'at-risk', label: 'At Risk', count: counts.atRisk },
            { key: 'completed', label: 'Done', count: counts.completed },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={[
              'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition',
              filter === tab.key
                ? 'bg-sky-100 text-sky-700'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] leading-none">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sort select */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="rounded-full border border-slate-200 bg-black/3 px-3 py-2 text-xs text-slate-800 transition focus:border-sky-500/50 focus-visible:outline-none"
      >
        <option value="priority">Sort: Priority</option>
        <option value="progress">Sort: Progress</option>
        <option value="eta">Sort: ETA</option>
      </select>

      {/* Quick actions */}
      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        className="rounded-full border border-slate-200 bg-black/3 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-800 transition hover:bg-black/5 disabled:opacity-50"
      >
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>

      {/* API status badge */}
      <span
        className={[
          'rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]',
          apiStatus === 'online'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-700',
        ].join(' ')}
      >
        {apiStatus === 'online' ? 'API online' : 'API offline'}
      </span>
    </div>
  );

  return (
    <WorkspaceScaffold
      title="Goals"
      subtitle="Track progress across all goals and linked tasks."
      actions={toolbar}
      summaryItems={summaryItems}
      primaryTitle="Goal List"
      primarySubtitle={`Showing ${sortedGoals.length} of ${goals.length} goals.`}
      primary={
        <div className="space-y-4">
          {error && (
            <div
              className="flex items-center justify-between rounded-[18px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700"
              role="alert"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={refresh}
                className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 transition hover:bg-amber-200"
              >
                Retry
              </button>
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-[22px] border border-slate-200 bg-black/3"
                />
              ))}
            </div>
          )}

          {!loading && sortedGoals.length === 0 && (
            <EmptyState
              title={
                filter !== 'all' ? `No ${filter} goals.` : 'No goals found.'
              }
              description={
                filter !== 'all'
                  ? 'Try switching the filter to All.'
                  : 'Create goals in your vault to track progress here.'
              }
            />
          )}

          {!loading && sortedGoals.length > 0 && (
            <div className="space-y-4">
              {sortedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal as Parameters<typeof GoalCard>[0]['goal']}
                />
              ))}
            </div>
          )}
        </div>
      }
      asideTitle="Quick Actions"
      asideSubtitle="Navigate and manage goals."
      aside={
        <div className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-black/3 p-4 space-y-3">
            <Link
              to="/"
              search={{ q: undefined, collection: undefined }}
              className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-black/3 px-4 py-3 text-sm text-slate-800 transition hover:bg-black/5"
            >
              <span>Open Tasks</span>
            </Link>
            <button
              type="button"
              onClick={() => dispatchNavOverlay('avatar')}
              className="flex w-full items-center gap-3 rounded-[14px] border border-slate-200 bg-black/3 px-4 py-3 text-sm text-slate-800 transition hover:bg-black/5"
            >
              Avatar Dashboard
            </button>
            <button
              type="button"
              onClick={() => setFilter('active')}
              className="flex w-full items-center gap-3 rounded-[14px] border border-slate-200 bg-black/3 px-4 py-3 text-sm text-slate-800 transition hover:bg-black/5"
            >
              Show Active Goals
            </button>
            <Link
              to="/note"
              search={{ p: 'goals' }}
              className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-black/3 px-4 py-3 text-sm text-slate-800 transition hover:bg-black/5"
            >
              Browse Goals Folder
            </Link>
          </div>

          {updatedAt && (
            <p className="text-xs text-slate-500 px-1">
              Last updated: {new Date(updatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      }
    />
  );
}
