/**
 * Resolve the Vault API base URL for the viewer.
 *
 * Priority:
 * Browser runtime:
 * 1) window.VAULT_API_URL
 * 2) window.VIEWER_CONFIG.apiUrl
 * 3) Same-origin /api (relative)
 *
 * Tensura requests:
 * 1) window.TENSURA_BASE_URL / window.VIEWER_CONFIG.tensuraUrl / TENSURA_BASE_URL
 * 2) Same-origin /tensura (relative) in the browser
 * 3) Server-side absolute base from TENSURA_API_URL when configured
 *
 * Server runtime:
 * 1) VAULT_API_URL
 * 2) API_PROXY_URL (internal pod/service target)
 * 3) Same-origin /api (relative)
 */

type ViewerConfig = {
  apiUrl?: string;
  tensuraUrl?: string;
};

/**
 * Thrown when the API responds with HTTP 401 (Unauthenticated).
 * Consumers can use `instanceof UnauthenticatedError` to distinguish
 * auth failures from generic API errors.
 */
export class UnauthenticatedError extends Error {
  readonly status = 401;
  constructor(message?: string) {
    super(message ?? 'Unauthenticated');
    this.name = 'UnauthenticatedError';
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message?: string) {
    super(message ?? 'Forbidden');
    this.name = 'ForbiddenError';
  }
}

declare global {
  interface Window {
    VAULT_API_URL?: string;
    TENSURA_BASE_URL?: string;
    VIEWER_CONFIG?: ViewerConfig;
  }
}

const strip = (url: string) => url.replace(/\/+$/, '');

type RetryOptions = {
  retries?: number;
  retryDelayMs?: number;
  retryMultiplier?: number;
};

type InternalTokenConfig = {
  apiKey: string;
  authBase: string;
};

type TokenClientResponse = {
  accessToken?: string;
  expiresIn?: string | number;
};

type CachedToken = {
  token: string;
  expiresAtMs: number;
};

const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 300;
const DEFAULT_RETRY_MULTIPLIER = 2;
const INTERNAL_TOKEN_REFRESH_SKEW_MS = 30_000;
const INTERNAL_TOKEN_FALLBACK_TTL_MS = 5 * 60_000;

let cachedInternalToken: CachedToken | null = null;
let internalTokenPromise: Promise<CachedToken> | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const joinApiPath = (base: string, path: string) => {
  if (isAbsoluteUrl(path)) return path;
  if (path.startsWith('/')) return `${base}${path}`;
  return `${base}/${path}`;
};

const shouldRetryStatus = (status: number) => status >= 500 && status <= 599;

const shouldRetryError = (error: unknown) => {
  if (error instanceof DOMException && error.name === 'AbortError')
    return false;
  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    String((error as { name: unknown }).name) === 'AbortError'
  ) {
    return false;
  }
  return true;
};

const isServerRuntime = () => typeof window === 'undefined';

const isTensuraPath = (path: string) =>
  path === '/tensura' || path.startsWith('/tensura/');

const parseDurationMs = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }
  const match = trimmed.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  switch (match[2].toLowerCase()) {
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60_000;
    case 'h':
      return amount * 60 * 60_000;
    case 'd':
      return amount * 24 * 60 * 60_000;
    default:
      return null;
  }
};

const parseJwtExpiryMs = (token: string): number | null => {
  const segments = token.split('.');
  if (segments.length < 2 || !segments[1]) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(segments[1], 'base64url').toString('utf8')
    ) as { exp?: number };
    if (typeof payload.exp === 'number' && Number.isFinite(payload.exp)) {
      return payload.exp * 1000;
    }
  } catch {
    return null;
  }
  return null;
};

const resolveTokenExpiryMs = (
  accessToken: string,
  expiresIn: unknown
): number => {
  const jwtExpiryMs = parseJwtExpiryMs(accessToken);
  if (jwtExpiryMs && jwtExpiryMs > Date.now()) return jwtExpiryMs;

  if (
    typeof expiresIn === 'number' &&
    Number.isFinite(expiresIn) &&
    expiresIn > 0
  ) {
    return Date.now() + expiresIn * 1000;
  }
  if (typeof expiresIn === 'string') {
    const durationMs = parseDurationMs(expiresIn);
    if (durationMs && durationMs > 0) {
      return Date.now() + durationMs;
    }
  }
  return Date.now() + INTERNAL_TOKEN_FALLBACK_TTL_MS;
};

const getInternalTokenConfig = (): InternalTokenConfig | null => {
  if (!isServerRuntime() || typeof process === 'undefined') return null;

  const env = process.env ?? {};
  const apiKey =
    env.VIEWER_INTERNAL_APP_API_KEY?.trim() ||
    env.AUTH_MCP_API_KEY?.trim() ||
    '';
  if (!apiKey) return null;

  const authBase =
    env.VIEWER_AUTH_INTERNAL_URL?.trim() ||
    env.AUTH_SERVICE_URL?.trim() ||
    'http://127.0.0.1:3001';

  return {
    apiKey,
    authBase: strip(authBase),
  };
};

const getTensuraBase = (): string => {
  if (typeof window !== 'undefined') {
    if (window.TENSURA_BASE_URL) {
      return strip(window.TENSURA_BASE_URL);
    }

    if (window.VIEWER_CONFIG?.tensuraUrl) {
      return strip(window.VIEWER_CONFIG.tensuraUrl);
    }
  }

  if (typeof process !== 'undefined') {
    const tensuraBaseUrl =
      process.env?.TENSURA_BASE_URL?.trim() ||
      process.env?.TENSURA_API_URL?.trim();
    if (tensuraBaseUrl) {
      return strip(tensuraBaseUrl);
    }
  }

  return '';
};

