import React from "react";

interface Progression {
  streakDays?: number;
  streakUpdated?: string;
}

interface ProgressionPanelProps {
  progression?: Progression;
  level: number;
  currentXp: number;
  xpToNext: number;
  xpProgress: number;
}

/**
 * Progression Panel - shows level, XP, and streak
 */
export function ProgressionPanel({ progression, level, currentXp, xpToNext, xpProgress }: ProgressionPanelProps) {
  const streakDays = progression?.streakDays || 0;
  const streakUpdated = progression?.streakUpdated;
  
  // Check if streak is active (updated today or yesterday)
  const isStreakActive = streakUpdated && (() => {
    const updated = new Date(streakUpdated);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  })();

  return (
    <div className="avatar-section">
      <div className="avatar-section__header">
        <h3 className="avatar-section__title">Progression</h3>
      </div>

      {/* Level Display */}
      <div className="avatar-level">
        <div className="avatar-level__badge">
          <span className="avatar-level__number">{level}</span>
          <span className="avatar-level__label">Level</span>
        </div>
        <div className="avatar-level__stars">
          {[...Array(Math.min(level, 5))].map((_, pos) => (
            <span key={`star-${pos}`} className="avatar-level__star">⭐</span>
          ))}
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="avatar-xp">
        <div className="avatar-xp__header">
          <span className="avatar-xp__label">Experience</span>
          <span className="avatar-xp__value">
            {currentXp.toLocaleString()} / {xpToNext.toLocaleString()} XP
          </span>
        </div>
        <div className="avatar-xp__track">
          <div
            className="avatar-xp__fill"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <div className="avatar-xp__footer">
          {xpToNext - currentXp} XP to level {level + 1}
        </div>
      </div>

      <div className="avatar-section__divider" />

      {/* Streak */}
      <div className="avatar-streak">
        <div className={`avatar-streak__flame ${isStreakActive ? 'avatar-streak__flame--active' : ''}`}>
          🔥
        </div>
        <div className="avatar-streak__info">
          <span className="avatar-streak__count">{streakDays}</span>
          <span className="avatar-streak__label">
            day streak
          </span>
        </div>
        {!isStreakActive && streakDays > 0 && (
          <span className="avatar-streak__warning">At risk!</span>
        )}
      </div>
    </div>
  );
}

export default ProgressionPanel;
