/**
 * Resolve the Tasker API base URL for the viewer.
 *
 * Priority:
 * 1) Build-time env: GATSBY_TASKER_API_URL
 * 2) Runtime window injection: window.TASKER_API_URL
 * 3) Optional runtime config object: window.VIEWER_CONFIG.apiUrl
 * 4) Empty string (relative) to allow proxy setups
 */
export function getApiBase() {
  if (typeof process !== "undefined" && process.env.GATSBY_TASKER_API_URL) {
    return process.env.GATSBY_TASKER_API_URL;
  }
  if (typeof window !== "undefined") {
    if (window.TASKER_API_URL) return window.TASKER_API_URL;
    if (window.VIEWER_CONFIG?.apiUrl) return window.VIEWER_CONFIG.apiUrl;
  }
  return "";
}

export default getApiBase;
