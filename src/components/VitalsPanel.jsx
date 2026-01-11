import React from "react";

/**
 * Progress bar for vitals with color thresholds
 */
function VitalBar({ value, label, icon, inverted = false }) {
  // For inverted metrics like stress, high is bad
  const displayValue = inverted ? 100 - value : value;
  const effectiveValue = inverted ? 100 - value : value;
  
  let color = "success";
  if (effectiveValue < 40) color = "danger";
  else if (effectiveValue < 60) color = "warning";

  return (
    <div className="avatar-vital">
      <div className="avatar-vital__header">
        <span className="avatar-vital__icon">{icon}</span>
        <span className="avatar-vital__label">{label}</span>
        <span className="avatar-vital__value">{value}%</span>
      </div>
      <div className="avatar-vital__track">
        <div
          className={`avatar-vital__fill avatar-vital__fill--${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Needs mini-bars (sleep, social, food)
 */
function NeedsGrid({ needs }) {
  const needsData = [
    { key: "sleep", icon: "😴", label: "Sleep" },
    { key: "social", icon: "👥", label: "Social" },
    { key: "food", icon: "🍽️", label: "Food" },
  ];

  return (
    <div className="avatar-needs">
      {needsData.map(({ key, icon, label }) => (
        <div key={key} className="avatar-need">
          <span className="avatar-need__icon">{icon}</span>
          <div className="avatar-need__bar">
            <div
              className="avatar-need__fill"
              style={{ width: `${needs[key] || 50}%` }}
            />
          </div>
          <span className="avatar-need__value">{needs[key] || 50}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Vitals Panel - displays health, energy, stress and needs
 */
export function VitalsPanel({ vitals }) {
  return (
    <div className="avatar-section">
      <div className="avatar-section__header">
        <h3 className="avatar-section__title">Vitals</h3>
        <span className="avatar-section__badge">{vitals.rank || "Unranked"}</span>
      </div>

      <div className="avatar-vitals-grid">
        <VitalBar value={vitals.health || 50} label="Health" icon="❤️" />
        <VitalBar value={vitals.energy || 50} label="Energy" icon="⚡" />
        <VitalBar value={vitals.stress || 50} label="Stress" icon="😰" inverted />
      </div>

      <div className="avatar-section__divider" />

      <div className="avatar-stats-row">
        <div className="avatar-stat">
          <span className="avatar-stat__value">{vitals.tasksCompletedToday || 0}</span>
          <span className="avatar-stat__label">Tasks Today</span>
        </div>
        <div className="avatar-stat">
          <span className="avatar-stat__value">{vitals.tasksCompletedThisWeek || 0}</span>
          <span className="avatar-stat__label">This Week</span>
        </div>
        <div className="avatar-stat">
          <span className="avatar-stat__value">{vitals.sessionsCompletedThisWeek || vitals.activeSessions || 0}</span>
          <span className="avatar-stat__label">Sessions</span>
        </div>
        {vitals.money !== undefined && (
          <div className="avatar-stat">
            <span className="avatar-stat__value">{vitals.money}</span>
            <span className="avatar-stat__label">Money</span>
          </div>
        )}
        {vitals.notoriety !== undefined && (
          <div className="avatar-stat">
            <span className="avatar-stat__value">{vitals.notoriety}</span>
            <span className="avatar-stat__label">Notoriety</span>
          </div>
        )}
      </div>

      {/* Additional Stats Row */}
      {(vitals.totalTasksCompleted > 0 || vitals.totalSessions > 0) && (
        <>
          <div className="avatar-section__divider" />
          <div className="avatar-stats-row avatar-stats-row--secondary">
            <div className="avatar-stat avatar-stat--small">
              <span className="avatar-stat__value">{vitals.totalTasksCompleted || 0}</span>
              <span className="avatar-stat__label">Total Completed</span>
            </div>
            <div className="avatar-stat avatar-stat--small">
              <span className="avatar-stat__value">{vitals.totalSessions || 0}</span>
              <span className="avatar-stat__label">Total Sessions</span>
            </div>
            <div className="avatar-stat avatar-stat--small">
              <span className="avatar-stat__value">{vitals.activeSessions || 0}</span>
              <span className="avatar-stat__label">Active</span>
            </div>
          </div>
        </>
      )}

      {vitals.needs && (
        <>
          <div className="avatar-section__divider" />
          <h4 className="avatar-subsection__title">Needs</h4>
          <NeedsGrid needs={vitals.needs} />
        </>
      )}
    </div>
  );
}

export default VitalsPanel;
