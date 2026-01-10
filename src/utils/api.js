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
  const strip = (url) => url.replace(/\/+$/, "");

  if (typeof process !== "undefined" && process.env.GATSBY_TASKER_API_URL) {
    return strip(process.env.GATSBY_TASKER_API_URL);
  }
  if (typeof window !== "undefined") {
    if (window.TASKER_API_URL) return strip(window.TASKER_API_URL);
    if (window.VIEWER_CONFIG?.apiUrl) return strip(window.VIEWER_CONFIG.apiUrl);
    // Fallback: assume local API on 4200 when running viewer locally
    const origin = window.location?.origin;
    if (origin && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
      return `${origin.replace(/:\d+$/, "")}:4200`;
    }
  }
  return "";
}

export default getApiBase;
