/**
 * Avatar logic — pure functions for avatar state derivation.
 */

export type ApiStatus = 'online' | 'loading' | 'offline' | 'unknown';

export interface MoneyObject {
  default_currency?: string;
  defaultCurrency?: string;
  balances?: Record<string, number>;
}

export interface AvatarVitals {
  tasksCompletedToday?: number;
  sessionsCompletedThisWeek?: number;
  energy?: number;
  money?: number | MoneyObject;
  notoriety?: number;
  health?: number;
}

export interface Avatar {
  vitals?: AvatarVitals;
  profile?: Record<string, unknown>;
  flags?: Record<string, boolean>;
  progression?: Record<string, unknown>;
  capacity?: Record<string, unknown>;
  knowledge?: Record<string, unknown>;
  updated?: string;
}

export interface SnapshotStats {
  tasksToday: number;
  sessionsThisWeek: number;
  energy: number;
  money: string | number;
  notoriety: number;
  health: number;
}

export const apiBadgeText = (status: ApiStatus): string => {
  if (status === 'online') return 'API online';
  if (status === 'loading') return 'Syncing';
  if (status === 'offline') return 'API offline';
  return 'API';
};

const formatMoney = (money: number | MoneyObject | undefined | null): string | number => {
  if (money === undefined || money === null) return '—';
  if (typeof money === 'number') return money;
  if (typeof money === 'object') {
    const cur = money.default_currency || money.defaultCurrency;
    if (cur && money.balances && typeof money.balances[cur] !== 'undefined') {
      return `${cur} ${money.balances[cur]}`;
    }
    const first = money.balances && Object.entries(money.balances)[0];
    if (first) return `${first[0]} ${first[1]}`;
  }
  return '—';
};

export const computeSnapshotStats = (avatar: Avatar): SnapshotStats => ({
  tasksToday: avatar.vitals?.tasksCompletedToday || 0,
  sessionsThisWeek: avatar.vitals?.sessionsCompletedThisWeek || 0,
  energy: avatar.vitals?.energy ?? 0,
  money: formatMoney(avatar.vitals?.money),
  notoriety: avatar.vitals?.notoriety ?? 0,
  health: avatar.vitals?.health ?? 0,
});
