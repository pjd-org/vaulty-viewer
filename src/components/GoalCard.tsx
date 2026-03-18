import React, { useState } from 'react';
import getApiBase from '../utils/api';

interface GoalStats {
  total: number;
  completed: number;
  totalEffort?: number;
  completedEffort?: number;
  blocked?: number;
}

interface GoalTask {
  id?: string;
  path?: string;
  title: string;
  status: string;
  effortScore?: number;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  status: string;
  stats: GoalStats;
  tasks: GoalTask[];
  targetDate?: string;
  eta?: string;
  priority?: number;
}

interface GoalCardProps {
  goal: Goal;
}

interface StatusBadgeProps {
  status: string;
}

interface ProgressBarProps {
  percent: number;
  status: string;
}

interface TaskItemProps {
  task: GoalTask;
}

/**
 * Status badge component
 */
function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { emoji: string; label: string; className: string }> = {
    'on-track': { emoji: '🟢', label: 'On Track', className: 'goal-badge--success' },
    'at-risk': { emoji: '🟡', label: 'At Risk', className: 'goal-badge--warning' },
    'behind': { emoji: '🔴', label: 'Behind', className: 'goal-badge--danger' },
    'blocked': { emoji: '⬛', label: 'Blocked', className: 'goal-badge--blocked' },
    'completed': { emoji: '✅', label: 'Complete', className: 'goal-badge--complete' },
  };
  
  const { emoji, label, className } = config[status] || config['on-track'];
  
  return (
    <span className={`goal-badge ${className}`}>
      {emoji} {label}
    </span>
  );
}

/**
 * Progress bar component
 */
function ProgressBar({ percent, status }: ProgressBarProps) {
  const statusClass: Record<string, string> = {
    'on-track': 'goal-progress__fill--success',
    'at-risk': 'goal-progress__fill--warning',
    'behind': 'goal-progress__fill--danger',
    'blocked': 'goal-progress__fill--blocked',
    'completed': 'goal-progress__fill--complete',
  };
  
  return (
    <div className="goal-progress">
      <div className="goal-progress__track">
        <div 
          className={`goal-progress__fill ${statusClass[status] || 'goal-progress__fill--success'}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="goal-progress__label">{percent}%</span>
    </div>
  );
}

/**
 * Task item in the expanded list
 */
function TaskItem({ task }: TaskItemProps) {
  const statusIcon: Record<string, string> = {
    'completed': '✅',
    'in-progress': '🔄',
    'blocked': '🚫',
    'todo': '⬜',
  };
  
  return (
    <div className={`goal-task goal-task--${task.status}`}>
      <span className="goal-task__icon">{statusIcon[task.status] || '⬜'}</span>
      <span className="goal-task__title">{task.title}</span>
      {task.effortScore && (
        <span className="goal-task__effort" title="Effort score">
          {task.effortScore}⚡
        </span>
      )}
    </div>
  );
}

/**
 * Format a date for display
 */
function formatDate(isoString: string | undefined): string | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Goal card component - displays a goal with progress and expandable task list
 */
export function GoalCard({ goal }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  
  const { 
    title, 
    progress, 
    status, 
    stats, 
    tasks, 
    targetDate, 
    eta,
    priority,
  } = goal;
  const goalNotePath = `/note?p=${encodeURIComponent(`goals/${goal.id}`)}`;
  const hasTasks = Array.isArray(tasks) && tasks.length > 0;
  const firstTaskPath = hasTasks && tasks.find((t) => t.path)?.path;

  const submitReview = async (decision = 'approve') => {
    if (!firstTaskPath) return;
    setReviewBusy(true);
    setReviewMsg(null);
    try {
      const apiUrl = getApiBase();
      const body = {
        path: firstTaskPath,
        addHistoryNote: `Goal review (${decision}) for ${goal.id}`,
        frontmatterPatch: {
          review_status: decision,
          review_updated: new Date().toISOString(),
        },
      };
      const res = await fetch(`${apiUrl}/api/v1/tools/obsidian_update_task/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      setReviewMsg('Review sent to Tasker API');
    } catch (err) {
      setReviewMsg(`Review failed: ${(err as Error).message}`);
    } finally {
      setReviewBusy(false);
    }
  };
  
  return (
    <div className={`goal-card goal-card--${status}`}>
      <div 
        className="goal-card__header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        <div className="goal-card__title-row">
          <h3 className="goal-card__title">🎯 {title}</h3>
          <StatusBadge status={status} />
        </div>
        
        <ProgressBar percent={progress} status={status} />
        
        <div className="goal-card__stats">
          <span className="goal-card__stat">
            {stats.completed}/{stats.total} tasks
          </span>
          {eta && status !== 'completed' && (
            <span className="goal-card__stat">
              ETA: {formatDate(eta)}
            </span>
          )}
          {targetDate && (
            <span className="goal-card__stat">
              Target: {formatDate(targetDate)}
            </span>
          )}
          {priority && priority > 0 && (
            <span className="goal-card__stat goal-card__stat--priority">
              P{priority}
            </span>
          )}
        </div>
        
        <span className="goal-card__expand">
          {expanded ? '▼' : '▶'}
        </span>
      </div>
      
      {expanded && (
        <div className="goal-card__details">
          <div className="goal-card__actions">
            <a href={goalNotePath} className="goal-card__link">Open goal note</a>
            {firstTaskPath && (
              <a
                href={`/note?p=${encodeURIComponent(firstTaskPath.replace(/\.md$/, ''))}`}
                className="goal-card__link"
              >
                View task
              </a>
            )}
            <div className="goal-card__review">
              <button
                className="goal-card__review-btn"
                onClick={() => submitReview('approve')}
                disabled={reviewBusy || !firstTaskPath}
              >
                ✅ Approve
              </button>
              <button
                className="goal-card__review-btn goal-card__review-btn--warn"
                onClick={() => submitReview('needs_changes')}
                disabled={reviewBusy || !firstTaskPath}
              >
                ✋ Needs changes
              </button>
              {reviewMsg && <span className="goal-card__review-msg">{reviewMsg}</span>}
            </div>
          </div>
          <div className="goal-card__effort">
            <span>Effort: {stats.completedEffort}/{stats.totalEffort} completed</span>
            {stats.blocked && stats.blocked > 0 && (
              <span className="goal-card__blocked">
                {stats.blocked} blocked
              </span>
            )}
          </div>
          
          <div className="goal-card__tasks">
            <div className="goal-card__tasks-header">Tasks</div>
            {tasks.map((task) => (
              <TaskItem key={task.id || task.path} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GoalCard;
