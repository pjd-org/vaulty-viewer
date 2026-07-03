import React, { useReducer } from "react";
import useCODStatus from "../hooks/useCODStatus";
import type { CODHumanStateFormData } from "../hooks/useCODStatus";
import HumanStateForm from "./HumanStateForm";
import { useNavigate } from "@tanstack/react-router";
import {
  normalizeCodSignals,
  deriveCodConstraints,
  deriveCodRecommendation,
  getMaxSprintMin,
} from "../lib/cod-status-logic";
import type { CodSignal, CodConstraint } from "../lib/cod-status-logic";

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

interface CODStatusPanelProps {
  collapsed?: boolean;
  staticData?: unknown;
}

// ============================================================================
// Decision Header
// ============================================================================

function CodDecisionHeader({
  status,
  title,
  description,
  lastChecked,
}: {
  status: string;
  title: string;
  description: string;
  lastChecked?: string | null;
}) {
  const icon = status === 'PASS' ? '✓' : status === 'WARN' ? '⚡' : status === 'FAIL' ? '✕' : '?';
  const timeAgo = lastChecked ? formatTimeAgo(new Date(lastChecked)) : null;

  return (
    <div className={`cod-decision-header cod-decision-header--${status.toLowerCase()}`}>
      <div className="cod-decision-header__badge">
        <span className="cod-decision-header__icon">{icon}</span>
        <span className="cod-decision-header__status">{status}</span>
      </div>
      <div className="cod-decision-header__body">
        <div className="cod-decision-header__title">{title}</div>
        <div className="cod-decision-header__desc">{description}</div>
      </div>
      {timeAgo && (
        <div className="cod-decision-header__time">{timeAgo}</div>
      )}
    </div>
  );
}

// ============================================================================
// Action Bar
// ============================================================================

