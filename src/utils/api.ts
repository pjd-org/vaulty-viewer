/**
 * Resolve the Vault API base URL for the viewer.
 *
 * Priority:
 * 1) Build-time env: GATSBY_VAULT_API_URL
 * 2) Runtime window injection: window.VAULT_API_URL
 * 3) Optional runtime config object: window.VIEWER_CONFIG.apiUrl
 * 4) Local dev fallback on :8000 (points to :4300 API)
 * 5) Same-origin /api (relative)
 */

type ViewerConfig = {
  apiUrl?: string
}

declare global {
  interface Window {
    VAULT_API_URL?: string
    VIEWER_CONFIG?: ViewerConfig
  }
}

const strip = (url: string) => url.replace(/\/+$/, '')

type RetryOptions = {
  retries?: number
  retryDelayMs?: number
  retryMultiplier?: number
}

const DEFAULT_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 300
const DEFAULT_RETRY_MULTIPLIER = 2

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value)

const joinApiPath = (base: string, path: string) => {
  if (isAbsoluteUrl(path)) return path
  if (path.startsWith('/')) return `${base}${path}`
  return `${base}/${path}`
}

const shouldRetryStatus = (status: number) => status >= 500 && status <= 599

const shouldRetryError = (error: unknown) => {
  if (error instanceof DOMException && error.name === 'AbortError') return false
  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    String((error as { name: unknown }).name) === 'AbortError'
  ) {
    return false
  }
  return true
}

export function getApiBase(): string {
  if (typeof process !== 'undefined' && process.env?.GATSBY_VAULT_API_URL) {
    return strip(process.env.GATSBY_VAULT_API_URL)
  }

  if (typeof window !== 'undefined') {
    if (window.VAULT_API_URL) {
      return strip(window.VAULT_API_URL)
    }

    if (window.VIEWER_CONFIG?.apiUrl) {
      return strip(window.VIEWER_CONFIG.apiUrl)
    }

    const { hostname, port } = window.location || {}

    if (hostname && /^(localhost|127\.0\.0\.1)$/.test(hostname)) {
      if (port === '8000') {
        return 'http://localhost:4300'
      }
    }

    return ''
  }

  return ''
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  const retries = retryOptions?.retries ?? DEFAULT_RETRIES
  let delayMs = retryOptions?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
  const retryMultiplier =
    retryOptions?.retryMultiplier ?? DEFAULT_RETRY_MULTIPLIER
  const url = joinApiPath(getApiBase(), path)

  let attempt = 0
  while (true) {
    try {
      const response = await fetch(url, init)
      const canRetry = shouldRetryStatus(response.status) && attempt < retries
      if (!canRetry) {
        return response
      }
    } catch (error) {
      const canRetry = shouldRetryError(error) && attempt < retries
      if (!canRetry) {
        throw error
      }
    }

    await sleep(delayMs)
    delayMs *= retryMultiplier
    attempt += 1
  }
}

export default getApiBase
