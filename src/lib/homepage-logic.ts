export type HomepageLoadState =
  | 'loading'
  | 'ready'
  | 'unauthorized'
  | 'offline'
  | 'unknown';

export type HomepageApiStatus =
  | 'online'
  | 'offline'
  | 'unauthorized'
  | 'unknown';

export const classifyHomepageFailure = (
  status: number
): Exclude<HomepageLoadState, 'loading' | 'ready'> => {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status >= 500 && status <= 599) return 'offline';
  return 'unknown';
};

export const mergeHomepageApiStatus = (
  states: HomepageLoadState[]
): HomepageApiStatus => {
  if (states.includes('unauthorized')) return 'unauthorized';
  if (states.includes('offline')) return 'offline';
  if (states.includes('ready')) return 'online';
  return 'unknown';
};

export const homepageApiBadgeText = (status: HomepageApiStatus): string => {
  if (status === 'online') return 'API online';
  if (status === 'offline') return 'API offline';
  if (status === 'unauthorized') return 'Auth required';
  return 'API';
};

export const formatHomepageMetric = (
  value: number,
  state: HomepageLoadState
): string => (state === 'ready' ? String(value) : '—');

export const homepageEmptyMessage = (
  status: HomepageApiStatus,
  loading: boolean
): string => {
  if (loading) return 'Loading viewer data…';
  if (status === 'unauthorized') {
    return 'API auth required. Viewer data could not be loaded.';
  }
  if (status === 'offline') {
    return 'API unavailable. Viewer data could not be loaded.';
  }
  return 'No matches yet. Try a different query or change the collection filter.';
};
