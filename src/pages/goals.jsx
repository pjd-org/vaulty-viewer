import React, { useState } from 'react';
import { useGoals } from '../hooks/useGoals';
import GoalCard from '../components/GoalCard';
import Navbar from '../components/Navbar';
import { computeCounts, filterGoals, sortGoals, computeSummary } from './goals-logic';

/**
 * Filter tabs for goal status
 */
function FilterTabs({ filter, setFilter, counts }) {
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
function GoalsSummary({ goals }) {
  const { totalTasks, completedTasks, totalEffort, completedEffort, overallProgress } = computeSummary(goals);
  
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
export default function GoalsPage() {
  const { goals, loading, error, refresh, apiStatus, updatedAt } = useGoals();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority'); // priority, progress, eta
  
  // Calculate filter counts
  const counts = computeCounts(goals);
  
  // Apply filter
  const filteredGoals = filterGoals(goals, filter);
  
  // Apply sort
  const sortedGoals = sortGoals(filteredGoals, sortBy);

  return (
    <main className="page goals-page">
      <Navbar apiStatus={apiStatus} />
      <nav className="breadcrumb">
        <a href="/" className="back-link">← Home</a>
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
          <a href="/" className="quick-link quick-link--primary" title="Open tasks filtered by goal tags">
            <span className="quick-link__icon">📋</span>
            <span className="quick-link__label">Open Tasks</span>
          </a>
          <a href="/avatar" className="quick-link" title="See avatar stats and goal impact">
            <span className="quick-link__icon">🧙</span>
            <span className="quick-link__label">Avatar Dashboard</span>
          </a>
          <button className="quick-link" onClick={refresh} title="Refresh from Tasker API">
            <span className="quick-link__icon">🔄</span>
            <span className="quick-link__label">{loading ? 'Refreshing…' : 'Refresh'}</span>
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
          <GoalsSummary goals={goals} />
          
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
              <p>No goals found matching the filter.</p>
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')}>Show all goals</button>
              )}
            </div>
          ) : (
            <div className="goals-list">
              {sortedGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
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