function CodActionBar({
  status,
  loading,
  updating,
  sessionStarting,
  session,
  onStartSprint,
  onCheckin,
  onOpenTasks,
}: {
  status: string;
  loading: boolean;
  updating: boolean;
  sessionStarting: boolean;
  session: Session | null;
  onStartSprint: (min: number) => void;
  onCheckin: () => void;
  onOpenTasks: () => void;
}) {
  const busy = loading || updating || sessionStarting;

  if (session) {
    return (
      <div className="cod-action-bar">
        <span className="cod-action-bar__hint">Session active — manage below</span>
      </div>
    );
  }

  return (
    <div className="cod-action-bar">
      {status !== 'FAIL' && (
        <button
          className="cod-button cod-button--pill cod-button--primary"
          onClick={() => onStartSprint(getMaxSprintMin(status as 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN'))}
          disabled={busy}
        >
          ⏱ {status === 'WARN' ? 'Start 25m Sprint' : 'Start Session'}
        </button>
      )}
      <button
        className="cod-button cod-button--pill"
        onClick={onCheckin}
        disabled={busy}
      >
        ✏️ Check-in
      </button>
      {status !== 'FAIL' && (
        <button
          className="cod-button cod-button--pill cod-button--ghost"
          onClick={onOpenTasks}
        >
          📋 Open Tasks
        </button>
      )}
      {status === 'FAIL' && (
        <button
          className="cod-button cod-button--pill cod-button--ghost"
          onClick={onOpenTasks}
        >
          Review blockers
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Constraints Panel
// ============================================================================

function CodConstraintsPanel({ constraints }: { constraints: CodConstraint[] }) {
  return (
    <div className="cod-constraints-panel">
      <div className="cod-section__title">Constraints</div>
      <div className="cod-constraints-grid">
        {constraints.map((c) => (
          <div key={c.label} className={`cod-constraint-row${c.active ? ' cod-constraint-row--active' : ''}`}>
            <span className="cod-constraint-row__label">{c.label}</span>
            <span className="cod-constraint-row__value">{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Signals Panel — normalized 0–100, no ×100 bug
// ============================================================================

function CodSignalsPanel({ signals }: { signals: CodSignal[] }) {
  return (
    <div className="cod-signals-panel">
      <div className="cod-section__title">Signals</div>
      <div className="cod-signals-grid">
        {signals.map((s) => (
          <div key={s.label} className="cod-signal-row">
            <span className="cod-signal-row__label">{s.label}</span>
            <div className="cod-signal-row__bar-wrap">
              <div className="cod-signal-row__bar">
                <div
                  className={`cod-signal-row__fill cod-signal-row__fill--${s.status}`}
                  style={{ width: `${s.value}%` }}
                />
              </div>
            </div>
            <span className={`cod-signal-row__value cod-signal-row__value--${s.status}`}>
              {s.unit === 'min'
                ? `${Math.round(s.raw as number)}m`
                : typeof s.raw === 'string'
                ? s.raw
                : `${Math.round(s.value)}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Why Panel
// ============================================================================

function CodWhyPanel({ warnings }: { warnings: string[] }) {
  if (!warnings || warnings.length === 0) return null;
  return (
    <div className="cod-why-panel">
      <div className="cod-section__title">Why this status</div>
      <ul className="cod-why-list">
        {warnings.map((w) => (
          <li key={w} className="cod-why-item">{w}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Advanced Drawer (session + profile + raw state)
// ============================================================================

function SessionSection({
  session,
  onEnd,
  onAbort,
}: {
  session: Session;
  onEnd?: () => void;
  onAbort?: () => void;
}) {
  const startTime = new Date(session.startedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const completedTasks = session.tasks?.filter((t) => t.status === 'done').length || 0;
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
            <button className="cod-button cod-button--small cod-button--success" onClick={onEnd}>
              ✓ Done
            </button>
          )}
          {onAbort && (
            <button className="cod-button cod-button--small cod-button--danger" onClick={onAbort}>
              ✕ Abort
            </button>
          )}
        </div>
      </div>
      <div className="cod-section__meta">{startTime} · {session.budgetMin} min budget</div>
      <div className="cod-stat-big">
        <div className="cod-stat-big__value">{progressPercent}%</div>
        <div className="cod-stat-big__label">Session Progress</div>
      </div>
      {session.tasks && session.tasks.length > 0 && (
        <ul className="cod-task-list">
          {session.tasks.map((task) => (
            <li key={task.title || `${task.status}-task`} className={`cod-task-item cod-task-item--${task.status}`}>
              <span className="cod-task-item__icon">
                {task.status === 'done' ? '✓' : task.status === 'in_progress' ? '◐' : '○'}
              </span>
              <span className="cod-task-item__title">{task.title}</span>
              {task.estimatedMin && <span className="cod-task-item__time">{task.estimatedMin}m</span>}
            </li>
          ))}
        </ul>
      )}
      <div className="cod-section__footer">
        {remaining} min remaining · {completedTasks}/{totalTasks} tasks
      </div>
    </div>
  );
}

function CodAdvancedDrawer({
  open,
  onToggle,
  session,
  onEnd,
  onAbort,
  profileChoice,
  onProfileChange,
  avatarVitals,
}: {
  open: boolean;
  onToggle: () => void;
  session: Session | null;
  onEnd?: () => void;
  onAbort?: () => void;
  profileChoice: string;
  onProfileChange: (v: string) => void;
  avatarVitals: AvatarVitals;
}) {
  return (
    <div className="cod-advanced-drawer">
      <button className="cod-advanced-drawer__toggle" onClick={onToggle}>
        {open ? '▾ Hide details' : '▸ More details'}
      </button>
      {open && (
        <div className="cod-advanced-drawer__body">
          {session && (
            <SessionSection session={session} onEnd={onEnd} onAbort={onAbort} />
          )}

          <div className="cod-section">
            <div className="cod-section__title">Profile</div>
            <div className="cod-profile-switch">
              {['auto', 'basic', 'adhd'].map((p) => (
                <button
                  key={p}
                  className={`cod-chip ${profileChoice === p ? 'cod-chip--active' : ''}`}
                  onClick={() => onProfileChange(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {(avatarVitals.health != null || avatarVitals.notoriety != null) && (
            <div className="cod-section">
              <div className="cod-section__title">Avatar State</div>
              <div className="cod-stats-grid">
                {avatarVitals.health != null && (
                  <div className="cod-stat-card">
                    <div className="cod-stat-card__label">❤️ Health</div>
                    <div className="cod-stat-card__value">{avatarVitals.health}</div>
                  </div>
                )}
                {avatarVitals.notoriety != null && (
                  <div className="cod-stat-card">
                    <div className="cod-stat-card__label">⭐ Notoriety</div>
                    <div className="cod-stat-card__value">{avatarVitals.notoriety}</div>
                  </div>
                )}
                {avatarVitals.money?.default_currency && avatarVitals.money.balances && (
                  <div className="cod-stat-card">
                    <div className="cod-stat-card__label">💰 Money</div>
                    <div className="cod-stat-card__value">
                      {avatarVitals.money.default_currency}{' '}
                      {(avatarVitals.money.balances[avatarVitals.money.default_currency] ?? 0).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Collapsed badge
// ============================================================================

function CODStatusBadge({ status, onClick }: { status: string; onClick: () => void }) {
  const label = status === 'PASS' ? '✓ PASS' : status === 'WARN' ? '⚡ WARN' : '✕ FAIL';
  return (
    <button className={`cod-badge cod-badge--${status.toLowerCase()}`} onClick={onClick} title="Expand COD Status">
      {label}
    </button>
  );
}

// ============================================================================
// Panel state
// ============================================================================

type PanelState = {
  collapsed: boolean;
  showForm: boolean;
  advancedOpen: boolean;
  profileChoice: string;
  sessionStarting: boolean;
};

type PanelAction =
  | { type: 'EXPAND' }
  | { type: 'COLLAPSE' }
  | { type: 'SHOW_FORM' }
  | { type: 'HIDE_FORM' }
  | { type: 'TOGGLE_ADVANCED' }
  | { type: 'SET_PROFILE'; value: string }
  | { type: 'SESSION_START' }
  | { type: 'SESSION_DONE' };

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'EXPAND': return { ...state, collapsed: false };
    case 'COLLAPSE': return { ...state, collapsed: true };
    case 'SHOW_FORM': return { ...state, showForm: true };
    case 'HIDE_FORM': return { ...state, showForm: false };
    case 'TOGGLE_ADVANCED': return { ...state, advancedOpen: !state.advancedOpen };
    case 'SET_PROFILE': return { ...state, profileChoice: action.value };
    case 'SESSION_START': return { ...state, sessionStarting: true };
    case 'SESSION_DONE': return { ...state, sessionStarting: false };
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function CODStatusPanel({ collapsed: initialCollapsed = true, staticData = null }: CODStatusPanelProps) {
  const [{ collapsed, showForm, advancedOpen, profileChoice, sessionStarting }, dispatch] = useReducer(
    panelReducer,
    {
      collapsed: initialCollapsed,
      showForm: false,
      advancedOpen: false,
      profileChoice: typeof window !== 'undefined' ? (localStorage.getItem('codProfile') || 'auto') : 'auto',
      sessionStarting: false,
    },
  );
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
  } = useCODStatus(staticData, profileChoice === 'auto' ? null : profileChoice);

  const handleProfileChange = (value: string) => {
    dispatch({ type: 'SET_PROFILE', value });
    if (typeof window !== 'undefined') localStorage.setItem('codProfile', value);
    refresh();
  };

  const handleUpdateHumanState = async (formData: CODHumanStateFormData) => {
    const result = await updateHumanState(formData);
    if (result.success) dispatch({ type: 'HIDE_FORM' });
  };

  const handleEndSession = async () => {
    if (session?.id && window.confirm('End current session?')) {
      await endSession(session.id, 'completed');
    }
  };

  const handleAbortSession = async () => {
    if (session?.id && window.confirm('Abort current session?')) {
      await endSession(session.id, 'aborted');
    }
  };

  const handleQuickSession = async (budgetMin: number) => {
    if (budgetMin <= 0) return;
    dispatch({ type: 'SESSION_START' });
    try {
      await startSession({ budgetMin });
      await refresh();
    } finally {
      dispatch({ type: 'SESSION_DONE' });
    }
  };

  if (collapsed) {
    return <CODStatusBadge status={validation.status} onClick={() => dispatch({ type: 'EXPAND' })} />;
  }

  // Derive display state from normalized data
  const signals = normalizeCodSignals(humanState);
  const constraints = deriveCodConstraints(humanState, validation.status as 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN');
  const recommendation = deriveCodRecommendation(
    validation.status as 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN',
    warnings || [],
  );

  // Check-in form mode
  if (showForm) {
    const normalizedHumanState = humanState
      ? { ...humanState, focusCapacity: humanState.focusCapacity === 'unknown' ? 'med' : humanState.focusCapacity }
      : undefined;
    return (
      <div className="cod-panel">
        <HumanStateForm
          currentState={normalizedHumanState}
          onSubmit={handleUpdateHumanState}
          onCancel={() => dispatch({ type: 'HIDE_FORM' })}
          loading={updating}
        />
      </div>
    );
  }

  return (
    <div className="cod-panel">
      {/* Panel header — collapse + refresh only */}
      <div className="cod-panel__header">
        <h2 className="cod-panel__title">COD</h2>
        <div className="cod-panel__actions">
          <button
            className="cod-button cod-button--icon"
            onClick={refresh}
            disabled={loading || updating}
            title="Refresh"
          >
            {loading || updating ? '···' : '↻'}
          </button>
          <button
            className="cod-button cod-button--icon"
            onClick={() => dispatch({ type: 'COLLAPSE' })}
            title="Collapse"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 1. Decision header */}
      <CodDecisionHeader
        status={validation.status}
        title={recommendation.title}
        description={recommendation.description}
        lastChecked={validation.lastChecked}
      />

      {/* 2. Action bar */}
      <CodActionBar
        status={validation.status}
        loading={loading}
        updating={updating}
        sessionStarting={sessionStarting}
        session={session}
        onStartSprint={handleQuickSession}
        onCheckin={() => dispatch({ type: 'SHOW_FORM' })}
        onOpenTasks={() => navigate({ to: '/', search: { q: undefined, collection: undefined } })}
      />

      {/* API error */}
      {error && (
        <div className="cod-error">
          <div className="cod-error__title">API issue</div>
          <div className="cod-error__body">{error}</div>
          <button className="cod-button cod-button--pill cod-button--ghost" onClick={refresh} disabled={loading}>
            Retry
          </button>
        </div>
      )}

      {/* 3. Constraints */}
      <CodConstraintsPanel constraints={constraints} />

      {/* 4. Signals */}
      <CodSignalsPanel signals={signals} />

      {/* 5. Why */}
      {warnings && warnings.length > 0 && <CodWhyPanel warnings={warnings} />}

      {/* 6. Advanced drawer */}
      <CodAdvancedDrawer
        open={advancedOpen}
        onToggle={() => dispatch({ type: 'TOGGLE_ADVANCED' })}
        session={session}
        onEnd={handleEndSession}
        onAbort={handleAbortSession}
        profileChoice={profileChoice}
        onProfileChange={handleProfileChange}
        avatarVitals={avatarVitals}
      />
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export default CODStatusPanel;
