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
import { SegmentedControl } from '../components/ui/Controls';

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
      <SegmentedControl
        value={filter}
        onChange={(v) => setFilter(v as typeof filter)}
        options={[
          { value: 'all', label: 'All', badge: counts.all },
          { value: 'active', label: 'Active', badge: counts.active },
          { value: 'at-risk', label: 'At Risk', badge: counts.atRisk },
          { value: 'completed', label: 'Done', badge: counts.completed },
        ]}
      />

      {/* Sort select */}
      <select
        aria-label="Sort goals"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="rounded-full border border-border bg-muted/40 px-3 py-2 text-xs text-foreground transition cursor-pointer focus:border-primary focus-visible:outline-none"
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
        className="rounded-full border border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:bg-muted/60 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>

      {/* API status badge */}
      <span
        className={[
          'rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]',
          apiStatus === 'online'
            ? 'bg-success/10 text-success'
            : 'bg-destructive/10 text-destructive',
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
        <div className="flex flex-col gap-4">
          {error && (
            <div
              className="flex items-center justify-between rounded-[18px] border border-warning/30 bg-warning/10 p-4 text-sm text-warning"
              role="alert"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={refresh}
                className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-warning transition hover:bg-warning/20 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-[22px] border border-border bg-muted/40"
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
            <div className="flex flex-col gap-4">
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-[22px] border border-border bg-muted/40 p-4">
            <Link
              to="/"
              search={{ q: undefined, collection: undefined }}
              className="flex items-center gap-3 rounded-[14px] border border-border bg-muted/40 px-4 py-3 text-sm text-foreground transition hover:bg-muted/60"
            >
              <span>Open Tasks</span>
            </Link>
            <button
              type="button"
              onClick={() => dispatchNavOverlay('avatar')}
              className="flex w-full items-center gap-3 rounded-[14px] border border-border bg-muted/40 px-4 py-3 text-sm text-foreground transition hover:bg-muted/60 cursor-pointer"
            >
              Avatar Dashboard
            </button>
            <button
              type="button"
              onClick={() => setFilter('active')}
              className="flex w-full items-center gap-3 rounded-[14px] border border-border bg-muted/40 px-4 py-3 text-sm text-foreground transition hover:bg-muted/60 cursor-pointer"
            >
              Show Active Goals
            </button>
            <Link
              to="/note"
              search={{ p: 'goals' }}
              className="flex items-center gap-3 rounded-[14px] border border-border bg-muted/40 px-4 py-3 text-sm text-foreground transition hover:bg-muted/60"
            >
              Browse Goals Folder
            </Link>
          </div>

          {updatedAt && (
            <p className="px-1 text-xs text-muted-foreground">
              Last updated: {new Date(updatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      }
    />
  );
}
