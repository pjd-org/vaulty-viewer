import React from "react";
import { Link } from "gatsby";
import useCODStatus from "../hooks/useCODStatus";

/**
 * Compact COD status widget for inline display on home page.
 * Shows validation status, energy, and quick actions.
 */
export default function CODStatusWidget() {
  const { validation, humanState, session, loading, error, refresh, startSession } =
    useCODStatus();

  const statusIcon =
    validation.status === "PASS"
      ? "✓"
      : validation.status === "WARN"
      ? "⚡"
      : validation.status === "FAIL"
      ? "✕"
      : "?";

  const statusClass = validation.status.toLowerCase();

  const statusMessage =
    validation.status === "PASS"
      ? "Ready to work"
      : validation.status === "WARN"
      ? "Degraded state"
      : validation.status === "FAIL"
      ? "Rest mode"
      : "Check status";

  const handleQuickStart = async () => {
    if (validation.status !== "FAIL") {
      await startSession({ budgetMin: 25 });
      await refresh();
    }
  };

  return (
    <div className={`cod-widget cod-widget--${statusClass}`}>
      <div className="cod-widget__status">
        <span className={`cod-widget__icon cod-widget__icon--${statusClass}`}>
          {statusIcon}
        </span>
        <div className="cod-widget__info">
          <span className="cod-widget__label">{statusMessage}</span>
          <span className="cod-widget__sublabel">
            {loading ? "Syncing..." : error ? "API offline" : `${humanState.energy}% energy`}
          </span>
        </div>
      </div>

      <div className="cod-widget__vitals">
        <div className="cod-widget__vital">
          <span className="cod-widget__vital-value">{humanState.energy}%</span>
          <span className="cod-widget__vital-label">Energy</span>
        </div>
        <div className="cod-widget__vital">
          <span className="cod-widget__vital-value">{humanState.stress}%</span>
          <span className="cod-widget__vital-label">Stress</span>
        </div>
        <div className="cod-widget__vital">
          <span className="cod-widget__vital-value">{humanState.timeAvailableMin}m</span>
          <span className="cod-widget__vital-label">Time Left</span>
        </div>
      </div>

      <div className="cod-widget__actions">
        {session ? (
          <Link to="/cod-status" className="cod-widget__btn cod-widget__btn--active">
            ⏱️ Session Active
          </Link>
        ) : validation.status !== "FAIL" ? (
          <button
            className="cod-widget__btn cod-widget__btn--primary"
            onClick={handleQuickStart}
            disabled={loading}
          >
            ⏱️ Start 25m Sprint
          </button>
        ) : (
          <span className="cod-widget__btn cod-widget__btn--disabled">
            🛑 HARD_STOP
          </span>
        )}
        <Link to="/cod-status" className="cod-widget__btn">
          Open COD →
        </Link>
      </div>
    </div>
  );
}
