import React from 'react';
import { SoftChip } from './Chips';

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
        <SoftChip
          variant={isStreakActive ? 'warning' : 'default'}
          label={`${isStreakActive ? '🔥' : '○'} ${streakDays}d streak`}
        />
      )}
      {level > 0 && (
        <SoftChip
          variant="default"
          label={`Level ${level} · ${currentXp.toLocaleString()} / ${xpToNext.toLocaleString()} XP`}
        />
      )}
    </div>
  );
}
