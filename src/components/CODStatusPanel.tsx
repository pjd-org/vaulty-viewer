import React, { useState } from "react";
import useCODStatus from "../hooks/useCODStatus";
import type { CODHumanStateFormData } from "../hooks/useCODStatus";
import HumanStateForm from "./HumanStateForm";
import { useNavigate } from "@tanstack/react-router";

// ============================================================================
// Types
// ============================================================================

interface Validation {
  status: 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN';
  lastChecked?: string | null;
}

interface HumanState {
  energy: number;
  focusCapacity: 'low' | 'med' | 'high' | 'unknown';
  stress: number;
  sleepDebt: number;
  timeAvailableMin: number;
}

interface SessionTask {
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  estimatedMin?: number;
}

interface Session {
  id?: string;
  startedAt: string;
  budgetMin: number;
  tasks?: SessionTask[];
}

interface AvatarVitals {
  money?: {
    default_currency?: string;
    balances?: Record<string, number>;
    forms?: Record<string, number | string>;
  };
  notoriety?: number;
  health?: number;
}

interface CODStatusBadgeProps {
  status: string;
  onClick: () => void;
}

interface ValidationCardProps {
  validation: Validation;
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  label: string;
  showValue?: boolean;
}

interface HumanStateSectionProps {
  state: HumanState;
  onEdit: () => void;
}

interface SessionSectionProps {
  session: Session;
  onEnd?: () => void;
  onAbort?: () => void;
}

interface WarningsSectionProps {
  warnings: string[];
}

interface CODStatusPanelProps {
  collapsed?: boolean;
  staticData?: unknown;
}

// ============================================================================
// Sub-components - Raycast Wrapped Style
// ============================================================================

/**
 * Status badge for collapsed view
 */
function CODStatusBadge({ status, onClick }: CODStatusBadgeProps) {
  const className = `cod-badge cod-badge--${status.toLowerCase()}`;
  const label = status === "PASS" ? "✓ PASS" : status === "WARN" ? "⚡ WARN" : "✕ FAIL";

  return (
    <button className={className} onClick={onClick} title="Expand COD Status">
      {label}
    </button>
  );
}

/**
 * Validation card with glow effect
 */
function ValidationCard({ validation }: ValidationCardProps) {
  const statusClass = validation.status.toLowerCase();
  const icon = validation.status === "PASS" ? "✓" : validation.status === "WARN" ? "⚡" : "✕";
  const timeAgo = validation.lastChecked
    ? formatTimeAgo(new Date(validation.lastChecked))
    : "—";

  return (
    <div className={`cod-validation-card cod-validation-card--${statusClass}`}>
      <div className="cod-validation-card__icon">{icon}</div>
      <div className="cod-validation-card__status">{validation.status}</div>
      <div className="cod-section__footer">Checked {timeAgo}</div>
    </div>
  );
}

/**
 * Progress bar component - bar chart style
 */
