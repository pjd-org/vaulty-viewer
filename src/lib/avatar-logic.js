/**
 * Avatar logic — pure functions for avatar state derivation.
 * No types: this is a JS-first Gatsby app.
 */

export const apiBadgeText = (status) => {
  if (status === 'online') return 'API online';
  if (status === 'loading') return 'Syncing';
  if (status === 'offline') return 'API offline';
  return 'API';
};

const formatMoney = (money) => {
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

export const computeSnapshotStats = (avatar) => ({
  tasksToday: avatar.vitals?.tasksCompletedToday || 0,
  sessionsThisWeek: avatar.vitals?.sessionsCompletedThisWeek || 0,
  energy: avatar.vitals?.energy ?? 0,
  money: formatMoney(avatar.vitals?.money),
  notoriety: avatar.vitals?.notoriety ?? 0,
  health: avatar.vitals?.health ?? 0,
});
