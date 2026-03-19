import React, { useState, useEffect, useCallback } from "react";
import useCODStatus from "../hooks/useCODStatus";
import { CODStatusPanel } from "./CODStatusPanel";

/**
 * Compact COD status widget for inline display on home page.
 * Shows validation status, energy, and quick actions.
 * Clicking "Open COD" opens a modal with the full CODStatusPanel.
 */
export default function CODStatusWidget() {
  const { validation, humanState, session, loading, error, refresh, startSession } =
    useCODStatus();
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen, closeModal]);

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
    <>
      <div className={`cod-widget cod-widget--${statusClass}`}>
        <div className="cod-widget__status">
          <span className={`cod-widget__icon cod-widget__icon--${statusClass}`}>
            {statusIcon}
          </span>
          <div className="cod-widget__info">
            <span className="cod-widget__label">{statusMessage}</span>
            <span className="cod-widget__sublabel">
              {loading ? "Syncing..." : error ? "API offline" : `${Math.round(humanState.energy * 100)}% energy`}
            </span>
          </div>
        </div>

        <div className="cod-widget__vitals">
          <div className="cod-widget__vital">
            <span className="cod-widget__vital-value">{Math.round(humanState.energy * 100)}%</span>
            <span className="cod-widget__vital-label">Energy</span>
          </div>
          <div className="cod-widget__vital">
            <span className="cod-widget__vital-value">{Math.round(humanState.stress * 100)}%</span>
            <span className="cod-widget__vital-label">Stress</span>
          </div>
          <div className="cod-widget__vital">
            <span className="cod-widget__vital-value">{humanState.timeAvailableMin}m</span>
            <span className="cod-widget__vital-label">Time Left</span>
          </div>
        </div>

        <div className="cod-widget__actions">
          {session ? (
            <button
              className="cod-widget__btn cod-widget__btn--active"
              onClick={openModal}
            >
              ⏱️ Session Active
            </button>
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
          <button className="cod-widget__btn" onClick={openModal}>
            Open COD →
          </button>
        </div>
      </div>

      {modalOpen && (
        <div
          className="cod-modal__overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="COD Status"
        >
          <div
            className="cod-modal__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="cod-modal__close"
              onClick={closeModal}
              aria-label="Close"
            >
              ✕
            </button>
            <CODStatusPanel collapsed={false} />
          </div>
        </div>
      )}
    </>
  );
}
