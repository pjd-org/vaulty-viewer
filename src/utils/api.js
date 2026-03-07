/**
 * Resolve the Vault API base URL for the viewer.
 *
 * Priority:
 * 1) Build-time env: GATSBY_VAULT_API_URL
 * 2) Runtime window injection: window.VAULT_API_URL
 * 3) Optional runtime config object: window.VIEWER_CONFIG.apiUrl
 * 4) Local Gatsby dev fallback on :8000
 * 5) Empty string (relative) to allow proxy setups
 */
export function getApiBase() {
  const strip = (url) => url.replace(/\/+$/, '');

  if (typeof process !== 'undefined' && process.env.GATSBY_VAULT_API_URL) {
    return strip(process.env.GATSBY_VAULT_API_URL);
  }
  if (typeof window !== 'undefined') {
    if (window.VAULT_API_URL) return strip(window.VAULT_API_URL);
    if (window.VIEWER_CONFIG?.apiUrl) return strip(window.VIEWER_CONFIG.apiUrl);
    const { hostname, port } = window.location || {};
    // Dev fallback: only when the viewer itself is served directly by Gatsby on :8000.
    // Proxy-served deployments (for example localhost:8080) must stay same-origin
    // so browser requests go through /api and satisfy the proxy CSP.
    if (hostname && hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
      if (port === '8000') {
        return 'http://localhost:4300';
      }
    }
    // Pod/production: use same-origin /api via proxy
    return '';
  }
  // Default: same-origin relative
  return '';
}

export default getApiBase;
