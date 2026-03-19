import React, { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useGoals } from '../../src/hooks/useGoals';
import GoalCard from '../../src/components/GoalCard';
import { computeCounts, filterGoals, sortGoals, computeSummary } from '../../src/lib/goals-logic';

interface FilterTabsProps {
  filter: string;
  setFilter: (filter: string) => void;
  counts: {
    all: number;
    active: number;
    atRisk: number;
    completed: number;
  };
}

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

interface GoalsSummaryProps {
  goals: Goal[];
}

export const Route = createFileRoute('/goals')({
  component: GoalsRoute,
})

/**
 * Filter tabs for goal status
 */
function FilterTabs({ filter, setFilter, counts }: FilterTabsProps) {
  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'at-risk', label: 'At Risk', count: counts.atRisk },
    { key: 'completed', label: 'Completed', count: counts.completed },
  ];
  
  return (
    <div className="goals-filters">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`goals-filter ${filter === tab.key ? 'goals-filter--active' : ''}`}
          onClick={() => setFilter(tab.key)}
        >
          {tab.label}
          {tab.count > 0 && <span className="goals-filter__count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * Summary stats panel
 */
function GoalsSummary({ goals }: GoalsSummaryProps) {
  const { totalTasks, completedTasks, totalEffort, completedEffort, overallProgress } = computeSummary(goals as Parameters<typeof computeSummary>[0]);
  
  return (
    <div className="goals-summary">
      <div className="goals-summary__stat">
        <div className="goals-summary__value">{goals.length}</div>
        <div className="goals-summary__label">Goals</div>
      </div>
      <div className="goals-summary__stat">
        <div className="goals-summary__value">{completedTasks}/{totalTasks}</div>
        <div className="goals-summary__label">Tasks Done</div>
      </div>
      <div className="goals-summary__stat">
        <div className="goals-summary__value">{overallProgress}%</div>
        <div className="goals-summary__label">Overall Progress</div>
      </div>
      <div className="goals-summary__stat">
        <div className="goals-summary__value">{completedEffort}/{totalEffort}</div>
        <div className="goals-summary__label">Effort Complete</div>
      </div>
    </div>
  );
}

/**
 * Goals page component
 */
function GoalsRoute() {
  const { goals, loading, error, refresh, apiStatus, updatedAt } = useGoals();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority'); // priority, progress, eta
  
  // Calculate filter counts
  const counts = computeCounts(goals as Parameters<typeof computeCounts>[0]);
  
  // Apply filter
  const filteredGoals = filterGoals(goals as Parameters<typeof filterGoals>[0], filter);
  
  // Apply sort
  const sortedGoals = sortGoals(filteredGoals, sortBy);

  return (
    <main className="page goals-page">
      <nav className="breadcrumb">
        <Link to="/" search={{ q: undefined, collection: undefined }} className="back-link">← Home</Link>
      </nav>
      
      <header className="page-header">
        <h1>🎯 Goal Progress</h1>
        <p className="lede">
          Track progress across all your goals and linked tasks. Data refreshes from Tasker API.
          <span className={`api-badge api-badge--${apiStatus}`} style={{ marginLeft: 8 }}>
            {apiStatus === 'online' ? 'API online' : apiStatus === 'offline' ? 'API offline' : 'API'}
          </span>
        </p>
        <div className="quick-links" style={{ marginTop: 12, paddingTop: 12 }}>
          <Link
            to="/"
            search={{ q: undefined, collection: undefined }}
            className="quick-link quick-link--primary"
            title="Open tasks filtered by goal tags"
          >
            <span className="quick-link__icon">📋</span>
            <span className="quick-link__label">Open Tasks</span>
          </Link>
          <Link to="/avatar" className="quick-link" title="See avatar stats and goal impact">
            <span className="quick-link__icon">🧙</span>
            <span className="quick-link__label">Avatar Dashboard</span>
          </Link>
          <button className="quick-link" onClick={refresh} title="Refresh from Tasker API">
            <span className="quick-link__icon">🔄</span>
            <span className="quick-link__label">{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
          <button
            className="quick-link quick-link--primary"
            onClick={() => setFilter('active')}
            title="Focus on active goals"
          >
            <span className="quick-link__icon">🎯</span>
            <span className="quick-link__label">Show Active</span>
          </button>
          <button
            className="quick-link"
            onClick={() => setSortBy('progress')}
            title="Sort by most progress"
          >
            <span className="quick-link__icon">📈</span>
            <span className="quick-link__label">Sort by Progress</span>
          </button>
        </div>
      </header>
      
      {error && (
        <div className="goals-error">
          <span>⚠️ {error}</span>
          <button className="goals-retry" onClick={refresh}>Retry</button>
        </div>
      )}
      
      {loading ? (
        <div className="goals-loading">
          <div className="goals-loading__spinner" />
          <span>Loading goals...</span>
        </div>
      ) : (
        <div className="goals-dashboard">
          <GoalsSummary goals={goals as Goal[]} />
          
          <div className="goals-toolbar">
            <FilterTabs filter={filter} setFilter={setFilter} counts={counts} />
            
            <div className="goals-sort">
              <label htmlFor="goal-sort">Sort by:</label>
              <select 
                id="goal-sort"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="priority">Priority</option>
                <option value="progress">Progress</option>
                <option value="eta">ETA</option>
              </select>
            </div>
          </div>
          
          {sortedGoals.length === 0 ? (
            <div className="goals-empty">
              <div className="goals-empty__icon">🎯</div>
              <h3 className="goals-empty__title">No goals found</h3>
              <p className="goals-empty__text">
                {filter !== 'all' 
                  ? `No ${filter} goals match your criteria.` 
                  : 'Create goals in your vault to track progress here.'}
              </p>
              <div className="goals-empty__actions">
                {filter !== 'all' && (
                  <button className="goals-empty__btn" onClick={() => setFilter('all')}>
                    Show all goals
                  </button>
                )}
                <Link
                  to="/note"
                  search={{ p: 'goals' }}
                  className="goals-empty__btn goals-empty__btn--primary"
                >
                  📂 Browse Goals Folder
                </Link>
              </div>
            </div>
          ) : (
            <div className="goals-list">
              {sortedGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal as Parameters<typeof GoalCard>[0]['goal']} />
              ))}
            </div>
          )}
          
          <footer className="goals-footer">
            <span>
              Last updated: {updatedAt ? new Date(updatedAt).toLocaleTimeString() : '—'}
            </span>
            <button className="goals-refresh" onClick={refresh}>
              🔄 Refresh
            </button>
          </footer>
        </div>
      )}
    </main>
  );
}
