import React, { useState } from "react";
import useCODStatus from "../hooks/useCODStatus";

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Status badge for collapsed view
 */
function CODStatusBadge({ status, onClick }) {
  const emoji = status === "PASS" ? "✅" : status === "WARN" ? "⚠️" : "❌";
  const className = `cod-badge cod-badge--${status.toLowerCase()}`;

  return (
    <button className={className} onClick={onClick} title="Expand COD Status">
      {emoji} COD
    </button>
  );
}

/**
 * Progress bar component
 */
function ProgressBar({ value, max = 100, color = "accent", label }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="cod-progress">
      <div className="cod-progress__label">{label}</div>
      <div className="cod-progress__track">
        <div
          className={`cod-progress__fill cod-progress__fill--${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="cod-progress__value">{Math.round(value)}%</div>
    </div>
  );
}

/**
 * Validation section
 */
function ValidationSection({ validation }) {
  const emoji = validation.status === "PASS" ? "✅" : validation.status === "WARN" ? "⚠️" : "❌";
  const timeAgo = validation.lastChecked
    ? formatTimeAgo(new Date(validation.lastChecked))
    : "never";

  return (
    <div className="cod-section">
      <div className="cod-section__header">
        <span className="cod-section__title">
          {emoji} COD Validation: {validation.status}
        </span>
      </div>
      {validation.warnings.length > 0 && (
        <ul className="cod-warning-list">
          {validation.warnings.map((warning, i) => (
            <li key={i} className="cod-warning-item">• {warning}</li>
          ))}
        </ul>
      )}
      <div className="cod-section__footer">Last checked: {timeAgo}</div>
    </div>
  );
}

/**
 * Human state section with vitals
 */
function HumanStateSection({ state }) {
  const focusLabel = state.focusCapacity === "high" ? "High" :
                     state.focusCapacity === "med" ? "Med" : "Low";
  const sourceTime = state.timestamp
    ? new Date(state.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div className="cod-section">
      <div className="cod-section__header">
        <span className="cod-section__title">Human State ({state.source || "snapshot"} {sourceTime})</span>
      </div>
      <div className="cod-vitals">
        <ProgressBar
          value={state.energy}
          label="⚡ Energy"
          color={state.energy < 40 ? "danger" : state.energy < 60 ? "warning" : "success"}
        />
        <div className="cod-vital-row">
          <span className="cod-vital-label">🎯 Focus</span>
          <span className={`cod-vital-value cod-vital-value--${state.focusCapacity}`}>
            {focusLabel}
          </span>
        </div>
        <ProgressBar
          value={state.stress}
          label="😰 Stress"
          color={state.stress > 70 ? "danger" : state.stress > 50 ? "warning" : "success"}
        />
        <ProgressBar
          value={state.sleepDebt * 10} // Scale hours to percentage (10h = 100%)
          max={100}
          label="😴 Sleep Debt"
          color={state.sleepDebt > 2 ? "danger" : state.sleepDebt > 1 ? "warning" : "success"}
        />
        <div className="cod-vital-row">
          <span className="cod-vital-label">⏱️ Time Available</span>
          <span className="cod-vital-value">{state.timeAvailableMin} min</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Active session section
 */
function SessionSection({ session }) {
  const startTime = new Date(session.startedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const completedTasks = session.tasks?.filter((t) => t.status === "done").length || 0;
  const totalTasks = session.tasks?.length || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const elapsed = Date.now() - new Date(session.startedAt).getTime();
  const elapsedMin = Math.floor(elapsed / 60000);
  const remaining = Math.max(0, session.budgetMin - elapsedMin);

  return (
    <div className="cod-section">
      <div className="cod-section__header">
        <span className="cod-section__title">🎯 Active Session</span>
        <span className="cod-section__meta">
          Started: {startTime} | Budget: {session.budgetMin} min
        </span>
      </div>
      {session.tasks && session.tasks.length > 0 && (
        <ul className="cod-task-list">
          {session.tasks.map((task, i) => {
            const icon = task.status === "done" ? "✅" :
                         task.status === "in_progress" ? "🔄" : "⬜";
            return (
              <li key={i} className={`cod-task-item cod-task-item--${task.status}`}>
                {icon} {task.title} {task.estimatedMin && `(${task.estimatedMin} min)`}
              </li>
            );
          })}
        </ul>
      )}
      <div className="cod-section__footer">
        Progress: {progressPercent}% | ~{remaining} min remaining
      </div>
    </div>
  );
}

/**
 * Warnings section
 */
function WarningsSection({ warnings }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="cod-section cod-section--warnings">
      <div className="cod-section__header">
        <span className="cod-section__title">🚨 Active Warnings</span>
      </div>
      <ul className="cod-warning-list">
        {warnings.map((warning, i) => (
          <li key={i} className="cod-warning-item">• {warning}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * COD Status Panel - displays Cognitive Operating Discipline state
 */
export function CODStatusPanel({ collapsed: initialCollapsed = true, staticData = null }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const { validation, humanState, session, warnings, loading, error, refresh } = useCODStatus(staticData);

  const handleToggle = () => setCollapsed(!collapsed);

  if (collapsed) {
    return <CODStatusBadge status={validation.status} onClick={handleToggle} />;
  }

  return (
    <div className="cod-panel">
      <div className="cod-panel__header">
        <h2 className="cod-panel__title">COD Status</h2>
        <div className="cod-panel__actions">
          <button
            className="cod-button cod-button--icon"
            onClick={refresh}
            disabled={loading}
            title="Refresh"
          >
            {loading ? "⏳" : "🔄"}
          </button>
          <button
            className="cod-button cod-button--icon"
            onClick={handleToggle}
            title="Collapse"
          >
            ➖
          </button>
        </div>
      </div>

      {error && (
        <div className="cod-error">
          ⚠️ API Error: {error}
        </div>
      )}

      <ValidationSection validation={validation} />
      <HumanStateSection state={humanState} />
      {session && <SessionSection session={session} />}
      {warnings.length > 0 && <WarningsSection warnings={warnings} />}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export default CODStatusPanel;
