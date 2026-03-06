/**
 * Resolve the Vault API base URL for the viewer.
 *
 * Priority:
 * 1) Build-time env: GATSBY_VAULT_API_URL
 * 2) Runtime window injection: window.VAULT_API_URL
 * 3) Optional runtime config object: window.VIEWER_CONFIG.apiUrl
 * 4) Empty string (relative) to allow proxy setups
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
    // Dev fallback: when running Gatsby dev/serve on localhost without proxy, point at API port 4300.
    if (hostname && hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
      if (port === '8000' || port === '8080' || port === '3000') {
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
