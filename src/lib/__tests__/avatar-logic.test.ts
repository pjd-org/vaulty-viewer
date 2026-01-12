import { describe, expect, it } from 'vitest';
import { apiBadgeText, computeSnapshotStats } from '../avatar-logic';

describe('apiBadgeText', () => {
  it('returns friendly badge labels', () => {
    expect(apiBadgeText('online')).toBe('API online');
    expect(apiBadgeText('loading')).toBe('Syncing');
    expect(apiBadgeText('offline')).toBe('API offline');
    expect(apiBadgeText('unknown')).toBe('API');
  });
});

describe('computeSnapshotStats', () => {
  it('safely derives vitals with defaults', () => {
    const result = computeSnapshotStats({
      vitals: {
        tasksCompletedToday: 3,
        sessionsCompletedThisWeek: 5,
        energy: 70,
      },
    });
    expect(result).toEqual({
      tasksToday: 3,
      sessionsThisWeek: 5,
      energy: 70,
      money: '—',
      notoriety: 0,
      health: 0,
    });
  });

  it('defaults missing values to zero', () => {
    const result = computeSnapshotStats({});
    expect(result).toEqual({
      tasksToday: 0,
      sessionsThisWeek: 0,
      energy: 0,
      money: '—',
      notoriety: 0,
      health: 0,
    });
  });
});