const withAuthorizationHeader = (
  init: RequestInit | undefined,
  token: string
): RequestInit => {
  const headers = new Headers(init?.headers);
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('X-Vault-Service-Auth')) {
    headers.set('X-Vault-Service-Auth', 'bearer');
  }
  return {
    ...(init || {}),
    headers,
  };
};

const withDefaultCredentials = (
  init: RequestInit | undefined,
  url?: string
): RequestInit => {
  if (init?.credentials) return init;
  const baseInit: RequestInit = { ...(init || {}) };

  // In browser: default to 'same-origin' for cross-origin targets and
  // only use 'include' for same-origin requests. Callers may opt-in
  // to cross-site credentials by providing `init.credentials` explicitly.
  if (typeof window !== 'undefined' && url) {
    try {
      const target = new URL(url, window.location.origin);
      if (target.origin === window.location.origin) {
        baseInit.credentials = 'include';
      } else {
        baseInit.credentials = 'same-origin';
      }
      return baseInit;
    } catch {
      // Fall through to safe default
    }
  }

  // Server runtime or unknown: use conservative default
  baseInit.credentials = 'same-origin';
  return baseInit;
};

const mintInternalToken = async (
  config: InternalTokenConfig
): Promise<CachedToken> => {
  const response = await fetch(`${config.authBase}/auth/token/client`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
    },
    body: JSON.stringify({ audience: 'api' }),
  });

  if (!response.ok) {
    const body = (await response.text().catch(() => '')).trim();
    const details = body ? `: ${body.slice(0, 200)}` : '';
    throw new Error(`Token mint failed (${response.status})${details}`);
  }

  const payload = (await response
    .json()
    .catch(() => null)) as TokenClientResponse | null;
  const accessToken =
    typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';
  if (!accessToken) {
    throw new Error('Token mint response missing accessToken');
  }

  return {
    token: accessToken,
    expiresAtMs: resolveTokenExpiryMs(accessToken, payload?.expiresIn),
  };
};

const hasValidCachedToken = (cache: CachedToken | null): cache is CachedToken =>
  Boolean(
    cache && cache.expiresAtMs - INTERNAL_TOKEN_REFRESH_SKEW_MS > Date.now()
  );

const getInternalToken = async (
  config: InternalTokenConfig
): Promise<string> => {
  if (hasValidCachedToken(cachedInternalToken)) {
    return cachedInternalToken.token;
  }

  if (!internalTokenPromise) {
    internalTokenPromise = mintInternalToken(config)
      .then((token) => {
        cachedInternalToken = token;
        return token;
      })
      .finally(() => {
        internalTokenPromise = null;
      });
  }

  const token = await internalTokenPromise;
  return token.token;
};

const getRequestInit = async (
  init?: RequestInit
): Promise<RequestInit | undefined> => {
  const internalTokenConfig = getInternalTokenConfig();
  if (!internalTokenConfig) return init;

  let token: string;
  try {
    token = await getInternalToken(internalTokenConfig);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[viewer-api] Internal token mode configured but token mint failed: ${message}`
    );
  }

  return withAuthorizationHeader(init, token);
};

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    if (window.VAULT_API_URL) {
      return strip(window.VAULT_API_URL);
    }

    if (window.VIEWER_CONFIG?.apiUrl) {
      return strip(window.VIEWER_CONFIG.apiUrl);
    }

    return '';
  }

  if (typeof process !== 'undefined') {
    const vaultApiUrl = process.env?.VAULT_API_URL?.trim();
    if (vaultApiUrl) {
      return strip(vaultApiUrl);
    }

    const apiProxyUrl = process.env?.API_PROXY_URL?.trim();
    if (apiProxyUrl) {
      return strip(apiProxyUrl);
    }
  }

  return '';
}

export function getApiBaseForPath(path: string): string {
  return isTensuraPath(path) ? getTensuraBase() : getApiBase();
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  const retries = retryOptions?.retries ?? DEFAULT_RETRIES;
  let delayMs = retryOptions?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const retryMultiplier =
    retryOptions?.retryMultiplier ?? DEFAULT_RETRY_MULTIPLIER;
  const base = getApiBaseForPath(path);
  if (isTensuraPath(path) && !base && isServerRuntime()) {
    throw new Error(
      `[viewer-api] TENSURA_BASE_URL is not configured for ${path}; set TENSURA_BASE_URL or VIEWER_CONFIG.tensuraUrl`
    );
  }
  const url = joinApiPath(base, path);

  let attempt = 0;
  while (true) {
    // Resolve auth token on each attempt so retries use a fresh token
    // if the previous one expired during backoff
    const requestInit = withDefaultCredentials(await getRequestInit(init), url);
    try {
      const response = await fetch(url, requestInit);
      const canRetry = shouldRetryStatus(response.status) && attempt < retries;
      if (!canRetry) {
        return response;
      }
    } catch (error) {
      const canRetry = shouldRetryError(error) && attempt < retries;
      if (!canRetry) {
        throw error;
      }
    }

    await sleep(delayMs);
    delayMs *= retryMultiplier;
    attempt += 1;
  }
}

export function toApiAuthError(status: number, context: string): Error | null {
  if (status === 401) {
    return new UnauthenticatedError(`Unauthorized: ${context}`);
  }
  if (status === 403) {
    return new ForbiddenError(`Forbidden: ${context}`);
  }
  return null;
}

export default getApiBase;
