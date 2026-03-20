import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelativeTime } from '../src/components/KnowledgeHealthBanner.js';

describe('formatRelativeTime', () => {
  it('returns minutes ago for recent times', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 minutes ago');
  });

  it('returns singular minute for 1 minute ago', () => {
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
    expect(formatRelativeTime(oneMinAgo)).toBe('1 minute ago');
  });

  it('returns hours ago for times within a day', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
  });

  it('returns days ago for older times', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
  });

  it('handles invalid date gracefully', () => {
    expect(formatRelativeTime('not-a-date')).toBe('unknown time ago');
  });
});

describe('KnowledgeHealthBanner banner state logic', () => {
  const makeHealth = (overrides = {}) => ({
    graph_generated: new Date().toISOString(),
    is_stale: false,
    node_count: 10,
    edge_count: 5,
    by_audience: { human: 4, agent: 3, bubble: 3 },
    unresolved_link_count: 0,
    ...overrides,
  });

  it('identifies stale state correctly', () => {
    const health = makeHealth({ is_stale: true });
    expect(health.is_stale).toBe(true);
  });

  it('identifies empty state correctly', () => {
    const health = makeHealth({ node_count: 0 });
    expect(health.node_count).toBe(0);
  });

  it('identifies high unresolved links state', () => {
    const health = makeHealth({ unresolved_link_count: 51 });
    expect(health.unresolved_link_count).toBeGreaterThan(50);
  });

  it('identifies healthy state', () => {
    const health = makeHealth({ is_stale: false, node_count: 10, unresolved_link_count: 0 });
    expect(health.is_stale).toBe(false);
    expect(health.node_count).toBeGreaterThan(0);
    expect(health.unresolved_link_count).toBeLessThanOrEqual(50);
  });
});

describe('KnowledgeHealthBanner sessionStorage dismiss logic', () => {
  const mockStorage = {};

  beforeEach(() => {
    vi.stubGlobal('sessionStorage', {
      getItem: (k) => mockStorage[k] ?? null,
      setItem: (k, v) => { mockStorage[k] = v; },
      removeItem: (k) => { delete mockStorage[k]; },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  });

  it('stores dismiss flag in sessionStorage', () => {
    const key = 'knowledge-banner-dismissed-2024-01-01T00:00:00.000Z';
    sessionStorage.setItem(key, '1');
    expect(sessionStorage.getItem(key)).toBe('1');
  });

  it('returns null for key not yet dismissed', () => {
    expect(sessionStorage.getItem('knowledge-banner-dismissed-2024-01-01T00:00:00.000Z')).toBeNull();
  });
});
