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
  it('prefers VAULT_API_URL and trims trailing slash', async () => {
    process.env.VAULT_API_URL = 'http://api.example.com/';
    const { getApiBase } = await import('../src/utils/api.js');
    expect(getApiBase()).toBe('http://api.example.com');
  });

  it('falls back to API_PROXY_URL for server-runtime internal API calls', async () => {
    delete process.env.VAULT_API_URL;
    process.env.API_PROXY_URL = 'http://127.0.0.1:4300/';
    const { getApiBase } = await import('../src/utils/api.js');
    expect(getApiBase()).toBe('http://127.0.0.1:4300');
  });

  it('routes tensura requests to TENSURA_BASE_URL', async () => {
    process.env.TENSURA_BASE_URL = 'http://127.0.0.1:8080/';
    const { getApiBaseForPath } = await import('../src/utils/api.js');
    expect(
      getApiBaseForPath('/tensura/v1/agent-server/threads/thread-1/stream')
    ).toBe('http://127.0.0.1:8080');
  });

  it('ignores empty VAULT_API_URL and uses API_PROXY_URL', async () => {
    process.env.VAULT_API_URL = '   ';
    process.env.API_PROXY_URL = 'http://api-internal:4300/';
    const { getApiBase } = await import('../src/utils/api.js');
    expect(getApiBase()).toBe('http://api-internal:4300');
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

  it('keeps same-origin default when served on port 8000', async () => {
    globalThis.window = { location: { hostname: 'localhost', port: '8000' } };
    const { getApiBase } = await import('../src/utils/api.js');
    expect(getApiBase()).toBe('');
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
    process.env.VAULT_API_URL = 'http://api.example.com';
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

  it('uses TENSURA_BASE_URL for tensura requests', async () => {
    process.env.TENSURA_BASE_URL = 'http://tensura.example.com';
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    globalThis.fetch = mockFetch;

    const { apiFetch } = await import('../src/utils/api.js');
    await apiFetch('/tensura/v1/agent-server/threads/thread-abc/stream', undefined, {
      retries: 0,
      retryDelayMs: 0,
      retryMultiplier: 1,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe(
      'http://tensura.example.com/tensura/v1/agent-server/threads/thread-abc/stream'
    );
  });

  it('falls back to same-origin tensura requests when no explicit base is configured in the browser', async () => {
    globalThis.window = { location: { hostname: 'localhost', port: '8080' } };
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    globalThis.fetch = mockFetch;

    const { apiFetch } = await import('../src/utils/api.js');
    await apiFetch('/tensura/v1/agent-server/threads/thread-abc/stream', undefined, {
      retries: 0,
      retryDelayMs: 0,
      retryMultiplier: 1,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe(
      '/tensura/v1/agent-server/threads/thread-abc/stream'
    );
  });

  it('does not retry on 4xx responses', async () => {
    process.env.VAULT_API_URL = 'http://api.example.com';
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
    process.env.VAULT_API_URL = 'http://api.example.com';
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

describe('apiFetch internal server token mode', () => {
  it('mints once and reuses cached bearer token on server runtime', async () => {
    process.env.VAULT_API_URL = 'http://api.example.com';
    process.env.VIEWER_INTERNAL_APP_API_KEY = 'viewer-app-key';
    process.env.VIEWER_AUTH_INTERNAL_URL = 'http://auth.internal:3001';

    const mintedToken = 'header.payload.signature';
    const mockFetch = vi.fn().mockImplementation((url, init) => {
      if (url === 'http://auth.internal:3001/auth/token/client') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ accessToken: mintedToken, expiresIn: '15m' }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      });
    });
    globalThis.fetch = mockFetch;

    const { apiFetch } = await import('../src/utils/api.js');
    await apiFetch('/api/v1/tools');
    await apiFetch('/api/v1/tasks');

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch.mock.calls[0][0]).toBe(
      'http://auth.internal:3001/auth/token/client'
    );

    const firstApiHeaders = new Headers(mockFetch.mock.calls[1][1]?.headers);
    const secondApiHeaders = new Headers(mockFetch.mock.calls[2][1]?.headers);
    expect(firstApiHeaders.get('Authorization')).toBe(`Bearer ${mintedToken}`);
    expect(firstApiHeaders.get('X-Vault-Service-Auth')).toBe('bearer');
    expect(secondApiHeaders.get('Authorization')).toBe(`Bearer ${mintedToken}`);
    expect(secondApiHeaders.get('X-Vault-Service-Auth')).toBe('bearer');
  });

  it('uses AUTH_MCP_API_KEY and AUTH_SERVICE_URL fallbacks when viewer vars are absent', async () => {
    process.env.VAULT_API_URL = 'http://api.example.com';
    delete process.env.VIEWER_INTERNAL_APP_API_KEY;
    delete process.env.VIEWER_AUTH_INTERNAL_URL;
    process.env.AUTH_MCP_API_KEY = 'fallback-key';
    process.env.AUTH_SERVICE_URL = 'http://auth.service:3001';

    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url === 'http://auth.service:3001/auth/token/client') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            accessToken: 'fallback.token.value',
            expiresIn: '10m',
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
    globalThis.fetch = mockFetch;

    const { apiFetch } = await import('../src/utils/api.js');
    await apiFetch('/api/v1/tools');

    expect(mockFetch.mock.calls[0][0]).toBe(
      'http://auth.service:3001/auth/token/client'
    );
    const tokenHeaders = new Headers(mockFetch.mock.calls[0][1]?.headers);
    expect(tokenHeaders.get('X-API-Key')).toBe('fallback-key');
  });

  it('fails loudly when configured internal token mint cannot be obtained', async () => {
    process.env.VAULT_API_URL = 'http://api.example.com';
    process.env.VIEWER_INTERNAL_APP_API_KEY = 'bad-key';
    process.env.VIEWER_AUTH_INTERNAL_URL = 'http://auth.internal:3001';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'invalid api key',
    });
    globalThis.fetch = mockFetch;

    const { apiFetch } = await import('../src/utils/api.js');

    await expect(apiFetch('/api/v1/tools')).rejects.toThrow(
      'Internal token mode configured but token mint failed'
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe(
      'http://auth.internal:3001/auth/token/client'
    );
  });

  it('does not mint or attach server token in browser runtime', async () => {
    globalThis.window = {
      location: { hostname: 'localhost', port: '8080' },
    };
    process.env.VIEWER_INTERNAL_APP_API_KEY = 'viewer-app-key';
    process.env.VIEWER_AUTH_INTERNAL_URL = 'http://auth.internal:3001';

    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    globalThis.fetch = mockFetch;

    const { apiFetch } = await import('../src/utils/api.js');
    await apiFetch('/api/v1/tasks');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe('/api/v1/tasks');
    const headers = new Headers(mockFetch.mock.calls[0][1]?.headers);
    expect(headers.get('Authorization')).toBeNull();
    expect(headers.get('X-Vault-Service-Auth')).toBeNull();
  });

  it('sends browser requests with credentials included by default', async () => {
    globalThis.window = {
      location: { hostname: 'localhost', port: '8080' },
    };

    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    globalThis.fetch = mockFetch;

    const { apiFetch } = await import('../src/utils/api.js');
    await apiFetch('/api/v1/tasks');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][1]?.credentials).toBe('include');
  });
});