function ProgressBar({ value, max = 100, color = "accent", label, showValue = true }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="cod-progress">
      <div className="cod-progress__header">
        <span className="cod-progress__label">{label}</span>
        {showValue && <span className="cod-progress__value">{Math.round(value)}%</span>}
      </div>
      <div className="cod-progress__track">
        <div
          className={`cod-progress__fill cod-progress__fill--${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Human state section with vitals
 */
function HumanStateSection({ state, onEdit }: HumanStateSectionProps) {
  const focusLabel = state.focusCapacity === "high" ? "High" :
                     state.focusCapacity === "med" ? "Med" : "Low";

  return (
    <div className="cod-section">
      <div className="cod-section__header">
        <span className="cod-section__title">Human State</span>
        <button
          className="cod-button cod-button--small"
          onClick={onEdit}
          title="Update Human State"
        >
          ✏️ Check-in
        </button>
      </div>
      <div className="cod-vitals">
        <ProgressBar
          value={state.energy * 100}
          label="⚡ Energy"
          color={state.energy < 0.40 ? "danger" : state.energy < 0.60 ? "warning" : "success"}
        />
        <ProgressBar
          value={(1 - state.stress) * 100}
          label="🧘 Calm"
          color={state.stress > 0.70 ? "danger" : state.stress > 0.50 ? "warning" : "success"}
        />
        <ProgressBar
          value={Math.max(0, 100 - state.sleepDebt * 20)}
          label="😴 Rest"
          color={state.sleepDebt > 2 ? "danger" : state.sleepDebt > 1 ? "warning" : "success"}
        />
        <div className="cod-vital-row">
          <span className="cod-vital-label">🎯 Focus Capacity</span>
          <span className={`cod-vital-value cod-vital-value--${state.focusCapacity}`}>
            {focusLabel}
          </span>
        </div>
        <div className="cod-vital-row">
          <span className="cod-vital-label">⏱️ Time Budget</span>
          <span className="cod-vital-value">{state.timeAvailableMin} min</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Active session section
 */
function SessionSection({ session, onEnd, onAbort }: SessionSectionProps) {
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
        <span className="cod-section__title">Active Session</span>
        <div className="cod-section__actions">
          {onEnd && (
            <button
              className="cod-button cod-button--small cod-button--success"
              onClick={onEnd}
              title="Complete Session"
            >
              ✓ Done
            </button>
          )}
          {onAbort && (
            <button
              className="cod-button cod-button--small cod-button--danger"
              onClick={onAbort}
              title="Abort Session"
            >
              ✕ Abort
            </button>
          )}
        </div>
      </div>
      <div className="cod-section__meta">
        {startTime} • {session.budgetMin} min budget
      </div>
      
      {/* Big progress stat */}
      <div className="cod-stat-big">
        <div className="cod-stat-big__value">{progressPercent}%</div>
        <div className="cod-stat-big__label">Session Progress</div>
      </div>

      {session.tasks && session.tasks.length > 0 && (
        <ul className="cod-task-list">
          {session.tasks.map((task, i) => {
            const icon = task.status === "done" ? "✓" :
                         task.status === "in_progress" ? "◐" : "○";
            return (
              <li key={i} className={`cod-task-item cod-task-item--${task.status}`}>
                <span className="cod-task-item__icon">{icon}</span>
                <span className="cod-task-item__title">{task.title}</span>
                {task.estimatedMin && (
                  <span className="cod-task-item__time">{task.estimatedMin}m</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="cod-section__footer">
        {remaining} min remaining • {completedTasks}/{totalTasks} tasks
      </div>
    </div>
  );
}

/**
 * Warnings section
 */
function WarningsSection({ warnings }: WarningsSectionProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="cod-section cod-section--warnings">
      <div className="cod-section__header">
        <span className="cod-section__title">⚠️ Warnings</span>
      </div>
      <ul className="cod-warning-list">
        {warnings.map((warning, i) => (
          <li key={i} className="cod-warning-item">{warning}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * COD Status Panel - Raycast Wrapped Style
 */
export function CODStatusPanel({ collapsed: initialCollapsed = true, staticData = null }: CODStatusPanelProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [showForm, setShowForm] = useState(false);
  const [profileChoice, setProfileChoice] = useState(() => {
    if (typeof window === "undefined") return "auto";
    return localStorage.getItem("codProfile") || "auto";
  });
  const navigate = useNavigate();
  const {
    validation,
    humanState,
    session,
    warnings,
    avatarVitals = {} as AvatarVitals,
    loading,
    updating,
    error,
    refresh,
    updateHumanState,
    startSession,
    endSession,
  } = useCODStatus(staticData, profileChoice === "auto" ? null : profileChoice);
  const [sessionStarting, setSessionStarting] = useState(false);
  const handleProfileChange = (value: string) => {
    setProfileChoice(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("codProfile", value);
    }
    refresh();
  };

  const handleToggle = () => setCollapsed(!collapsed);

  const handleUpdateHumanState = async (formData: CODHumanStateFormData) => {
    const result = await updateHumanState(formData);
    if (result.success) {
      setShowForm(false);
    }
  };

  const handleEndSession = async () => {
    if (session?.id && window.confirm("End current session?")) {
      await endSession(session.id, "completed");
    }
  };

  const handleAbortSession = async () => {
    if (session?.id && window.confirm("Abort current session?")) {
      await endSession(session.id, "aborted");
    }
  };

  const handleQuickSession = async (budgetMin: number) => {
    setSessionStarting(true);
    try {
      await startSession({ budgetMin });
      await refresh();
    } finally {
      setSessionStarting(false);
    }
  };

  if (collapsed) {
    return <CODStatusBadge status={validation.status} onClick={handleToggle} />;
  }

  const ProfileSwitch = () => (
    <div className="cod-profile-switch">
      <span className="cod-profile-switch__label">Profile</span>
      {["auto", "basic", "adhd"].map((p) => (
        <button
          key={p}
          className={`cod-chip ${profileChoice === p ? "cod-chip--active" : ""}`}
          onClick={() => handleProfileChange(p)}
          title="Choose COD scoring profile"
        >
          {p}
        </button>
      ))}
    </div>
  );

  // Show form mode
  if (showForm) {
    const normalizedHumanState = humanState
      ? {
          ...humanState,
          focusCapacity:
            humanState.focusCapacity === "unknown"
              ? "med"
              : humanState.focusCapacity,
        }
      : undefined;

    return (
      <div className="cod-panel">
        <HumanStateForm
          currentState={normalizedHumanState}
          onSubmit={handleUpdateHumanState}
          onCancel={() => setShowForm(false)}
          loading={updating}
        />
      </div>
    );
  }

  return (
    <div className="cod-panel">
      <div className="cod-panel__header">
        <h2 className="cod-panel__title">Cognitive Operating Discipline</h2>
        <div className="cod-panel__actions">
          <ProfileSwitch />
          <button
            className="cod-button cod-button--icon"
            onClick={refresh}
            disabled={loading || updating}
            title="Refresh"
          >
            {loading || updating ? "···" : "↻"}
          </button>
          <button
            className="cod-button cod-button--icon"
            onClick={handleToggle}
            title="Collapse"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Status-aware CTA */}
      <div className="cod-quick-actions">
        <div className="cod-quick-actions__copy">
          <div className="cod-quick-actions__title">
            {validation.status === "PASS"
              ? "Ready to work"
              : validation.status === "WARN"
              ? "Go light and short"
              : validation.status === "FAIL"
              ? "Guardrail active"
              : "COD status unknown"}
          </div>
          <div className="cod-quick-actions__desc">
            {validation.status === "PASS" &&
              "Plan a short focus block based on current state."}
            {validation.status === "WARN" &&
              "Degraded state detected; keep it to a small sprint and update your vitals."}
            {validation.status === "FAIL" &&
              "HARD_STOP or low state. Do a quick check-in or rest."}
            {validation.status === "UNKNOWN" &&
              "Refresh or check-in to update COD status."}
            {error && (
              <span className="cod-quick-actions__inline-error">
                API issue: {error}
              </span>
            )}
          </div>
        </div>
        <div className="cod-quick-actions__buttons">
          <button
            className="cod-button cod-button--pill"
            onClick={() => handleQuickSession(25)}
            disabled={
              loading || updating || sessionStarting || validation.status === "FAIL"
            }
            title={
              validation.status === "FAIL"
                ? "Guardrail active; respect HARD_STOP"
                : "Start a 25m sprint"
            }
          >
            ⏱️ Start 25m Sprint
          </button>
          <button
            className="cod-button cod-button--pill"
            onClick={() => setShowForm(true)}
            disabled={loading || updating}
            title="Update human state"
          >
            ✏️ Check-in
          </button>
          <button
            className="cod-button cod-button--pill cod-button--ghost"
            onClick={() =>
              navigate({
                to: "/",
                search: { q: undefined, collection: undefined },
              })
            }
          >
            📋 Open Tasks
          </button>
        </div>
      </div>

      {error && (
        <div className="cod-error">
          <div className="cod-error__title">API connection issue</div>
          <div className="cod-error__body">{error}</div>
          <div className="cod-error__actions">
            <button
              className="cod-button cod-button--pill cod-button--ghost"
              onClick={refresh}
              disabled={loading || updating}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Validation Card */}
      <div className="cod-section">
        <ValidationCard validation={validation} />
      </div>

      {/* Real-world stats */}
      <div className="cod-section cod-section--stats">
        <div className="cod-stats-grid">
          {/* Money */}
          <div className="cod-stat-card">
            <div className="cod-stat-card__label">💰 Money</div>
            <div className="cod-stat-card__value">
              {avatarVitals.money?.default_currency && avatarVitals.money.balances?.[avatarVitals.money.default_currency] != null
                ? `${avatarVitals.money.default_currency} ${avatarVitals.money.balances[avatarVitals.money.default_currency].toLocaleString()}`
                : '—'}
            </div>
            {avatarVitals.money?.balances && Object.keys(avatarVitals.money.balances).length > 1 && (
              <div className="cod-stat-card__sub">
                {Object.entries(avatarVitals.money.balances)
                  .filter(([cur]) => cur !== avatarVitals.money?.default_currency)
                  .map(([cur, val]) => (
                    <span key={cur} className="cod-chip cod-chip--small">{cur} {val.toLocaleString()}</span>
                  ))}
              </div>
            )}
          </div>

          {/* Forms */}
          {avatarVitals.money?.forms && Object.keys(avatarVitals.money.forms).length > 0 && (
            <div className="cod-stat-card">
              <div className="cod-stat-card__label">🏦 Assets</div>
              <div className="cod-stat-card__chips">
                {Object.entries(avatarVitals.money.forms).map(([form, val]) => (
                  <span key={form} className="cod-chip cod-chip--small">
                    {form}: {typeof val === 'number' ? val.toLocaleString() : val}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notoriety */}
          <div className="cod-stat-card">
            <div className="cod-stat-card__label">⭐ Notoriety</div>
            <div className="cod-stat-card__value">{avatarVitals.notoriety ?? 0}</div>
          </div>

          {/* Health */}
          <div className="cod-stat-card">
            <div className="cod-stat-card__label">❤️ Health</div>
            <div className="cod-stat-card__value">{avatarVitals.health ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Warnings (if any) */}
      {warnings.length > 0 && <WarningsSection warnings={warnings} />}

      {/* Human State */}
      <HumanStateSection state={humanState} onEdit={() => setShowForm(true)} />

      {/* Active Session */}
      {session && (
        <SessionSection
          session={session}
          onEnd={handleEndSession}
          onAbort={handleAbortSession}
        />
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export default CODStatusPanel;
