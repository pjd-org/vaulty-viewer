import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest';

const originalEnv = { ...process.env };
const originalWindow = globalThis.window;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
  delete globalThis.window;
});

afterEach(() => {
  process.env = { ...originalEnv };
  globalThis.window = originalWindow;
});

describe('getApiBase', () => {
  it('prefers GATSBY_VAULT_API_URL and trims trailing slash', async () => {
    process.env.GATSBY_VAULT_API_URL = 'http://api.example.com/';
    const { getApiBase } = await import('../src/utils/api.js');
    expect(getApiBase()).toBe('http://api.example.com');
  });

  it('uses window.VAULT_API_URL when set', async () => {
    globalThis.window = { VAULT_API_URL: 'http://pod-api:4300/' };
    const { getApiBase } = await import('../src/utils/api.js');
    expect(getApiBase()).toBe('http://pod-api:4300');
  });

  it('falls back to window.VIEWER_CONFIG.apiUrl', async () => {
    globalThis.window = { VIEWER_CONFIG: { apiUrl: 'http://from-config:9999/' } };
    const { getApiBase } = await import('../src/utils/api.js');
    expect(getApiBase()).toBe('http://from-config:9999');
  });

  it('returns empty string by default (same-origin via proxy)', async () => {
    const { getApiBase } = await import('../src/utils/api.js');
    expect(getApiBase()).toBe('');
  });
});
