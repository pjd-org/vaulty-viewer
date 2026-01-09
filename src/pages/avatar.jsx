import React from "react";
import useAvatar from "../hooks/useAvatar";
import VitalsPanel from "../components/VitalsPanel";
import ProgressionPanel from "../components/ProgressionPanel";
import { KnowledgePanel, CapacityPanel } from "../components/KnowledgePanel";
import "../styles.css";

/**
 * Profile Header - shows avatar name, title, and archetype
 */
function ProfileHeader({ profile, flags }) {
  return (
    <div className="avatar-profile">
      <div className="avatar-profile__avatar">
        {profile.name?.[0] || "?"}
      </div>
      <div className="avatar-profile__info">
        <h1 className="avatar-profile__name">{profile.name || "Unknown"}</h1>
        <p className="avatar-profile__title">
          {profile.title || profile.archetype || "Vault User"}
        </p>
        {profile.location && (
          <p className="avatar-profile__location">📍 {profile.location}</p>
        )}
      </div>
      <div className="avatar-profile__flags">
        {flags?.stagnation && (
          <span className="avatar-flag avatar-flag--warning" title="Stagnation detected">
            ⚠️ Stagnation
          </span>
        )}
        {flags?.entropyWarning && (
          <span className="avatar-flag avatar-flag--danger" title="High entropy">
            🌀 Entropy
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Avatar Dashboard Page
 */
export default function AvatarPage() {
  const {
    avatar,
    loading,
    error,
    refresh,
    level,
    currentXp,
    xpToNext,
    xpProgress,
    apiStatus,
  } = useAvatar();

  return (
    <div className="avatar-page">
      <div className="page">
        <nav className="breadcrumb">
          <a href="/" className="back-link">← Home</a>
        </nav>

        <header className="page-header">
          <h1>Avatar Dashboard</h1>
          <p className="lede">
            Your gamified productivity profile
            <span className={`api-badge api-badge--${apiStatus}`} style={{ marginLeft: 8 }}>
              {apiStatus === "online" ? "API online" : apiStatus === "loading" ? "Syncing" : "API offline"}
            </span>
          </p>
        </header>

        {error && (
          <div className="avatar-error">
            Failed to load avatar: {error}
            <button onClick={refresh} className="avatar-retry">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="avatar-loading">
            <div className="avatar-loading__spinner" />
            <span>Loading avatar...</span>
          </div>
        ) : (
          <div className="avatar-dashboard">
            {/* Profile Header */}
            <ProfileHeader profile={avatar.profile} flags={avatar.flags} />

            {/* Snapshot stats */}
            <div className="stats">
              <div className="stat" data-type="tasks">
                <div className="stat__icon">📋</div>
                <div className="stat__content">
                  <div className="stat__value">{avatar.vitals?.tasksCompletedToday || 0}</div>
                  <div className="stat__label">Tasks done today</div>
                </div>
              </div>
              <div className="stat" data-type="sessions">
                <div className="stat__icon">⏱</div>
                <div className="stat__content">
                  <div className="stat__value">{avatar.vitals?.sessionsCompletedThisWeek || 0}</div>
                  <div className="stat__label">Sessions this week</div>
                </div>
              </div>
              <div className="stat" data-type="focus">
                <div className="stat__icon">⚡</div>
                <div className="stat__content">
                  <div className="stat__value">{avatar.vitals?.energy ?? 0}%</div>
                  <div className="stat__label">Energy now</div>
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="avatar-grid">
              {/* Left Column - Vitals & Capacity */}
              <div className="avatar-column">
                <VitalsPanel vitals={avatar.vitals} />
                <CapacityPanel capacity={avatar.capacity} />
              </div>

              {/* Right Column - Progression & Knowledge */}
              <div className="avatar-column">
                <ProgressionPanel
                  progression={avatar.progression}
                  level={level}
                  currentXp={currentXp}
                  xpToNext={xpToNext}
                  xpProgress={xpProgress}
                />
                <KnowledgePanel knowledge={avatar.knowledge} />
              </div>
            </div>

            {/* Last Updated */}
            {avatar.updated && (
              <div className="avatar-footer">
                Last updated: {new Date(avatar.updated).toLocaleString()}
                <button onClick={refresh} className="avatar-refresh" title="Refresh">
                  ↻
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="avatar-actions">
              <a href="/" className="avatar-action avatar-action--primary" title="Tasker powered task list">
                <span className="avatar-action__icon">📋</span>
                <span className="avatar-action__label">
                  Open Tasks
                  <span className={`api-badge api-badge--${apiStatus}`}>
                    {apiStatus === "online" ? "API online" : apiStatus === "loading" ? "Syncing" : "API offline"}
                  </span>
                </span>
                <span className="avatar-action__meta">
                  {avatar.vitals?.tasksCompletedToday || 0} done today
                </span>
              </a>
              <a href="/goals" className="avatar-action" title="Goals from Tasker API">
                <span className="avatar-action__icon">🎯</span>
                <span className="avatar-action__label">Goals</span>
                <span className="avatar-action__meta">Focus on outcomes</span>
              </a>
              <button
                onClick={refresh}
                className="avatar-action"
                disabled={loading}
                title={apiStatus === "online" ? "Refresh from Tasker API" : "API unreachable, retry"}
              >
                <span className="avatar-action__icon">🔄</span>
                <span className="avatar-action__label">
                  {loading ? "Syncing..." : "Sync Vitals"}
                  <span className={`api-badge api-badge--${apiStatus}`}>
                    {apiStatus === "online" ? "API online" : apiStatus === "loading" ? "Syncing" : "API offline"}
                  </span>
                </span>
                <span className="avatar-action__meta">
                  {avatar.vitals?.sessionsCompletedThisWeek || 0} sessions this week
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
