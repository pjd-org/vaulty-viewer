import { describe, expect, it } from 'vitest';
import {
  classifyHomepageFailure,
  formatHomepageMetric,
  homepageApiBadgeText,
  homepageEmptyMessage,
  mergeHomepageApiStatus,
} from '../src/lib/homepage-logic';

describe('classifyHomepageFailure', () => {
  it('maps auth failures to unauthorized', () => {
    expect(classifyHomepageFailure(401)).toBe('unauthorized');
    expect(classifyHomepageFailure(403)).toBe('unauthorized');
  });

  it('maps server failures to offline', () => {
    expect(classifyHomepageFailure(500)).toBe('offline');
    expect(classifyHomepageFailure(503)).toBe('offline');
  });

  it('keeps other non-ok statuses as unknown', () => {
    expect(classifyHomepageFailure(404)).toBe('unknown');
  });
});

describe('mergeHomepageApiStatus', () => {
  it('keeps unauthorized visible even with partial success', () => {
    expect(mergeHomepageApiStatus(['ready', 'unauthorized'])).toBe(
      'unauthorized'
    );
  });

  it('marks offline when no auth error is present', () => {
    expect(mergeHomepageApiStatus(['ready', 'offline'])).toBe('offline');
  });

  it('marks online when at least one source succeeded', () => {
    expect(mergeHomepageApiStatus(['ready', 'unknown'])).toBe('online');
  });

  it('falls back to unknown when nothing has succeeded', () => {
    expect(mergeHomepageApiStatus(['loading', 'unknown'])).toBe('unknown');
  });
});

describe('homepage presentation helpers', () => {
  it('formats unavailable metrics as an em dash', () => {
    expect(formatHomepageMetric(0, 'unauthorized')).toBe('—');
    expect(formatHomepageMetric(5, 'ready')).toBe('5');
  });

  it('returns user-facing badge labels', () => {
    expect(homepageApiBadgeText('online')).toBe('API online');
    expect(homepageApiBadgeText('offline')).toBe('API offline');
    expect(homepageApiBadgeText('unauthorized')).toBe('Auth required');
    expect(homepageApiBadgeText('unknown')).toBe('API');
  });

  it('returns empty-state copy for loading and auth failures', () => {
    expect(homepageEmptyMessage('unknown', true)).toBe('Loading viewer data…');
    expect(homepageEmptyMessage('unauthorized', false)).toBe(
      'API auth required. Viewer data could not be loaded.'
    );
    expect(homepageEmptyMessage('offline', false)).toBe(
      'API unavailable. Viewer data could not be loaded.'
    );
  });
});
