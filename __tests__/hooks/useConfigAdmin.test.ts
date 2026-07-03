import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('useConfigAdmin', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })));
  });

  it('targets only API bridge endpoints', async () => {
    const { getApiBaseForPath } = await import('../../src/utils/api');
    expect(getApiBaseForPath('/api/v1/config/status')).toBe('');
    expect(getApiBaseForPath('/api/v1/config/apply')).toBe('');
  });
});
