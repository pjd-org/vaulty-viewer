import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
function formatRelativeTime(isoString) {
  const diffMs = Date.now() - Date.parse(isoString);
  if (!Number.isFinite(diffMs) || diffMs < 0) return "unknown time ago";
  const minutes = Math.floor(diffMs / 6e4);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(diffMs / 36e5);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(diffMs / 864e5);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}
function KnowledgeHealthBanner({ health, loading }) {
  const dismissKey = health ? `knowledge-banner-dismissed-${health.graph_generated}` : null;
  const [dismissed, setDismissed] = useState(() => {
    if (!dismissKey || typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(dismissKey) === "1";
  });
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "knowledge-health-banner knowledge-health-banner--loading", children: /* @__PURE__ */ jsx("div", { className: "skeleton skeleton--text", style: { width: "60%" } }) });
  }
  if (!health) return null;
  const handleDismiss = () => {
    if (dismissKey && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(dismissKey, "1");
    }
    setDismissed(true);
  };
  if (health.node_count === 0) {
    return /* @__PURE__ */ jsx("div", { className: "knowledge-health-banner knowledge-health-banner--error", children: "No knowledge notes found — run the build pipeline first." });
  }
  if (health.is_stale) {
    return /* @__PURE__ */ jsxs("div", { className: "knowledge-health-banner knowledge-health-banner--warning", children: [
      "Graph index is stale (last built: ",
      formatRelativeTime(health.graph_generated),
      ")"
    ] });
  }
  if (health.unresolved_link_count > 50) {
    return /* @__PURE__ */ jsxs("div", { className: "knowledge-health-banner knowledge-health-banner--warning", children: [
      health.unresolved_link_count,
      " unresolved wikilinks detected"
    ] });
  }
  if (dismissed) return null;
  const total = health.node_count;
  return /* @__PURE__ */ jsxs("div", { className: "knowledge-health-banner knowledge-health-banner--success", children: [
    total,
    " note",
    total !== 1 ? "s" : "",
    " · built ",
    formatRelativeTime(health.graph_generated),
    /* @__PURE__ */ jsx(
      "button",
      {
        className: "knowledge-health-banner__dismiss",
        onClick: handleDismiss,
        "aria-label": "Dismiss",
        children: "✕"
      }
    )
  ] });
}
export {
  KnowledgeHealthBanner as K
};
