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

export default getApiBase
