import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest';

const originalEnv = { ...process.env };
const originalWindow = globalThis.window;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
  delete globalThis.window;
});

afterEach(() => {
  process.env = { ...originalEnv };
  globalThis.window = originalWindow;
  globalThis.fetch = originalFetch;
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

  it('uses localhost API fallback only for Gatsby dev on port 8000', async () => {
    globalThis.window = { location: { hostname: 'localhost', port: '8000' } };
    const { getApiBase } = await import('../src/utils/api.js');
    expect(getApiBase()).toBe('http://localhost:4300');
  });

  it('keeps localhost proxy deployments on same-origin when served on 8080', async () => {
    globalThis.window = { location: { hostname: 'localhost', port: '8080' } };
    const { getApiBase } = await import('../src/utils/api.js');
    expect(getApiBase()).toBe('');
  });

  it('returns empty string by default (same-origin via proxy)', async () => {
    const { getApiBase } = await import('../src/utils/api.js');
    expect(getApiBase()).toBe('');
  });
});

describe('apiFetch retry policy', () => {
  it('retries on 5xx and succeeds on a later attempt', async () => {
    process.env.GATSBY_VAULT_API_URL = 'http://api.example.com';
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    globalThis.fetch = mockFetch;

    const { apiFetch } = await import('../src/utils/api.js');
    const response = await apiFetch('/api/v1/health', undefined, {
      retries: 3,
      retryDelayMs: 0,
      retryMultiplier: 1,
    });

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe('http://api.example.com/api/v1/health');
  });

  it('does not retry on 4xx responses', async () => {
    process.env.GATSBY_VAULT_API_URL = 'http://api.example.com';
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    globalThis.fetch = mockFetch;

    const { apiFetch } = await import('../src/utils/api.js');
    const response = await apiFetch('/api/v1/missing', undefined, {
      retries: 3,
      retryDelayMs: 0,
      retryMultiplier: 1,
    });

    expect(response.status).toBe(404);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on network errors and then succeeds', async () => {
    process.env.GATSBY_VAULT_API_URL = 'http://api.example.com';
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockResolvedValueOnce({ ok: true, status: 200 });
    globalThis.fetch = mockFetch;

    const { apiFetch } = await import('../src/utils/api.js');
    const response = await apiFetch('/api/v1/tasks', undefined, {
      retries: 3,
      retryDelayMs: 0,
      retryMultiplier: 1,
    });

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
