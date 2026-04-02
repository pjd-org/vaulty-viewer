import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import React__default from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { y as useAvatar, z as deriveReadiness, A as isStale, B as formatTimeBudget, D as isMetricReal, V as VitalsPanel, E as ReadinessCard, F as apiBadgeText, G as deriveCapacityGuidance } from "./router-Dve3S_a4.js";
import "@tanstack/react-query";
import "zustand";
import "clsx";
function ReadinessHeader({
  profile,
  readiness,
  flags,
  stale,
  updated,
  loading,
  apiStatus,
  onRefresh,
  capacityLabel,
  timeBudgetLabel
}) {
  const nameIsReal = profile.name && profile.name !== "Unknown" && profile.name !== "Vault User";
  const titleIsReal = profile.title && profile.title !== "Vault User" && profile.title !== "Unknown";
  const lastUpdatedStr = updated ? new Date(updated).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  }) : null;
  return /* @__PURE__ */ jsxs("header", { className: "os-header", children: [
    /* @__PURE__ */ jsxs("div", { className: "os-header__identity", children: [
      nameIsReal && /* @__PURE__ */ jsx("h1", { className: "os-header__name", children: profile.name }),
      titleIsReal && /* @__PURE__ */ jsx("p", { className: "os-header__title", children: profile.title })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "os-header__readiness", children: [
      /* @__PURE__ */ jsx(ReadinessCard, { readiness, capacityLabel, timeBudgetLabel }),
      flags.stagnation && /* @__PURE__ */ jsx("span", { className: "os-flag os-flag--warning", children: "Stagnation detected" }),
      flags.entropyWarning && /* @__PURE__ */ jsx("span", { className: "os-flag os-flag--danger", children: "High entropy" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "os-header__meta", children: [
      stale && lastUpdatedStr && /* @__PURE__ */ jsxs("span", { className: "os-stale", children: [
        "State may be stale — ",
        lastUpdatedStr
      ] }),
      !stale && lastUpdatedStr && /* @__PURE__ */ jsxs("span", { className: "os-updated", children: [
        "Updated ",
        lastUpdatedStr
      ] }),
      /* @__PURE__ */ jsx("span", { className: `api-badge api-badge--${apiStatus}`, children: apiBadgeText(apiStatus) }),
      /* @__PURE__ */ jsx("button", { className: "os-refresh", onClick: onRefresh, disabled: loading, title: "Refresh state", children: "↻" })
    ] })
  ] });
}
function CapacityGroup({
  capacity
}) {
  const time = formatTimeBudget(capacity.timeBudgetMin);
  const guidance = deriveCapacityGuidance(capacity);
  const hasAny = isMetricReal(capacity.timeBudgetMin) || isMetricReal(capacity.focusCostMax) || isMetricReal(capacity.effortScoreMax);
  if (!hasAny && !guidance) return null;
  return /* @__PURE__ */ jsxs("section", { className: "os-section", children: [
    /* @__PURE__ */ jsx("p", { className: "os-section__label", children: "Capacity" }),
    /* @__PURE__ */ jsxs("div", { className: "capacity-chips", children: [
      time && /* @__PURE__ */ jsxs("span", { className: "chip chip--capacity-time", children: [
        time,
        " available"
      ] }),
      isMetricReal(capacity.focusCostMax) && /* @__PURE__ */ jsxs("span", { className: "chip chip--capacity-focus", children: [
        "Focus ≤ ",
        capacity.focusCostMax
      ] }),
      isMetricReal(capacity.effortScoreMax) && /* @__PURE__ */ jsxs("span", { className: "chip chip--capacity-effort", children: [
        "Effort ≤ ",
        capacity.effortScoreMax
      ] })
    ] }),
    guidance && /* @__PURE__ */ jsx("p", { className: "os-guidance", children: guidance })
  ] });
}
function ActionGuidancePanel({
  readiness,
  capacity
}) {
  const focusParam = readiness.maxFocusCost;
  const effortParam = readiness.maxEffortScore;
  const budget = capacity.timeBudgetMin ?? 60;
  const tasksHref = focusParam !== void 0 || effortParam !== void 0 ? `/?maxFocusCost=${focusParam ?? ""}&maxEffort=${effortParam ?? ""}` : "/";
  return /* @__PURE__ */ jsxs("section", { className: "os-section action-guidance", children: [
    /* @__PURE__ */ jsx("p", { className: "os-section__label", children: "What to do now" }),
    /* @__PURE__ */ jsx("p", { className: "action-guidance__text", children: readiness.description }),
    /* @__PURE__ */ jsxs("div", { className: "action-guidance__ctas", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", search: {
        session: "1"
      }, className: "na-card__btn na-card__btn--start", children: [
        "Start ",
        readiness.sessionType,
        " session",
        budget > 0 && ` (${formatTimeBudget(Math.min(budget, 90))})`
      ] }),
      /* @__PURE__ */ jsx(Link, { to: tasksHref, className: "na-card__btn na-card__btn--done", children: "See matched tasks" })
    ] })
  ] });
}
function ExecutionStats({
  vitals
}) {
  const tasksToday = vitals.tasksCompletedToday ?? 0;
  const sessionsWeek = vitals.sessionsCompletedThisWeek ?? 0;
  if (tasksToday === 0 && sessionsWeek === 0) return null;
  return /* @__PURE__ */ jsxs("section", { className: "os-section", children: [
    /* @__PURE__ */ jsx("p", { className: "os-section__label", children: "Today" }),
    /* @__PURE__ */ jsxs("div", { className: "exec-stats", children: [
      /* @__PURE__ */ jsxs("div", { className: "exec-stat", children: [
        /* @__PURE__ */ jsx("span", { className: "exec-stat__value", children: tasksToday }),
        /* @__PURE__ */ jsx("span", { className: "exec-stat__label", children: "tasks done" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "exec-stat", children: [
        /* @__PURE__ */ jsx("span", { className: "exec-stat__value", children: sessionsWeek }),
        /* @__PURE__ */ jsx("span", { className: "exec-stat__label", children: "sessions this week" })
      ] })
    ] })
  ] });
}
function ProgressionSummary({
  level,
  currentXp,
  xpToNext,
  progression
}) {
  const streakDays = progression.streakDays ?? 0;
  const streakUpdated = progression.streakUpdated;
  const isStreakActive = streakUpdated && (() => {
    const diff = (Date.now() - new Date(streakUpdated).getTime()) / (1e3 * 60 * 60 * 24);
    return diff <= 1;
  })();
  return /* @__PURE__ */ jsxs("div", { className: "progression-summary", children: [
    streakDays > 0 && /* @__PURE__ */ jsxs("span", { className: `chip ${isStreakActive ? "chip--score" : ""}`, children: [
      isStreakActive ? "🔥" : "○",
      " ",
      streakDays,
      "d streak"
    ] }),
    level > 0 && /* @__PURE__ */ jsxs("span", { className: "chip chip--tag", children: [
      "Level ",
      level,
      " · ",
      currentXp.toLocaleString(),
      " /",
      " ",
      xpToNext.toLocaleString(),
      " XP"
    ] })
  ] });
}
function AvatarRoute({
  onRequestClose
} = {}) {
  const navigate = useNavigate();
  const {
    avatar,
    loading,
    error,
    refresh,
    level,
    currentXp,
    xpToNext,
    apiStatus
  } = useAvatar();
  const vitals = avatar.vitals ?? {};
  const capacity = avatar.capacity ?? {};
  const progression = avatar.progression ?? {};
  const profile = avatar.profile ?? {};
  const flags = avatar.flags ?? {};
  const readiness = deriveReadiness(vitals, capacity);
  const stale = isStale(avatar.updated);
  const closeOverlay = React__default.useCallback(() => {
    if (onRequestClose) {
      onRequestClose();
      return;
    }
    void navigate({
      to: "/",
      search: {}
    });
  }, [navigate, onRequestClose]);
  React__default.useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeOverlay();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeOverlay]);
  return /* @__PURE__ */ jsx("div", { className: "route-modal-overlay", onClick: closeOverlay, children: /* @__PURE__ */ jsxs("section", { className: "route-modal-card route-modal-card--avatar genie-surface genie-surface--overlay", onClick: (event) => event.stopPropagation(), onKeyDown: (event) => event.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-label": "Avatar", children: [
    /* @__PURE__ */ jsx("button", { type: "button", className: "route-modal-close", onClick: closeOverlay, "aria-label": "Close avatar", children: "✕" }),
    /* @__PURE__ */ jsxs("main", { className: "avatar-os-page route-modal-scroll route-modal-body", children: [
      /* @__PURE__ */ jsx("nav", { className: "breadcrumb", children: /* @__PURE__ */ jsx(Link, { to: "/", search: {}, className: "back-link", children: "← Focus" }) }),
      error && /* @__PURE__ */ jsxs("div", { className: "focus-offline", children: [
        error,
        /* @__PURE__ */ jsx("button", { onClick: refresh, className: "os-refresh ml-2", children: "Retry" })
      ] }),
      /* @__PURE__ */ jsx(ReadinessHeader, { profile, readiness, flags, stale, updated: avatar.updated, loading, apiStatus, onRefresh: refresh, capacityLabel: (() => {
        const parts = [];
        if (isMetricReal(capacity.focusCostMax)) parts.push(`Focus ≤ ${capacity.focusCostMax}`);
        if (isMetricReal(capacity.effortScoreMax)) parts.push(`Effort ≤ ${capacity.effortScoreMax}`);
        return parts.join(" · ") || "No capacity set";
      })(), timeBudgetLabel: formatTimeBudget(capacity.timeBudgetMin) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "focus-loading", children: "Loading…" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("section", { className: "os-section", children: [
          /* @__PURE__ */ jsx("p", { className: "os-section__label", children: "Vitals" }),
          /* @__PURE__ */ jsx(VitalsPanel, { vitals })
        ] }),
        /* @__PURE__ */ jsx(CapacityGroup, { capacity }),
        /* @__PURE__ */ jsx(ActionGuidancePanel, { readiness, capacity }),
        /* @__PURE__ */ jsx(ExecutionStats, { vitals }),
        /* @__PURE__ */ jsxs("details", { className: "avatar-progression", children: [
          /* @__PURE__ */ jsx("summary", { className: "avatar-progression__summary", children: "Progression" }),
          /* @__PURE__ */ jsx(ProgressionSummary, { level, currentXp, xpToNext, progression })
        ] }),
        avatar.updated && /* @__PURE__ */ jsx("div", { className: "avatar-footer", children: /* @__PURE__ */ jsx("a", { href: "/note/notes%2Fcore%2Favatar%2FAvatar", className: "avatar-link", children: "Open avatar note →" }) })
      ] })
    ] })
  ] }) });
}
const SplitComponent = () => /* @__PURE__ */ jsx(AvatarRoute, {});
export {
  AvatarRoute,
  SplitComponent as component
};
