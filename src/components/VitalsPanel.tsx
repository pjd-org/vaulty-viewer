import React from "react";

interface MoneyObject {
  default_currency?: string;
  defaultCurrency?: string;
  balances?: Record<string, number>;
}

interface Needs {
  sleep?: number;
  social?: number;
  food?: number;
}

interface Vitals {
  health?: number;
  energy?: number;
  stress?: number;
  rank?: string;
  tasksCompletedToday?: number;
  tasksCompletedThisWeek?: number;
  sessionsCompletedThisWeek?: number;
  activeSessions?: number;
  totalTasksCompleted?: number;
  totalSessions?: number;
  money?: number | MoneyObject;
  notoriety?: number;
  needs?: Needs;
}

interface VitalsPanelProps {
  vitals: Vitals;
}

interface VitalBarProps {
  value: number;
  label: string;
  icon: string;
  inverted?: boolean;
}

interface NeedsGridProps {
  needs: Needs;
}

function formatMoney(money: number | MoneyObject | undefined): string | number {
  if (money === undefined || money === null) return "—";
  if (typeof money === "number") return money;
  if (typeof money === "object") {
    const cur = money.default_currency || money.defaultCurrency;
    if (cur && money.balances && typeof money.balances[cur] !== "undefined") {
      return `${cur} ${money.balances[cur]}`;
    }
    const first = money.balances && Object.entries(money.balances)[0];
    if (first) return `${first[0]} ${first[1]}`;
  }
  return "—";
}

/**
 * Progress bar for vitals with color thresholds
 */
function VitalBar({ value, label, icon, inverted = false }: VitalBarProps) {
  // For inverted metrics like stress, high is bad
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
function NeedsGrid({ needs }: NeedsGridProps) {
  const needsData = [
    { key: "sleep" as const, icon: "😴", label: "Sleep" },
    { key: "social" as const, icon: "👥", label: "Social" },
    { key: "food" as const, icon: "🍽️", label: "Food" },
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
export function VitalsPanel({ vitals }: VitalsPanelProps) {
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
            <span className="avatar-stat__value">{formatMoney(vitals.money)}</span>
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
      {((vitals.totalTasksCompleted || 0) > 0 || (vitals.totalSessions || 0) > 0) && (
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
