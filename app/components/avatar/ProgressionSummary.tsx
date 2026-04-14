import React from 'react';

export interface ProgressionData {
  streakDays?: number;
  streakUpdated?: string;
}

export interface ProgressionSummaryProps {
  level: number;
  currentXp: number;
  xpToNext: number;
  progression: ProgressionData;
}

export function ProgressionSummary({
  level,
  currentXp,
  xpToNext,
  progression,
}: ProgressionSummaryProps) {
  const streakDays = progression.streakDays ?? 0;
  const streakUpdated = progression.streakUpdated;
  const isStreakActive =
    streakUpdated &&
    (() => {
      const diff =
        (Date.now() - new Date(streakUpdated).getTime()) /
        (1000 * 60 * 60 * 24);
      return diff <= 1;
    })();

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {streakDays > 0 && (
        <span
          className={[
            'rounded-full px-3 py-1 text-xs',
            isStreakActive
              ? 'bg-amber-100 text-amber-700'
              : 'bg-black/5 text-slate-600',
          ].join(' ')}
        >
          {isStreakActive ? '🔥' : '○'} {streakDays}d streak
        </span>
      )}
      {level > 0 && (
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-slate-600">
          Level {level} · {currentXp.toLocaleString()} /{' '}
          {xpToNext.toLocaleString()} XP
        </span>
      )}
    </div>
  );
}
