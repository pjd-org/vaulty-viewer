import { useRouterState, Link, createFileRoute, lazyRouteComponent, useNavigate, createRootRouteWithContext, useRouter, Outlet, HeadContent, redirect, createRouter as createRouter$1 } from "@tanstack/react-router";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import React__default, { useState, useEffect, useCallback, useMemo } from "react";
import { QueryClient, useQuery, useQueryClient, useMutation, dehydrate, QueryClientProvider } from "@tanstack/react-query";
import { create } from "zustand";
import "clsx";
function AppShell$1({
  rail,
  panel,
  panelOpen = false,
  as: Main = "main",
  className = "",
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: ["min-h-screen bg-bg flex overflow-hidden", className].filter(Boolean).join(" "),
      ...props,
      children: [
        rail && /* @__PURE__ */ jsx("aside", { className: "w-sidebar shrink-0 sticky top-0 h-screen z-20", children: rail }),
        /* @__PURE__ */ jsx(Main, { className: "flex-1 min-w-0 overflow-y-auto", children }),
        panel && panelOpen && /* @__PURE__ */ jsx(
          "aside",
          {
            className: "w-panel shrink-0 sticky top-0 h-screen z-10",
            style: { borderLeft: "1px solid var(--border-glass-subtle)" },
            children: panel
          }
        )
      ]
    }
  );
}
function SidebarRail$1({
  logo,
  top,
  bottom,
  className = "",
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    "nav",
    {
      className: [
        "w-full h-full flex flex-col items-center py-4 gap-1",
        className
      ].filter(Boolean).join(" "),
      style: {
        background: "var(--surface-canvas)",
        borderRight: "1px solid var(--border-glass-subtle)",
        backdropFilter: "blur(var(--blur-md))",
        WebkitBackdropFilter: "blur(var(--blur-md))"
      },
      ...props,
      children: [
        logo && /* @__PURE__ */ jsx("div", { className: "shrink-0 mb-2", children: logo }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col items-center gap-1 w-full overflow-y-auto", children: top }),
        bottom && /* @__PURE__ */ jsx(
          "div",
          {
            className: "shrink-0 flex flex-col items-center gap-1 w-full pt-2",
            style: { borderTop: "1px solid var(--border-glass-subtle)" },
            children: bottom
          }
        )
      ]
    }
  );
}
function AppShell({ rail, panel, panelOpen = false, children }) {
  return /* @__PURE__ */ jsx(AppShell$1, { rail, panel, panelOpen, children });
}
const NAV_OVERLAY_EVENT = "viewer:nav-overlay";
function dispatchNavOverlay(type) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(NAV_OVERLAY_EVENT, {
      detail: { type }
    })
  );
}
const VIEWER_PRIMARY_NAV = [
  { label: "Home", shortLabel: "Ho", to: "/" },
  { label: "Inbox", shortLabel: "In", to: "/inbox" },
  { label: "Actions", shortLabel: "Ac", to: "/actions" },
  { label: "Automation", shortLabel: "Au", to: "/automation" },
  { label: "Work", shortLabel: "Wo", to: "/work" },
  { label: "Knowledge", shortLabel: "Kn", to: "/knowledge" },
  { label: "Portfolio", shortLabel: "Po", to: "/portfolio" },
  { label: "Bubble", shortLabel: "Bu", to: "/bubble" },
  { label: "Health", shortLabel: "He", to: "/health" },
  { label: "Graph", shortLabel: "Gr", to: "/graph" },
  { label: "Timeline", shortLabel: "Ti", to: "/timeline" },
  { label: "Archive", shortLabel: "Ar", to: "/archive" }
];
const VIEWER_UTILITY_NAV = [
  { label: "Huey", shortLabel: "Hy", to: "/huey" },
  { label: "Settings", shortLabel: "Se", to: "/settings" }
];
const VIEWER_OVERLAY_NAV = [
  { label: "Avatar", shortLabel: "Av", overlay: "avatar" },
  { label: "COD", shortLabel: "Co", overlay: "cod" }
];
const PROJECT_ROUTE_TABS = [
  { label: "Overview", to: "/project/$slug" },
  { label: "Tasks", to: "/project/$slug/tasks" },
  { label: "Knowledge", to: "/project/$slug/knowledge" },
  { label: "Automation", to: "/project/$slug/automation" },
  { label: "Timeline", to: "/project/$slug/timeline" },
  { label: "Dependencies", to: "/project/$slug/dependencies" },
  { label: "Risks", to: "/project/$slug/risks" },
  { label: "Settings", to: "/project/$slug/settings" }
];
function getProjectTabPath(slug, to = "/project/$slug") {
  return to.replace("$slug", encodeURIComponent(slug));
}
function isShellHiddenPath(pathname) {
  return pathname === "/login" || pathname === "/oauth/consent";
}
function RailItem({
  label,
  shortLabel,
  to,
  active
}) {
  return /* @__PURE__ */ jsx(
    Link,
    {
      to,
      title: label,
      "aria-label": label,
      className: [
        "flex h-10 w-10 items-center justify-center rounded-2xl border text-[10px] font-semibold uppercase tracking-[0.18em] transition-all",
        active ? "border-sky-300/30 bg-sky-300/15 text-slate-50 shadow-[0_12px_24px_rgba(56,189,248,0.18)]" : "border-white/5 bg-white/0 text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-100"
      ].join(" "),
      children: shortLabel
    }
  );
}
function OverlayItem({
  label,
  shortLabel,
  overlay,
  active
}) {
  const onClick = () => dispatchNavOverlay(overlay);
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      title: label,
      "aria-label": label,
      onClick,
      className: [
        "flex h-10 w-10 items-center justify-center rounded-2xl border text-[10px] font-semibold uppercase tracking-[0.18em] transition-all",
        active ? "border-sky-300/30 bg-sky-300/15 text-slate-50 shadow-[0_12px_24px_rgba(56,189,248,0.18)]" : "border-white/5 bg-white/0 text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-100"
      ].join(" "),
      children: shortLabel
    }
  );
}
function SidebarRail() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isActivePath = (to) => {
    if (to === "/") return pathname === "/";
    return pathname === to || pathname.startsWith(`${to}/`);
  };
  const topItems = VIEWER_PRIMARY_NAV.map((item) => /* @__PURE__ */ jsx(
    RailItem,
    {
      label: item.label,
      shortLabel: item.shortLabel,
      to: item.to,
      active: isActivePath(item.to)
    },
    item.to
  ));
  const bottomItems = /* @__PURE__ */ jsxs(Fragment, { children: [
    VIEWER_UTILITY_NAV.map((item) => /* @__PURE__ */ jsx(
      RailItem,
      {
        label: item.label,
        shortLabel: item.shortLabel,
        to: item.to,
        active: isActivePath(item.to)
      },
      item.to
    )),
    VIEWER_OVERLAY_NAV.map((item) => /* @__PURE__ */ jsx(
      OverlayItem,
      {
        label: item.label,
        shortLabel: item.shortLabel,
        overlay: item.overlay,
        active: pathname === `/${item.overlay === "cod" ? "cod-status" : item.overlay}`
      },
      item.overlay
    ))
  ] });
  return /* @__PURE__ */ jsx(
    SidebarRail$1,
    {
      logo: /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: "flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-100",
          children: "V3"
        }
      ),
      top: topItems,
      bottom: bottomItems
    }
  );
}
const VARIANT_CLASSES = {
  base: "genie-surface genie-layer-panel",
  elevated: "genie-surface genie-surface--elevated genie-layer-panel",
  hero: "genie-surface genie-surface--hero genie-layer-hero",
  utility: "genie-surface genie-surface--utility genie-layer-panel",
  overlay: "genie-surface genie-surface--overlay genie-layer-overlay"
};
function SoftPanel({
  title,
  subtitle,
  actions,
  variant = "base",
  className,
  children
}) {
  const hasHeader = title || subtitle || actions;
  return /* @__PURE__ */ jsxs(
    "section",
    {
      className: [
        "rounded-[28px] p-6",
        VARIANT_CLASSES[variant],
        className ?? ""
      ].join(" ").trim(),
      children: [
        hasHeader && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            title && /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-slate-800", children: title }),
            subtitle && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600", children: subtitle })
          ] }),
          actions && /* @__PURE__ */ jsx("div", { children: actions })
        ] }),
        children
      ]
    }
  );
}
const ProjectRouteShellContext = React__default.createContext(null);
function ProjectRouteShellProvider({
  value,
  children
}) {
  return /* @__PURE__ */ jsx(ProjectRouteShellContext.Provider, { value, children });
}
function useProjectRouteShellContext() {
  return React__default.useContext(ProjectRouteShellContext);
}
function readStringSearchParam(value) {
  if (typeof value !== "string") return void 0;
  const trimmed = value.trim();
  return trimmed || void 0;
}
function readBooleanSearchParam(value) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return void 0;
}
function readEnumSearchParam(value, allowed) {
  if (typeof value !== "string") return void 0;
  return allowed.includes(value) ? value : void 0;
}
function homeSearchParams(s) {
  return {
    q: readStringSearchParam(s.q),
    collection: readStringSearchParam(s.collection),
    session: readStringSearchParam(s.session),
    snapshot: readStringSearchParam(s.snapshot),
    detailId: readStringSearchParam(s.detailId)
  };
}
function inboxSearchParams(s) {
  return {
    view: readEnumSearchParam(s.view, ["queue", "workbench", "archive"]),
    rejectedTab: readEnumSearchParam(s.rejectedTab, ["user", "automated"]),
    sort: readEnumSearchParam(s.sort, ["newest", "oldest", "confidence"]),
    severity: readEnumSearchParam(s.severity, ["high", "medium", "low"]),
    selectedId: readStringSearchParam(s.selectedId)
  };
}
function actionsSearchParams(s) {
  return {
    sort: readEnumSearchParam(s.sort, ["urgency", "impact", "confidence", "source", "reversibility"]),
    simulatableOnly: readBooleanSearchParam(s.simulatableOnly),
    selectedId: readStringSearchParam(s.selectedId)
  };
}
function automationSearchParams(s) {
  return {
    tab: readEnumSearchParam(s.tab, ["pipelines", "runners", "huey", "schedules"]),
    subtab: readStringSearchParam(s.subtab),
    selectedId: readStringSearchParam(s.selectedId),
    autoRefresh: readBooleanSearchParam(s.autoRefresh)
  };
}
function workSearchParams(s) {
  return {
    tab: readEnumSearchParam(s.tab, ["tasks", "projects", "dependencies"]),
    status: readStringSearchParam(s.status),
    selectedId: readStringSearchParam(s.selectedId)
  };
}
function knowledgeSearchParams(s) {
  return {
    tab: readEnumSearchParam(s.tab, ["notes", "views", "memories"]),
    noteId: readStringSearchParam(s.noteId),
    mode: readEnumSearchParam(s.mode, ["read", "edit"]),
    templateId: readStringSearchParam(s.templateId),
    memoryTab: readStringSearchParam(s.memoryTab),
    projectId: readStringSearchParam(s.projectId)
  };
}
function portfolioSearchParams(s) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId)
  };
}
function bubbleSearchParams(s) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId)
  };
}
function healthSearchParams(s) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId)
  };
}
function graphSearchParams(s) {
  return {
    tab: readStringSearchParam(s.tab),
    nodeId: readStringSearchParam(s.nodeId),
    pathMode: readStringSearchParam(s.pathMode),
    entityType: readStringSearchParam(s.entityType),
    focus: readStringSearchParam(s.focus),
    selectedId: readStringSearchParam(s.selectedId)
  };
}
function timelineSearchParams(s) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
    live: readBooleanSearchParam(s.live),
    eventType: readStringSearchParam(s.eventType),
    from: readStringSearchParam(s.from),
    to: readStringSearchParam(s.to)
  };
}
function archiveSearchParams(s) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
    source: readStringSearchParam(s.source),
    scope: readStringSearchParam(s.scope),
    from: readStringSearchParam(s.from),
    to: readStringSearchParam(s.to),
    eventType: readStringSearchParam(s.eventType),
    projectId: readStringSearchParam(s.projectId)
  };
}
function projectSearchParams(s) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
    noteId: readStringSearchParam(s.noteId),
    mode: readEnumSearchParam(s.mode, ["read", "edit"]),
    templateId: readStringSearchParam(s.templateId),
    memoryTab: readStringSearchParam(s.memoryTab)
  };
}
function SectionHeader({ title, subtitle, action, className }) {
  return /* @__PURE__ */ jsxs("div", { className: ["flex items-center justify-between mb-4", className ?? ""].join(" ").trim(), children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold text-slate-600 uppercase tracking-wide", children: title }),
      subtitle && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: subtitle })
    ] }),
    action && /* @__PURE__ */ jsx("div", { children: action })
  ] });
}
function TopCommandBar() {
  return /* @__PURE__ */ jsx("div", { className: "sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "genie-surface genie-surface--overlay rounded-[24px] px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400", children: "Viewer V3" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-100", children: "COD command center" })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "flex min-w-0 flex-1 items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 lg:max-w-xl", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Search" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          "aria-label": "Search viewer",
          className: "w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none",
          placeholder: "Find notes, projects, signals, and runs",
          type: "search"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/actions",
          className: "btn-primary rounded-full px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5",
          children: "Quick Command"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/inbox",
          className: "btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-100",
          children: "Review Inbox"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/knowledge",
          className: "btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-100",
          children: "Create"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/huey",
          className: "btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-100",
          children: "Huey"
        }
      )
    ] })
  ] }) }) });
}
const useUIStore = create((set) => ({
  layout: {
    leftSidebarCollapsed: false,
    rightPanelMode: "peek",
    density: "comfortable",
    activeSurface: "home",
    mobileNavOpen: false
  },
  command: {
    paletteOpen: false,
    query: "",
    highlightedIndex: 0,
    suggestions: [],
    recentCommands: [],
    draft: ""
  },
  filters: {},
  selection: { entityId: null, entityType: null },
  detailPanel: { mode: "split", pinned: false, fallbackContent: null },
  verification: {
    latestId: null,
    visible: false,
    pinned: false,
    phase: "idle"
  },
  activeModal: null,
  inbox: { currentBucket: null, bulkSelection: [], actionSafetyGate: false },
  actions: {
    evaluationMode: "ranked",
    simulationPreviewOpen: false,
    submissionPending: false
  },
  automation: {
    autoRefresh: false,
    activeSubview: null,
    inspectionDrawerOpen: false
  },
  knowledge: {
    activeTab: "notes",
    noteEditorMode: "read",
    rawFrontmatterMode: false,
    currentNoteId: null,
    currentTemplateId: null,
    noteDraft: "",
    templateDraft: "",
    compareRevisionId: null
  },
  project: {
    currentProjectSlug: null,
    activeTab: null,
    scopedQuickCreateType: null,
    showOnlyProjectLinkedContent: false
  },
  timeline: {
    liveMode: true,
    playbackWindow: null,
    selectedEventDetailMode: null
  },
  openCommandPalette: () => set((state) => ({ command: { ...state.command, paletteOpen: true } })),
  closeCommandPalette: () => set((state) => ({ command: { ...state.command, paletteOpen: false } })),
  toggleCommandPalette: () => set((state) => ({
    command: { ...state.command, paletteOpen: !state.command.paletteOpen }
  })),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  setVerificationVisible: (visible) => set((state) => ({ verification: { ...state.verification, visible } })),
  setVerificationPhase: (phase, latestId) => {
    set((state) => ({
      verification: {
        ...state.verification,
        phase,
        latestId: typeof latestId === "undefined" ? state.verification.latestId : latestId,
        visible: phase !== "idle"
      }
    }));
    if (phase === "resolved" || phase === "failed") {
      setTimeout(() => {
        set((state) => ({
          verification: {
            ...state.verification,
            phase: "idle",
            visible: false
          }
        }));
      }, 3e3);
    }
  },
  setVerificationRailPinned: (pinned) => set((state) => ({ verification: { ...state.verification, pinned } })),
  toggleVerificationRailPinned: () => set((state) => ({
    verification: {
      ...state.verification,
      pinned: !state.verification.pinned
    }
  }))
}));
function VerificationRailHost() {
  const verification = useUIStore((state) => state.verification);
  if (!verification.visible) return null;
  return /* @__PURE__ */ jsx("div", { className: "pointer-events-none fixed bottom-4 right-4 z-20 hidden max-w-xs xl:block", children: /* @__PURE__ */ jsxs("div", { className: "genie-surface genie-surface--overlay rounded-[22px] p-3 pointer-events-auto", children: [
    /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400", children: "Verification Rail" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-200", children: verification.phase === "pending" ? "Verification is in progress." : verification.phase === "resolved" ? "Verification resolved." : verification.phase === "failed" ? "Verification failed." : "Operational verification will surface here as actions complete." }),
    /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-slate-500", children: [
      verification.pinned ? "Pinned" : "Ephemeral",
      verification.latestId ? ` · ${verification.latestId}` : ""
    ] })
  ] }) });
}
function getDefaultOptions() {
  return {
    defaultOptions: {
      queries: {
        staleTime: 3e4
      }
    }
  };
}
function createQueryClient() {
  return new QueryClient(getDefaultOptions());
}
let browserQueryClient = null;
function getBrowserQueryClient() {
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
function serializeDehydratedQueryState(state) {
  return JSON.stringify(state).replace(/</g, "\\u003c");
}
typeof window === "undefined" ? createQueryClient() : getBrowserQueryClient();
const strip = (url) => url.replace(/\/+$/, "");
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 300;
const DEFAULT_RETRY_MULTIPLIER = 2;
const INTERNAL_TOKEN_REFRESH_SKEW_MS = 3e4;
const INTERNAL_TOKEN_FALLBACK_TTL_MS = 5 * 6e4;
let cachedInternalToken = null;
let internalTokenPromise = null;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);
const joinApiPath = (base, path) => {
  if (isAbsoluteUrl(path)) return path;
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
};
const shouldRetryStatus = (status) => status >= 500 && status <= 599;
const shouldRetryError = (error) => {
  if (error instanceof DOMException && error.name === "AbortError") return false;
  if (typeof error === "object" && error !== null && "name" in error && String(error.name) === "AbortError") {
    return false;
  }
  return true;
};
const isServerRuntime = () => typeof window === "undefined";
const parseDurationMs = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1e3;
  }
  const match = trimmed.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  switch (match[2].toLowerCase()) {
    case "s":
      return amount * 1e3;
    case "m":
      return amount * 6e4;
    case "h":
      return amount * 60 * 6e4;
    case "d":
      return amount * 24 * 60 * 6e4;
    default:
      return null;
  }
};
const parseJwtExpiryMs = (token) => {
  const segments = token.split(".");
  if (segments.length < 2 || !segments[1]) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(segments[1], "base64url").toString("utf8")
    );
    if (typeof payload.exp === "number" && Number.isFinite(payload.exp)) {
      return payload.exp * 1e3;
    }
  } catch {
    return null;
  }
  return null;
};
const resolveTokenExpiryMs = (accessToken, expiresIn) => {
  const jwtExpiryMs = parseJwtExpiryMs(accessToken);
  if (jwtExpiryMs && jwtExpiryMs > Date.now()) return jwtExpiryMs;
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
    return Date.now() + expiresIn * 1e3;
  }
  if (typeof expiresIn === "string") {
    const durationMs = parseDurationMs(expiresIn);
    if (durationMs && durationMs > 0) {
      return Date.now() + durationMs;
    }
  }
  return Date.now() + INTERNAL_TOKEN_FALLBACK_TTL_MS;
};
const getInternalTokenConfig = () => {
  if (!isServerRuntime() || typeof process === "undefined") return null;
  const env = process.env ?? {};
  const apiKey = env.VIEWER_INTERNAL_APP_API_KEY?.trim() || env.AUTH_MCP_API_KEY?.trim() || "";
  if (!apiKey) return null;
  const authBase = env.VIEWER_AUTH_INTERNAL_URL?.trim() || env.AUTH_SERVICE_URL?.trim() || "http://127.0.0.1:3001";
  return {
    apiKey,
    authBase: strip(authBase)
  };
};
const withAuthorizationHeader = (init, token) => {
  const headers = new Headers(init?.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("X-Vault-Service-Auth")) {
    headers.set("X-Vault-Service-Auth", "bearer");
  }
  return {
    ...init || {},
    headers
  };
};
const mintInternalToken = async (config) => {
  const response = await fetch(`${config.authBase}/auth/token/client`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.apiKey
    },
    body: JSON.stringify({ audience: "api" })
  });
  if (!response.ok) {
    const body = (await response.text().catch(() => "")).trim();
    const details = body ? `: ${body.slice(0, 200)}` : "";
    throw new Error(`Token mint failed (${response.status})${details}`);
  }
  const payload = await response.json().catch(() => null);
  const accessToken = typeof payload?.accessToken === "string" ? payload.accessToken.trim() : "";
  if (!accessToken) {
    throw new Error("Token mint response missing accessToken");
  }
  return {
    token: accessToken,
    expiresAtMs: resolveTokenExpiryMs(accessToken, payload?.expiresIn)
  };
};
const hasValidCachedToken = (cache) => Boolean(cache && cache.expiresAtMs - INTERNAL_TOKEN_REFRESH_SKEW_MS > Date.now());
const getInternalToken = async (config) => {
  if (hasValidCachedToken(cachedInternalToken)) {
    return cachedInternalToken.token;
  }
  if (!internalTokenPromise) {
    internalTokenPromise = mintInternalToken(config).then((token2) => {
      cachedInternalToken = token2;
      return token2;
    }).finally(() => {
      internalTokenPromise = null;
    });
  }
  const token = await internalTokenPromise;
  return token.token;
};
const getRequestInit = async (init) => {
  const internalTokenConfig = getInternalTokenConfig();
  if (!internalTokenConfig) return init;
  let token;
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
function getApiBase() {
  if (typeof window !== "undefined") {
    if (window.VAULT_API_URL) {
      return strip(window.VAULT_API_URL);
    }
    if (window.VIEWER_CONFIG?.apiUrl) {
      return strip(window.VIEWER_CONFIG.apiUrl);
    }
    return "";
  }
  if (typeof process !== "undefined") {
    const vaultApiUrl = process.env?.VAULT_API_URL?.trim();
    if (vaultApiUrl) {
      return strip(vaultApiUrl);
    }
    const apiProxyUrl = process.env?.API_PROXY_URL?.trim();
    if (apiProxyUrl) {
      return strip(apiProxyUrl);
    }
  }
  return "";
}
async function apiFetch(path, init, retryOptions) {
  const retries = DEFAULT_RETRIES;
  let delayMs = DEFAULT_RETRY_DELAY_MS;
  const retryMultiplier = DEFAULT_RETRY_MULTIPLIER;
  const url = joinApiPath(getApiBase(), path);
  const requestInit = await getRequestInit(init);
  let attempt = 0;
  while (true) {
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
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
const DEFAULT_AVATAR = {
  profile: {
    name: "Unknown",
    handle: "unknown",
    archetype: "explorer",
    title: "Vault User",
    location: null,
    interests: []
  },
  vitals: {
    health: 50,
    energy: 50,
    stress: 50,
    rank: "E Unproven",
    tasksCompletedToday: 0,
    tasksCompletedThisWeek: 0,
    sessionsCompletedThisWeek: 0,
    needs: { sleep: 50, social: 50, food: 50 }
  },
  progression: {
    level: 1,
    xp: 0,
    streakDays: 0,
    streakUpdated: null
  },
  capacity: {
    focusCostMax: 5,
    effortScoreMax: 5,
    timeBudgetMin: 120
  },
  knowledge: {
    domains: {},
    learning: { now: [], next: [] },
    gaps: []
  },
  flags: {
    stagnation: false,
    entropyWarning: false
  },
  updated: null
};
function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}
function useAvatar() {
  const getApiUrl = useCallback(() => {
    const base = getApiBase();
    return base;
  }, []);
  const apiUrl = getApiUrl();
  const hydrated = useHydrated();
  const queryEnabled = hydrated;
  const avatarQuery = useQuery({
    queryKey: ["avatar", apiUrl],
    enabled: queryEnabled,
    staleTime: 3e4,
    retry: 1,
    queryFn: async () => {
      const [avatarRes, sessionStatsRes, tasksRes] = await Promise.all([
        apiFetch("/api/v1/cod/avatar"),
        apiFetch("/api/v1/sessions/stats").catch(() => null),
        apiFetch("/api/v1/tasks?status=all&limit=1000").catch(() => null)
      ]);
      if (!avatarRes.ok) throw new Error(`HTTP ${avatarRes.status}`);
      const avatarResult = await avatarRes.json();
      const avatarPayload = avatarResult?.structuredContent ?? avatarResult ?? {};
      const state = avatarPayload.state || avatarPayload || {};
      let sessionStats = {
        completedSessions: 0,
        totalSessions: 0,
        activeSessions: 0
      };
      if (sessionStatsRes?.ok) {
        const sessionData = await sessionStatsRes.json();
        sessionStats = sessionData?.structuredContent || sessionData || sessionStats;
      }
      let tasksCompletedToday = 0;
      let tasksCompletedThisWeek = 0;
      let totalCompleted = 0;
      if (tasksRes?.ok) {
        const tasksData = await tasksRes.json();
        const tasks = tasksData?.structuredContent?.tasks || tasksData?.tasks || [];
        const now = /* @__PURE__ */ new Date();
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        tasks.forEach((task) => {
          if (task.status === "completed") {
            totalCompleted++;
            const completedDate = task.completedAt || task.frontmatter?.completedAt || task.frontmatter?.completed || task.completed;
            if (completedDate) {
              const taskDate = new Date(completedDate);
              if (taskDate >= todayStart) tasksCompletedToday++;
              if (taskDate >= weekStart) tasksCompletedThisWeek++;
            }
          }
        });
      }
      const vitals = {
        ...state.vitals || DEFAULT_AVATAR.vitals,
        tasksCompletedToday: tasksCompletedToday || state.vitals?.tasksCompletedToday || 0,
        tasksCompletedThisWeek: tasksCompletedThisWeek || state.vitals?.tasksCompletedThisWeek || 0,
        sessionsCompletedThisWeek: sessionStats.completedSessions || state.vitals?.sessionsCompletedThisWeek || 0,
        totalTasksCompleted: totalCompleted,
        totalSessions: sessionStats.totalSessions || 0,
        activeSessions: sessionStats.activeSessions || 0
      };
      return {
        profile: state.profile || DEFAULT_AVATAR.profile,
        vitals,
        progression: state.progression || DEFAULT_AVATAR.progression,
        capacity: state.capacity || DEFAULT_AVATAR.capacity,
        knowledge: state.knowledge || DEFAULT_AVATAR.knowledge,
        flags: state.flags || DEFAULT_AVATAR.flags,
        updated: state.updated || null
      };
    }
  });
  const avatar = avatarQuery.data || DEFAULT_AVATAR;
  const loading = !hydrated || avatarQuery.isFetching;
  const error = avatarQuery.error ? avatarQuery.error instanceof Error ? avatarQuery.error.message : String(avatarQuery.error) : null;
  const apiStatus = avatarQuery.isFetching && !avatarQuery.data ? "loading" : avatarQuery.isError ? "offline" : avatarQuery.isSuccess ? "online" : "unknown";
  const level = avatar.progression?.level || 1;
  const currentXp = avatar.progression?.xp || 0;
  const xpToNext = xpForLevel(level);
  const xpProgress = Math.min(100, Math.round(currentXp / xpToNext * 100));
  return {
    avatar,
    loading,
    error,
    refresh: () => avatarQuery.refetch(),
    apiStatus,
    // Derived values
    level,
    currentXp,
    xpToNext,
    xpProgress
  };
}
function VitalBar({ value, label, inverted = false }) {
  const effectiveValue = inverted ? 100 - value : value;
  let color = "success";
  if (effectiveValue < 40) color = "danger";
  else if (effectiveValue < 60) color = "warning";
  return /* @__PURE__ */ jsxs("div", { className: "avatar-vital", children: [
    /* @__PURE__ */ jsxs("div", { className: "avatar-vital__header", children: [
      /* @__PURE__ */ jsx("span", { className: "avatar-vital__label", children: label }),
      /* @__PURE__ */ jsxs("span", { className: "avatar-vital__value", children: [
        value,
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "avatar-vital__track", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: `avatar-vital__fill avatar-vital__fill--${color}`,
        style: { width: `${value}%` }
      }
    ) })
  ] });
}
function VitalsPanel({ vitals }) {
  return /* @__PURE__ */ jsxs("div", { className: "vitals-group", children: [
    /* @__PURE__ */ jsx(VitalBar, { value: vitals.energy ?? 50, label: "Energy" }),
    /* @__PURE__ */ jsx(VitalBar, { value: vitals.stress ?? 50, label: "Stress", inverted: true }),
    /* @__PURE__ */ jsx(VitalBar, { value: vitals.health ?? 50, label: "Health" })
  ] });
}
function deriveReadiness(vitals, capacity) {
  const energy = vitals.energy ?? 50;
  const stress = vitals.stress ?? 50;
  const focus = capacity.focusCostMax || void 0;
  const effort = capacity.effortScoreMax || void 0;
  if (energy >= 70 && stress <= 35) {
    return {
      level: "deep",
      label: "Deep work window",
      description: "Good for focused, high-effort execution.",
      color: "var(--readiness-deep)",
      sessionType: "deep",
      maxFocusCost: focus,
      maxEffortScore: effort
    };
  }
  if (energy >= 50 && stress <= 60) {
    return {
      level: "medium",
      label: "Sustained execution",
      description: "Medium-focus tasks. Avoid switching costs.",
      color: "var(--readiness-medium)",
      sessionType: "steady",
      maxFocusCost: focus !== void 0 ? Math.min(focus, 6) : void 0,
      maxEffortScore: effort !== void 0 ? Math.min(effort, 6) : void 0
    };
  }
  if (energy >= 30 || stress <= 70) {
    return {
      level: "shallow",
      label: "Light task mode",
      description: "Prefer short, low-friction tasks. Avoid deep work.",
      color: "var(--readiness-shallow)",
      sessionType: "light",
      maxFocusCost: focus !== void 0 ? Math.min(focus, 4) : 4,
      maxEffortScore: effort !== void 0 ? Math.min(effort, 4) : 4
    };
  }
  return {
    level: "recover",
    label: "Recovery mode",
    description: "Low energy and high stress. Minimal execution recommended.",
    color: "var(--readiness-recover)",
    sessionType: "minimal",
    maxFocusCost: 2,
    maxEffortScore: 2
  };
}
function formatTimeBudget(min) {
  if (!min || min <= 0) return "";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
function isMetricReal(value) {
  if (value === void 0 || value === null) return false;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") return value.trim().length > 0 && value !== "—";
  return false;
}
function isStale(updated) {
  if (!updated) return true;
  const ms = Date.now() - Date.parse(updated);
  return ms > 2 * 60 * 60 * 1e3;
}
function deriveCapacityGuidance(capacity) {
  const time = capacity.timeBudgetMin ?? 0;
  const focus = capacity.focusCostMax ?? 0;
  const effort = capacity.effortScoreMax ?? 0;
  if (time > 0 && time < 30) return "Short window — quick tasks only.";
  if (focus <= 3 && effort <= 3) return "Low capacity — prefer minimal tasks.";
  if (focus >= 7 && effort >= 7) return "High capacity — deep session is viable.";
  if (focus > 0 || effort > 0) return "Moderate capacity — balanced execution.";
  return "";
}
function PrimaryButton({ onClick, disabled, className = "", children }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick,
      disabled,
      className: `btn-primary rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`,
      children
    }
  );
}
function SecondaryButton({ onClick, disabled, className = "", children }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick,
      disabled,
      className: `btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`,
      children
    }
  );
}
function IconButton({ onClick, disabled, className = "", icon, label }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      disabled,
      "aria-label": label,
      className: `p-2 rounded-xl text-slate-500 hover:bg-white/70 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${className}`,
      children: [
        label && /* @__PURE__ */ jsx("span", { className: "sr-only", children: label }),
        icon
      ]
    }
  );
}
function MetaRow({ items, className = "" }) {
  return /* @__PURE__ */ jsx("div", { className: `flex items-center gap-3 flex-wrap ${className}`, children: items.map((item) => /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-sm text-neutral-500", children: [
    item.icon && /* @__PURE__ */ jsx("span", { className: "shrink-0", children: item.icon }),
    item.label
  ] }, item.label)) });
}
function ReasonText({ children, className = "" }) {
  return /* @__PURE__ */ jsx("p", { className: `text-sm text-neutral-500 italic leading-relaxed ${className}`, children });
}
function ReadinessCard({ readiness, capacityLabel, timeBudgetLabel }) {
  const metaItems = [
    ...timeBudgetLabel ? [{ label: timeBudgetLabel }] : [],
    { label: capacityLabel }
  ];
  return /* @__PURE__ */ jsxs(SoftPanel, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "inline-flex items-center gap-2 mb-1",
        style: { color: readiness.color },
        children: /* @__PURE__ */ jsx("span", { className: "text-xl font-semibold", children: readiness.label })
      }
    ),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-500 mt-1 mb-5", children: readiness.description }),
    metaItems.length > 0 && /* @__PURE__ */ jsx(MetaRow, { items: metaItems, className: "mb-5" }),
    /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/",
        className: "inline-flex bg-[#4f8cff] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#3d7de8] transition-colors",
        children: [
          "Start ",
          readiness.sessionType,
          " session"
        ]
      }
    )
  ] });
}
const apiBadgeText = (status) => {
  if (status === "online") return "API online";
  if (status === "loading") return "Syncing";
  if (status === "offline") return "API offline";
  return "API";
};
const $$splitComponentImporter$w = () => import("./avatar-C_01zjFA.js");
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
const Route$y = createFileRoute("/avatar")({
  component: lazyRouteComponent($$splitComponentImporter$w, "component")
});
function AvatarRoute$1({
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
const VARIANT_STYLES = {
  clear: {
    container: "bg-success/10 text-success border-success/20",
    dot: "bg-success"
  },
  warn: {
    container: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning"
  },
  rest: {
    container: "bg-white/70 text-slate-700 border-slate-300/70",
    dot: "bg-slate-500"
  },
  stop: {
    container: "bg-danger/10 text-danger border-danger/20",
    dot: "bg-danger"
  }
};
function CodSeverityPill({ variant, label }) {
  const styles = VARIANT_STYLES[variant];
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${styles.container}`,
      children: [
        /* @__PURE__ */ jsx("span", { className: `w-2 h-2 rounded-full ${styles.dot}`, "aria-hidden": true }),
        label
      ]
    }
  );
}
const PRIMARY_ACTIONS = /* @__PURE__ */ new Set(["Start 25m sprint", "Start full session", "Plan 90m"]);
const CHECKIN_ACTIONS = /* @__PURE__ */ new Set(["Check in"]);
const BROWSE_ACTIONS = /* @__PURE__ */ new Set(["Browse safe tasks"]);
function CodActionRow({ actions, canWork, onCheckIn }) {
  return /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3 flex-wrap", children: actions.map((label) => {
    if (PRIMARY_ACTIONS.has(label)) {
      return /* @__PURE__ */ jsx(PrimaryButton, { disabled: !canWork, children: label }, label);
    }
    if (CHECKIN_ACTIONS.has(label)) {
      return /* @__PURE__ */ jsx(SecondaryButton, { onClick: onCheckIn, children: label }, label);
    }
    if (BROWSE_ACTIONS.has(label)) {
      return /* @__PURE__ */ jsx("a", { href: "/", className: "text-primary hover:text-primary-2 underline-offset-2 hover:underline inline-block", children: label }, label);
    }
    return /* @__PURE__ */ jsx(SecondaryButton, { children: label }, label);
  }) });
}
function CodConstraintTable({ items }) {
  return /* @__PURE__ */ jsx("dl", { className: "grid grid-cols-1 gap-2", children: items.map(({ label, value }) => /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-2", children: [
    /* @__PURE__ */ jsx("dt", { className: "text-xs uppercase tracking-wide text-slate-500 shrink-0", children: label }),
    /* @__PURE__ */ jsx("dd", { className: "text-sm font-medium text-slate-800 text-right", children: value })
  ] }, label)) });
}
const VARIANT_COLOR = {
  ok: "text-success",
  warn: "text-warning",
  bad: "text-danger"
};
function CodSignalRow({ items }) {
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: items.map(({ label, value, variant }) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
    /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-600", children: label }),
    /* @__PURE__ */ jsx("span", { className: `text-sm font-medium ${variant ? VARIANT_COLOR[variant] : "text-slate-800"}`, children: value })
  ] }, label)) });
}
const DEFAULT_STATUS = {
  validation: {
    status: "UNKNOWN",
    warnings: [],
    lastChecked: null
  },
  humanState: {
    energy: 0,
    focusCapacity: "unknown",
    stress: 0,
    sleepDebt: 0,
    timeAvailableMin: 0,
    source: "none",
    timestamp: null
  },
  session: null,
  warnings: [],
  avatarVitals: {
    money: { default_currency: "", balances: {}, forms: {} },
    notoriety: 0,
    health: 0,
    healthTrend: null
  }
};
function computeValidation(humanState, session, avatarVitals = {}) {
  const warnings = [];
  if (humanState) {
    if (humanState.energy < 40) {
      warnings.push(`Low energy (${Math.round(humanState.energy)}%)`);
    }
    if (humanState.stress > 70) {
      warnings.push(`High stress (${Math.round(humanState.stress)}%)`);
    }
    if (humanState.sleepDebt > 2) {
      warnings.push(`Sleep debt (${humanState.sleepDebt}h)`);
    }
    if (humanState.focusCapacity === "low") {
      warnings.push("Low focus capacity");
    }
    if (humanState.timeAvailableMin < 30) {
      warnings.push(`Limited time (${humanState.timeAvailableMin} min)`);
    }
  }
  if (avatarVitals.health !== void 0 && avatarVitals.health < 40) {
    warnings.push(`Health low (${Math.round(avatarVitals.health)}%)`);
  }
  const now = /* @__PURE__ */ new Date();
  const hour = now.getHours();
  if (hour >= 23 || hour < 5) {
    warnings.push("HARD_STOP window active");
  } else if (hour >= 22) {
    warnings.push("Near HARD_STOP window");
  }
  if (session) {
    const elapsed = Date.now() - new Date(session.startedAt).getTime();
    const elapsedMin = Math.floor(elapsed / 6e4);
    if (elapsedMin > session.budgetMin) {
      warnings.push(
        `Session overtime (+${elapsedMin - session.budgetMin} min)`
      );
    }
  }
  let status = "PASS";
  if (warnings.length > 0) {
    const hasBlocking = warnings.some((w) => {
      if (w.includes("HARD_STOP window active")) return true;
      if (w.includes("overtime")) return true;
      if (w.includes("energy")) {
        const val = parseInt(w.match(/\d+/)?.[0] || "100", 10);
        if (val < 20) return true;
      }
      if (w.includes("Health")) {
        const val = parseInt(w.match(/\d+/)?.[0] || "100", 10);
        if (val < 25) return true;
      }
      return false;
    });
    status = hasBlocking ? "FAIL" : "WARN";
  }
  return { status, warnings, lastChecked: (/* @__PURE__ */ new Date()).toISOString() };
}
function useCODStatus(staticData = null, profileOverride = null) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState(null);
  const hydrated = useHydrated();
  const getApiUrl = useCallback(() => {
    const url = getApiBase();
    return url;
  }, []);
  const apiUrl = getApiUrl();
  const queryEnabled = hydrated;
  const initialData = useMemo(() => {
    if (staticData) {
      const humanState = staticData.humanStateJson || DEFAULT_STATUS.humanState;
      const session = staticData.activeSessionJson || null;
      const validation = computeValidation(humanState, session);
      return {
        validation,
        humanState,
        session,
        warnings: validation.warnings,
        avatarVitals: DEFAULT_STATUS.avatarVitals
      };
    }
    return DEFAULT_STATUS;
  }, [staticData]);
  const queryKey = ["cod-status", apiUrl, profileOverride || "auto"];
  const statusQuery = useQuery({
    queryKey,
    enabled: queryEnabled,
    initialData,
    staleTime: 1e4,
    retry: 1,
    refetchInterval: hydrated ? 6e4 : false,
    queryFn: async () => {
      const response = await apiFetch("/api/v1/cod/status");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const humanState = result.structuredContent?.humanState || result.humanState || DEFAULT_STATUS.humanState;
      const session = result.structuredContent?.session || result.session || null;
      let avatarVitals = DEFAULT_STATUS.avatarVitals;
      try {
        const avatarRes = await apiFetch("/api/v1/cod/avatar");
        if (avatarRes.ok) {
          const avatarJson = await avatarRes.json();
          const avatarState = avatarJson?.structuredContent?.state || avatarJson?.state || avatarJson?.structuredContent || avatarJson;
          const vitals = avatarState?.vitals || avatarJson?.structuredContent?.vitals || avatarJson?.vitals;
          if (vitals) {
            avatarVitals = {
              money: vitals.money ?? avatarVitals.money,
              notoriety: vitals.notoriety ?? avatarVitals.notoriety,
              health: vitals.health ?? avatarVitals.health,
              healthTrend: avatarState?.trends?.vitals7d?.health ?? avatarJson?.structuredContent?.trends?.vitals7d?.health ?? avatarVitals.healthTrend ?? null
            };
          }
        }
      } catch {
      }
      const validation = computeValidation(humanState, session, avatarVitals);
      return {
        validation,
        humanState,
        session,
        warnings: validation.warnings,
        avatarVitals
      };
    }
  });
  const refresh = useCallback(async () => {
    if (!hydrated) return;
    await statusQuery.refetch();
  }, [hydrated, statusQuery]);
  const updateHumanStateMutation = useMutation({
    mutationFn: async ({ newState }) => {
      const response = await apiFetch("/api/v1/cod/human-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      return response.json().catch(() => ({}));
    },
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  });
  const startSessionMutation = useMutation({
    mutationFn: async ({ taskIds = [], budgetMin = 60 }) => {
      const response = await apiFetch("/api/v1/cod/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds, budgetMin })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      return response.json();
    },
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  });
  const endSessionMutation = useMutation({
    mutationFn: async ({ sessionId, status = "completed" }) => {
      const response = await apiFetch("/api/v1/cod/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, status })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      return response.json().catch(() => ({}));
    },
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  });
  const updateHumanState = useCallback(
    async (newState) => {
      if (!queryEnabled) {
        return { success: false, error: "API not available" };
      }
      setActionError(null);
      try {
        await updateHumanStateMutation.mutateAsync({ newState });
        await refresh();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setActionError(message);
        return { success: false, error: message };
      }
    },
    [queryEnabled, refresh, updateHumanStateMutation]
  );
  const startSession = useCallback(
    async ({ taskIds = [], budgetMin = 60 } = {}) => {
      if (!queryEnabled) {
        return { success: false, error: "API not available" };
      }
      setActionError(null);
      try {
        const session = await startSessionMutation.mutateAsync({
          taskIds,
          budgetMin
        });
        await refresh();
        return { success: true, session };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setActionError(message);
        return { success: false, error: message };
      }
    },
    [queryEnabled, refresh, startSessionMutation]
  );
  const endSession = useCallback(
    async (sessionId, status = "completed") => {
      if (!queryEnabled) {
        return { success: false, error: "API not available" };
      }
      setActionError(null);
      try {
        await endSessionMutation.mutateAsync({ sessionId, status });
        await refresh();
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setActionError(message);
        return { success: false, error: message };
      }
    },
    [endSessionMutation, queryEnabled, refresh]
  );
  const queryError = statusQuery.error ? statusQuery.error instanceof Error ? statusQuery.error.message : String(statusQuery.error) : null;
  const error = actionError || queryError;
  const loading = !hydrated || statusQuery.isFetching;
  const updating = updateHumanStateMutation.isPending || startSessionMutation.isPending || endSessionMutation.isPending;
  const data = statusQuery.data || initialData;
  return {
    ...data,
    loading,
    updating,
    error,
    refresh,
    updateHumanState,
    startSession,
    endSession
  };
}
function HumanStateForm({
  currentState,
  onSubmit,
  onCancel,
  loading = false
}) {
  const initialFormData = useMemo(() => ({
    energy: currentState?.energy ?? 0.5,
    focusCapacity: currentState?.focusCapacity || "med",
    stress: currentState?.stress ?? 0.3,
    sleepHours: currentState?.sleepDebt ? 8 - currentState.sleepDebt : 7,
    timeAvailableMin: currentState?.timeAvailableMin || 60,
    source: "moment-check"
  }), [currentState]);
  const [formData, setFormData] = useState(initialFormData);
  const [formError, setFormError] = useState(null);
  const handleChange = useCallback((field, value) => {
    if (formError) {
      setFormError(null);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, [formError]);
  const hasAnyNonEmptyField = useMemo(() => {
    return Object.values(formData).some((value) => {
      if (typeof value === "string") return value.trim().length > 0;
      if (typeof value === "number") return Number.isFinite(value);
      return value !== null && value !== void 0;
    });
  }, [formData]);
  const hasChanges = useMemo(() => {
    return formData.energy !== initialFormData.energy || formData.focusCapacity !== initialFormData.focusCapacity || formData.stress !== initialFormData.stress || formData.sleepHours !== initialFormData.sleepHours || formData.timeAvailableMin !== initialFormData.timeAvailableMin || formData.source !== initialFormData.source;
  }, [formData, initialFormData]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasAnyNonEmptyField) {
      setFormError("Add at least one field value before saving.");
      return;
    }
    if (!hasChanges) {
      setFormError("Change at least one field before saving.");
      return;
    }
    setFormError(null);
    onSubmit(formData);
  };
  return /* @__PURE__ */ jsxs("form", { className: "cod-form", onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsxs("div", { className: "cod-form__header", children: [
      /* @__PURE__ */ jsx("h3", { className: "cod-form__title", children: "Update Human State" }),
      /* @__PURE__ */ jsx("span", { className: "cod-form__subtitle", children: "Quick check-in" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "cod-form__field", children: [
      /* @__PURE__ */ jsxs("label", { className: "cod-form__label", children: [
        /* @__PURE__ */ jsx("span", { children: "⚡ Energy" }),
        /* @__PURE__ */ jsxs("span", { className: "cod-form__value", children: [
          Math.round(formData.energy * 100),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "range",
          min: "0",
          max: "1",
          step: "0.05",
          value: formData.energy,
          onChange: (e) => handleChange("energy", parseFloat(e.target.value)),
          className: "cod-form__slider"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "cod-form__hints", children: [
        /* @__PURE__ */ jsx("span", { children: "Exhausted" }),
        /* @__PURE__ */ jsx("span", { children: "Energized" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "cod-form__field", children: [
      /* @__PURE__ */ jsx("span", { className: "cod-form__label", children: "🎯 Focus Capacity" }),
      /* @__PURE__ */ jsx("div", { className: "cod-form__button-group", children: ["low", "med", "high"].map((level) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `cod-form__toggle ${formData.focusCapacity === level ? "cod-form__toggle--active" : ""}`,
          onClick: () => handleChange("focusCapacity", level),
          children: level === "low" ? "Low" : level === "med" ? "Medium" : "High"
        },
        level
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "cod-form__field", children: [
      /* @__PURE__ */ jsxs("label", { className: "cod-form__label", children: [
        /* @__PURE__ */ jsx("span", { children: "🧘 Stress" }),
        /* @__PURE__ */ jsxs("span", { className: "cod-form__value", children: [
          Math.round(formData.stress * 100),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "range",
          min: "0",
          max: "1",
          step: "0.05",
          value: formData.stress,
          onChange: (e) => handleChange("stress", parseFloat(e.target.value)),
          className: "cod-form__slider cod-form__slider--stress"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "cod-form__hints", children: [
        /* @__PURE__ */ jsx("span", { children: "Calm" }),
        /* @__PURE__ */ jsx("span", { children: "Stressed" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "cod-form__field", children: [
      /* @__PURE__ */ jsxs("label", { className: "cod-form__label", children: [
        /* @__PURE__ */ jsx("span", { children: "😴 Sleep (last night)" }),
        /* @__PURE__ */ jsxs("span", { className: "cod-form__value", children: [
          formData.sleepHours,
          "h"
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "range",
          min: "0",
          max: "12",
          step: "0.5",
          value: formData.sleepHours,
          onChange: (e) => handleChange("sleepHours", parseFloat(e.target.value)),
          className: "cod-form__slider"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "cod-form__hints", children: [
        /* @__PURE__ */ jsx("span", { children: "0h" }),
        /* @__PURE__ */ jsx("span", { children: "12h" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "cod-form__field", children: [
      /* @__PURE__ */ jsxs("label", { className: "cod-form__label", children: [
        /* @__PURE__ */ jsx("span", { children: "⏱️ Time Available" }),
        /* @__PURE__ */ jsxs("span", { className: "cod-form__value", children: [
          formData.timeAvailableMin,
          " min"
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "range",
          min: "0",
          max: "480",
          step: "15",
          value: formData.timeAvailableMin,
          onChange: (e) => handleChange("timeAvailableMin", parseInt(e.target.value)),
          className: "cod-form__slider"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "cod-form__hints", children: [
        /* @__PURE__ */ jsx("span", { children: "0" }),
        /* @__PURE__ */ jsx("span", { children: "8h" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "cod-form__field", children: [
      /* @__PURE__ */ jsx("span", { className: "cod-form__label", children: "Check-in Type" }),
      /* @__PURE__ */ jsx("div", { className: "cod-form__button-group", children: [
        { value: "morning-check", label: "🌅 Morning" },
        { value: "moment-check", label: "⏰ Moment" },
        { value: "manual", label: "📝 Manual" }
      ].map(({ value, label }) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `cod-form__toggle ${formData.source === value ? "cod-form__toggle--active" : ""}`,
          onClick: () => handleChange("source", value),
          children: label
        },
        value
      )) })
    ] }),
    formError && /* @__PURE__ */ jsx("div", { className: "cod-form__error", role: "alert", children: formError }),
    /* @__PURE__ */ jsxs("div", { className: "cod-form__actions", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "cod-button cod-button--secondary",
          onClick: onCancel,
          disabled: loading,
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "cod-button cod-button--primary",
          disabled: loading,
          children: loading ? "Saving..." : "Save Check-in"
        }
      )
    ] })
  ] });
}
function normalizeToPercent(raw) {
  if (raw == null) return 0;
  if (Math.abs(raw) <= 1 && !Number.isInteger(raw)) {
    return Math.min(100, Math.max(0, raw * 100));
  }
  return Math.min(100, Math.max(0, raw));
}
function signalStatus(value, warnBelow, badBelow, warnAbove, badAbove) {
  if (badBelow != null && value < badBelow) return "bad";
  if (warnBelow != null && value < warnBelow) return "warn";
  if (badAbove != null && value > badAbove) return "bad";
  if (warnAbove != null && value > warnAbove) return "warn";
  return "good";
}
function normalizeCodSignals(humanState) {
  const energy = normalizeToPercent(humanState.energy);
  const stress = normalizeToPercent(humanState.stress);
  const sleepDebt = humanState.sleepDebt ?? 0;
  const restScore = Math.max(0, 100 - sleepDebt * 12.5);
  const timeMin = humanState.timeAvailableMin ?? 0;
  const focusCap = humanState.focusCapacity ?? "unknown";
  const focusValue = focusCap === "high" ? 100 : focusCap === "med" ? 60 : focusCap === "low" ? 25 : 0;
  return [
    {
      label: "Energy",
      value: energy,
      raw: humanState.energy ?? 0,
      unit: "%",
      status: signalStatus(energy, 60, 30)
    },
    {
      label: "Stress",
      value: stress,
      raw: humanState.stress ?? 0,
      unit: "%",
      status: signalStatus(stress, void 0, void 0, 60, 80)
    },
    {
      label: "Rest",
      value: restScore,
      raw: sleepDebt,
      unit: "%",
      status: signalStatus(restScore, 50, 25)
    },
    {
      label: "Focus",
      value: focusValue,
      raw: focusCap,
      status: focusCap === "high" ? "good" : focusCap === "med" ? "warn" : focusCap === "low" ? "bad" : "unknown"
    },
    {
      label: "Time",
      value: Math.min(100, timeMin / 2.4),
      // 240 min → 100 %
      raw: timeMin,
      unit: "min",
      status: signalStatus(timeMin, 60, 30)
    }
  ];
}
function deriveCodConstraints(humanState, status) {
  const energy = normalizeToPercent(humanState.energy);
  const stress = normalizeToPercent(humanState.stress);
  const focusCap = humanState.focusCapacity ?? "unknown";
  const now = /* @__PURE__ */ new Date();
  const hour = now.getHours();
  const isHardStop = hour >= 23 || hour < 5;
  const nearHardStop = !isHardStop && hour >= 22;
  const maxSprintMin = status === "PASS" ? 60 : status === "WARN" ? 25 : 0;
  const maxFocusLabel = focusCap === "high" && status === "PASS" ? "high" : focusCap === "high" || focusCap === "med" ? "medium" : "low";
  const deepWorkAllowed = energy >= 70 && stress <= 40 && focusCap === "high" && status === "PASS";
  return [
    {
      label: "Max sprint",
      value: maxSprintMin > 0 ? `${maxSprintMin} min` : "blocked",
      active: maxSprintMin < 60
    },
    {
      label: "Max focus",
      value: maxFocusLabel,
      active: maxFocusLabel !== "high"
    },
    {
      label: "Deep work",
      value: deepWorkAllowed ? "allowed" : "avoid",
      active: !deepWorkAllowed
    },
    {
      label: "Hard stop",
      value: isHardStop ? "active" : nearHardStop ? "1h warning" : "23:00",
      active: isHardStop || nearHardStop
    }
  ];
}
function getMaxSprintMin(status) {
  if (status === "PASS") return 60;
  if (status === "WARN") return 25;
  return 0;
}
function normalizeNextAction(raw) {
  return {
    id: String(raw.id ?? raw.path ?? ""),
    path: String(raw.path ?? ""),
    title: String(raw.title ?? "Untitled"),
    score: Number(raw.score ?? 0),
    priority: Number(raw.priority ?? 0),
    effortScore: Number(raw.effortScore ?? raw.effort_score ?? 5),
    focusCost: Number(raw.focusCost ?? raw.focus_cost ?? 3),
    estimatedTimeMin: Number(raw.estimatedTimeMin ?? raw.estimated_time_min ?? 0),
    status: String(raw.status ?? "todo"),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    dueDate: typeof raw.dueDate === "string" ? raw.dueDate : void 0,
    projectId: typeof raw.projectId === "string" ? raw.projectId : void 0,
    goalId: typeof raw.goalId === "string" ? raw.goalId : void 0,
    description: typeof raw.description === "string" ? raw.description : void 0,
    blockers: Array.isArray(raw.blockers) ? raw.blockers : []
  };
}
function formatScore(score) {
  return score.toFixed(2);
}
function formatDuration(min) {
  if (min <= 0) return "";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
function elapsedMinutes(startedAt) {
  const ms = Date.now() - Date.parse(startedAt);
  return Math.floor(ms / 6e4);
}
function normalizeSessionSummary(raw) {
  if (!raw || typeof raw !== "object") {
    return { id: String(Math.random()), status: "planned" };
  }
  const r = raw;
  return {
    id: String(r.id ?? r.sessionId ?? ""),
    title: typeof r.title === "string" ? r.title : void 0,
    status: ["planned", "active", "completed", "aborted"].includes(r.status) ? r.status : "planned",
    startedAt: typeof r.startedAt === "string" ? r.startedAt : void 0,
    endedAt: typeof r.endedAt === "string" ? r.endedAt : void 0,
    taskCount: typeof r.taskCount === "number" ? r.taskCount : void 0
  };
}
function formatSessionDuration(startedAt, endedAt) {
  if (!startedAt) return "";
  const end = endedAt ? Date.parse(endedAt) : Date.now();
  const start = Date.parse(startedAt);
  if (isNaN(start) || isNaN(end)) return "";
  const min = Math.round((end - start) / 6e4);
  return formatDuration(min);
}
function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatRelativeAge(dateStr) {
  if (!dateStr) return "";
  const ms = Date.now() - Date.parse(dateStr);
  if (isNaN(ms) || ms < 0) return "";
  const sec = Math.floor(ms / 1e3);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function toProjectSummaryDisplay(project) {
  const title = project.title ?? "Untitled project";
  const statusMap = {
    "active": { label: "On track", variant: "success" },
    "blocked": { label: "Blocked", variant: "danger" },
    "at-risk": { label: "At risk", variant: "warning" },
    "completed": { label: "Completed", variant: "default" }
  };
  const mapped = statusMap[project.status ?? ""] ?? { label: "Active", variant: "success" };
  const statusLabel = mapped.label;
  const statusVariant = mapped.variant;
  const total = project.taskCount ?? 0;
  const done = project.completedTaskCount ?? 0;
  const progressText = `${done} / ${total} tasks`;
  const progressPercent = total > 0 ? Math.round(done / total * 100) : 0;
  let etaLabel = null;
  if (project.dueDate) {
    const due = Date.parse(project.dueDate);
    if (!isNaN(due)) {
      etaLabel = due < Date.now() ? "Overdue" : formatShortDate(project.dueDate);
    }
  }
  const bestMoveTitle = project.nextAction?.title ?? null;
  return { id: project.id ?? "", title, statusLabel, statusVariant, progressText, progressPercent, etaLabel, bestMoveTitle };
}
function resolveSeverity(status, level) {
  if (status === "FAIL" || level === 0) return "stop";
  if (status === "WARN") {
    if (level != null && level <= 2) return "rest";
    return "warn";
  }
  return "clear";
}
const SEVERITY_LABELS = {
  clear: "All clear",
  warn: "Light sprint only",
  rest: "Rest mode",
  stop: "Emergency stop"
};
const SEVERITY_HEADLINES = {
  clear: "You are ready for full focus work.",
  warn: "Capacity is limited — keep sessions short.",
  rest: "Low energy detected. Light tasks only.",
  stop: "Do not start new work sessions right now."
};
const SEVERITY_ACTIONS = {
  clear: ["Start full session", "Plan 90m"],
  warn: ["Start 25m sprint", "Check in", "Browse safe tasks"],
  rest: ["Check in", "Browse safe tasks"],
  stop: ["Check in"]
};
function toCodDisplayState(cod) {
  const severityVariant = resolveSeverity(cod.status, cod.level);
  const severityLabel = SEVERITY_LABELS[severityVariant];
  const headline = SEVERITY_HEADLINES[severityVariant];
  const actionLabels = SEVERITY_ACTIONS[severityVariant];
  const constraintItems = Object.entries(cod.constraints ?? {}).map(
    ([k, v]) => ({ label: capitalize(k.replace(/_/g, " ")), value: String(v ?? "") })
  );
  const signalItems = Object.entries(cod.signals ?? {}).map(([k, v]) => {
    const num = typeof v === "number" ? v : null;
    const variant = num === null ? void 0 : num >= 70 ? "ok" : num >= 40 ? "warn" : "bad";
    return { label: capitalize(k.replace(/_/g, " ")), value: String(v ?? ""), variant };
  });
  const reasonText = cod.reason ?? "";
  return { severityLabel, severityVariant, headline, actionLabels, constraintItems, signalItems, reasonText };
}
const ORIGIN_MAP = {
  llm: "From LLM",
  agent: "From agent",
  seed: "Seed",
  manual: "Manual"
};
function toInboxItemDisplay(item) {
  const title = item.title ?? "Untitled";
  const originLabel = ORIGIN_MAP[item._source ?? ""] ?? "Unknown";
  const desc = item.description ?? "";
  const contextSnippet = desc.length > 120 ? desc.slice(0, 120) + "..." : desc;
  const ageLabel = formatRelativeAge(item.createdAt);
  const isBlocked = item.status === "blocked";
  const actions = ["inspect"];
  if (!isBlocked) actions.push("promote");
  actions.push("reject");
  const runId = item._run_id ?? null;
  return { title, originLabel, contextSnippet, ageLabel, actions, isBlocked, runId };
}
const TYPE_LABELS = {
  "task": "Task",
  "spec": "Spec",
  "decision": "Decision",
  "config": "Config",
  "skill-definition": "Skill"
};
function statusToVariant(status) {
  switch (status) {
    case "done":
    case "completed":
      return "success";
    case "blocked":
      return "danger";
    case "in-progress":
      return "warning";
    default:
      return "default";
  }
}
function pathToBreadcrumbs(path) {
  if (!path) return [];
  const segments = path.replace(/\.md$/, "").split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: capitalize(seg.replace(/-/g, " ")),
    path: "/" + segments.slice(0, i + 1).join("/")
  }));
}
function toNoteHeaderDisplay(note) {
  const title = note.title ?? "Untitled";
  const typeLabel = TYPE_LABELS[note.type ?? ""] ?? (capitalize(note.type ?? "") || "Note");
  const statusLabel = note.status ? {
    "todo": "To do",
    "in-progress": "In progress",
    "blocked": "Blocked",
    "done": "Done",
    "backlog": "Backlog",
    "completed": "Completed"
  }[note.status] ?? capitalize(note.status) : null;
  const statusVariant = statusToVariant(note.status);
  const breadcrumbs = pathToBreadcrumbs(note.path);
  const primaryActions = note.type === "task" ? [
    { label: "Start", variant: "primary", action: "start" },
    { label: "Open details", variant: "secondary", action: "open" }
  ] : [{ label: "Open", variant: "primary", action: "open" }];
  return { title, typeLabel, statusLabel, statusVariant, breadcrumbs, primaryActions };
}
function signalVariant(s) {
  if (s === "good") return "ok";
  if (s === "warn") return "warn";
  if (s === "bad") return "bad";
  return void 0;
}
const REFRESH_ICON = /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, children: [
  /* @__PURE__ */ jsx("path", { d: "M13.5 2.5A6.5 6.5 0 1 1 2.5 8" }),
  /* @__PURE__ */ jsx("polyline", { points: "2.5 2.5 2.5 6 6 6" })
] });
function CodModal() {
  const {
    validation,
    humanState,
    warnings,
    loading,
    updating,
    refresh,
    updateHumanState
  } = useCODStatus();
  const [showForm, setShowForm] = useState(false);
  const constraints = deriveCodConstraints(humanState, validation.status);
  const signals = normalizeCodSignals(humanState);
  const maxSprintMin = getMaxSprintMin(validation.status);
  const canStartSession = validation.status !== "FAIL";
  const codState = {
    canStartSession,
    maxSprintMin,
    why: warnings
  };
  const display = {
    ...toCodDisplayState({
      status: validation.status,
      reason: warnings[0] ?? null
    }),
    constraintItems: constraints.map((c) => ({ label: c.label, value: c.value })),
    signalItems: signals.map((s) => ({
      label: s.label,
      value: `${s.value}${s.unit ?? "%"}`,
      variant: signalVariant(s.status)
    }))
  };
  return /* @__PURE__ */ jsxs(SoftPanel, { variant: "utility", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(CodSeverityPill, { variant: display.severityVariant, label: display.severityLabel }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-base font-medium text-slate-800", children: display.headline }),
        display.reasonText && /* @__PURE__ */ jsx(ReasonText, { className: "mt-1", children: display.reasonText })
      ] }),
      /* @__PURE__ */ jsx(
        IconButton,
        {
          icon: REFRESH_ICON,
          label: "Refresh",
          onClick: () => {
            void refresh();
          },
          disabled: loading
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      CodActionRow,
      {
        actions: display.actionLabels,
        canWork: codState.canStartSession,
        maxSprintMin: codState.maxSprintMin,
        onCheckIn: () => setShowForm(true)
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-6 mt-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "genie-surface genie-surface--utility p-4", children: [
        /* @__PURE__ */ jsx(SectionHeader, { title: "Constraints" }),
        /* @__PURE__ */ jsx(CodConstraintTable, { items: display.constraintItems })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "genie-surface genie-surface--utility p-4", children: [
        /* @__PURE__ */ jsx(SectionHeader, { title: "Signals" }),
        /* @__PURE__ */ jsx(CodSignalRow, { items: display.signalItems })
      ] })
    ] }),
    codState.why.length > 0 && /* @__PURE__ */ jsxs("details", { className: "mt-6 rounded-xl genie-surface genie-surface--utility", children: [
      /* @__PURE__ */ jsx("summary", { className: "px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer select-none", children: "Why this status" }),
      /* @__PURE__ */ jsx("div", { className: "px-4 pb-4 space-y-1", children: codState.why.map((w, i) => /* @__PURE__ */ jsx(ReasonText, { children: w }, i)) })
    ] }),
    /* @__PURE__ */ jsxs("details", { className: "mt-3 rounded-xl genie-surface genie-surface--utility", open: showForm, children: [
      /* @__PURE__ */ jsx("summary", { className: "px-4 py-3 text-xs text-slate-500 cursor-pointer select-none", children: "Update state / debug" }),
      /* @__PURE__ */ jsx("div", { className: "px-4 pb-4", children: /* @__PURE__ */ jsx(
        HumanStateForm,
        {
          currentState: {
            ...humanState,
            focusCapacity: humanState.focusCapacity === "unknown" ? void 0 : humanState.focusCapacity
          },
          onSubmit: (data) => {
            void updateHumanState(data);
            setShowForm(false);
          },
          onCancel: () => setShowForm(false),
          loading: updating
        }
      ) })
    ] })
  ] });
}
const FAST_MODEL = "claude-haiku-4-5";
function buildWhatNowPrompt(tasks) {
  const taskList = tasks.slice(0, 20).map(
    (t, i) => `${i + 1}. [${t.id}] ${t.title}` + (t.estimatedMinutes ? ` (~${t.estimatedMinutes}m)` : "") + (t.focusCost !== void 0 ? ` focus:${t.focusCost}` : "") + (t.priority !== void 0 ? ` priority:${t.priority}` : "") + (t.project ? ` (${t.project})` : "")
  ).join("\n");
  const prompt = `[Intent: what_now]
You are the execution selector. Pick the single highest-leverage next task.

Tasks:
${taskList}

Rules:
1. Optimize for momentum + real-world impact.
2. Prefer tasks that unblock others, are short (<45 min), or reduce uncertainty.
3. Avoid vague, exploratory, or long high-friction tasks unless critical.

Respond ONLY with valid JSON (no markdown, no prose):
{
  "best_task_id": "<id>",
  "rationale": "<1-2 sentences>",
  "expected_outcome": "<one sentence>",
  "why_now": "<constraint or leverage reason>"
}`;
  return { prompt, model: FAST_MODEL };
}
function buildUpNextPrompt(tasks) {
  const taskList = tasks.slice(0, 15).map(
    (t, i) => `${i + 1}. [${t.id}] ${t.title}` + (t.estimatedMinutes ? ` (~${t.estimatedMinutes}m)` : "") + (t.project ? ` (${t.project})` : "")
  ).join("\n");
  const prompt = `[Intent: up_next]
You are a workflow planner. Turn the task list into a 3-step execution sequence.

Tasks:
${taskList}

Rules:
1. Select 2-4 tasks only.
2. Order by: dependency → ease of execution → momentum.
3. Prefer: quick wins first, setup → execution → validation pattern.

Respond ONLY with valid JSON (no markdown, no prose):
{
  "flow_label": "<optional one-phrase label>",
  "steps": [
    { "id": "<task_id>", "title": "<title>", "duration": "<Xm>", "reason": "<why this order>" }
  ]
}`;
  return { prompt, model: FAST_MODEL };
}
function buildStepExtractorPrompt(responseText) {
  const truncated = responseText.slice(0, 3e3);
  const prompt = `[Intent: step_extract]
You are an execution extractor. Turn this assistant response into atomic, actionable steps.

Response:
"""
${truncated}
"""

Rules:
1. Break into atomic actions (1 action = 1 step).
2. Each step must be: concrete, testable, actionable without interpretation.
3. Remove all explanation and fluff.

Respond ONLY with valid JSON (no markdown, no prose):
{
  "steps": [
    { "title": "<short label>", "action": "<imperative sentence>", "expected_result": "<one sentence>" }
  ]
}`;
  return { prompt, model: FAST_MODEL };
}
function buildInboxConverterPrompt(rawText) {
  const truncated = rawText.slice(0, 1500);
  const prompt = `[Intent: inbox_convert]
You are a task normalizer. Convert this raw inbox item into a structured, executable task.

Item:
"""
${truncated}
"""

Rules:
1. Extract the core intent — what needs to be done.
2. Convert into a single clear task title (imperative, < 10 words).
3. Estimate duration and effort honestly.
4. Type: "execution" (build/do), "research" (investigate), or "setup" (configure/prepare).

Respond ONLY with valid JSON (no markdown, no prose):
{
  "title": "<imperative task title>",
  "duration": "<Xm or Xh>",
  "effort": "low" | "medium" | "high",
  "type": "execution" | "research" | "setup",
  "project": "<project name if obvious, else null>"
}`;
  return { prompt, model: FAST_MODEL };
}
function buildSystemSummarizerPrompt(tasks, projects) {
  const taskSummary = tasks.slice(0, 20).map((t) => `- [${t.status ?? "todo"}] ${t.title}${t.project ? ` (${t.project})` : ""}`).join("\n");
  const projectSummary = projects.slice(0, 8).map((p) => `- ${p.title}${p.taskCount !== void 0 ? ` (${p.taskCount} tasks)` : ""}`).join("\n");
  const prompt = `[Intent: system_summarize]
You are a system summarizer. Give a 3-bullet executive summary of current execution state.

Tasks:
${taskSummary || "(none)"}

Projects:
${projectSummary || "(none)"}

Rules:
1. Highlight: what is actively progressing, what is blocked, what is at risk.
2. Be brutally concise — max 3 bullets, each < 15 words.
3. Only surface things that actually matter right now.

Respond ONLY with valid JSON (no markdown, no prose):
{
  "summary": ["<bullet 1>", "<bullet 2>", "<bullet 3>"]
}`;
  return { prompt, model: FAST_MODEL };
}
async function invokeAgent(prompt, model) {
  const res = await apiFetch("/tensura/v1/supervisor/invoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [prompt], model })
  });
  if (!res.ok) {
    throw new Error(`Agent invoke failed: ${res.status}`);
  }
  const data = await res.json();
  if (!data.ok || !data.result) {
    throw new Error("Agent returned no result");
  }
  const raw = data.result.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(raw);
}
function useWhatNowQuery(tasks, options) {
  const enabled = (options?.enabled ?? true) && tasks.length > 0;
  const { prompt, model } = buildWhatNowPrompt(tasks);
  return useQuery({
    queryKey: ["agent", "what-now", tasks.map((t) => t.id).join(",")],
    queryFn: () => invokeAgent(prompt, model),
    enabled,
    staleTime: 1e3 * 60 * 5,
    // 5 min — task selection doesn't change that fast
    retry: 0
  });
}
function useUpNextQuery(tasks, options) {
  const enabled = (options?.enabled ?? true) && tasks.length > 0;
  const { prompt, model } = buildUpNextPrompt(tasks);
  return useQuery({
    queryKey: ["agent", "up-next", tasks.map((t) => t.id).join(",")],
    queryFn: () => invokeAgent(prompt, model),
    enabled,
    staleTime: 1e3 * 60 * 5,
    retry: 0
  });
}
function useStepExtractorQuery(responseText, options) {
  const enabled = (options?.enabled ?? true) && responseText.trim().length > 0;
  const { prompt, model } = buildStepExtractorPrompt(responseText);
  return useQuery({
    queryKey: ["agent", "step-extract", responseText.slice(0, 64)],
    queryFn: () => invokeAgent(prompt, model),
    enabled,
    staleTime: Infinity,
    // response text is immutable once set
    retry: 0
  });
}
function useInboxConverterMutation() {
  return useMutation({
    mutationFn: (rawText) => {
      const { prompt, model } = buildInboxConverterPrompt(rawText);
      return invokeAgent(prompt, model);
    }
  });
}
function useSystemSummarizerQuery(tasks, projects, options) {
  const enabled = (options?.enabled ?? true) && tasks.length > 0;
  const { prompt, model } = buildSystemSummarizerPrompt(tasks, projects);
  return useQuery({
    queryKey: ["agent", "system-summary", tasks.map((t) => t.id).join(",")],
    queryFn: () => invokeAgent(prompt, model),
    enabled,
    staleTime: 1e3 * 60 * 5,
    retry: 0
  });
}
const STATUS_COLUMNS = [
  { key: "todo", label: "To Do", sort: (a, b) => (b.priority || 0) - (a.priority || 0) },
  { key: "in-progress", label: "In Progress", sort: (a, b) => (b.priority || 0) - (a.priority || 0) },
  { key: "blocked", label: "Blocked", sort: (a, b) => (b.createdAt || 0) - (a.createdAt || 0) },
  { key: "completed", label: "Completed", sort: (a, b) => (b.completedAt || 0) - (a.completedAt || 0) }
];
const RECENT_COMPLETED_DAYS = 7;
const isRecurringTask = (task) => {
  const tags = task.tags || [];
  return tags.some((t) => t.toLowerCase().includes("recurring"));
};
const toDate = (value) => {
  if (!value || typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};
const normalizeTask = (task = {}) => {
  const slugPath = task.slug ? String(task.slug).replace(/^\//, "").replace(/\/$/, "") : "";
  const notePath = task.path ? String(task.path).replace(/\.md$/, "") : slugPath;
  const cmsSlug = notePath || slugPath;
  const link = notePath ? `/note?p=${encodeURIComponent(notePath)}` : "#";
  return {
    id: task.id || task.path || link,
    title: task.title || task.path || "Untitled",
    status: (task.status || "todo").toLowerCase(),
    priority: typeof task.priority === "number" ? task.priority : 0,
    estimatedTimeMin: task.estimatedTimeMin,
    tags: task.tags || [],
    goalId: task.goalId,
    projectId: task.projectId,
    completedAt: toDate(task.completedAt)?.getTime() || null,
    createdAt: toDate(task.created)?.getTime() || null,
    path: task.path,
    cmsSlug,
    link
  };
};
const buildColumns = (tasks, filterTag, filterProject, showCompleted, excludeRecurring = true) => {
  const now = Date.now();
  const cutoff = now - RECENT_COMPLETED_DAYS * 24 * 60 * 60 * 1e3;
  const filtered = tasks.filter((task) => {
    if (filterTag && !(task.tags || []).includes(filterTag)) return false;
    if (filterProject && task.projectId !== filterProject) return false;
    if (excludeRecurring && isRecurringTask(task)) return false;
    return true;
  });
  const visibleColumns = showCompleted ? STATUS_COLUMNS : STATUS_COLUMNS.filter((col) => col.key !== "completed");
  return visibleColumns.map((col) => {
    const items = filtered.filter((t) => {
      if (col.key === "completed" && t.completedAt && t.completedAt < cutoff) {
        return false;
      }
      return t.status === col.key;
    }).sort(col.sort);
    return { ...col, items };
  });
};
const filterBacklog = (tasks, filterTag, filterProject, excludeRecurring = true) => {
  return tasks.filter((task) => {
    if (task.status !== "backlog") return false;
    if (filterTag && !(task.tags || []).includes(filterTag)) return false;
    if (filterProject && task.projectId !== filterProject) return false;
    if (excludeRecurring && isRecurringTask(task)) return false;
    return true;
  });
};
async function fetchAllTasks() {
  const res = await apiFetch("/api/v1/tasks?status=all&limit=1000");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const body = await res.json();
  const raw = body.structuredContent?.tasks ?? body.tasks ?? [];
  return raw.map((r) => normalizeTask(r));
}
const statusVariantMap = {
  completed: "success",
  active: "default",
  "on-hold": "warning",
  paused: "warning",
  blocked: "danger"
};
const looksTemplated = (value) => typeof value === "string" && value.includes("{{") && value.includes("}}");
const shouldHideProject = (raw) => {
  const path = typeof raw.path === "string" ? raw.path : "";
  const title = typeof raw.title === "string" ? raw.title : "";
  const id = typeof raw.id === "string" ? raw.id : "";
  if (path.startsWith("_system/templates/") || path.startsWith("templates/") || path.includes("/templates/")) {
    return true;
  }
  if (path.startsWith("archive/")) {
    return true;
  }
  if (looksTemplated(title) || looksTemplated(id)) {
    return true;
  }
  return false;
};
async function fetchProjects() {
  const res = await apiFetch("/api/v1/projects");
  if (!res.ok) {
    throw new Error("Failed to fetch projects");
  }
  const body = await res.json();
  const raw = body.structuredContent?.projects ?? body.projects ?? [];
  return raw.filter((r) => !shouldHideProject(r)).map((r) => {
    const progressPercent = (() => {
      if (typeof r.progress === "number") return Math.round(r.progress * 100);
      if (typeof r.completedTaskCount === "number" && typeof r.taskCount === "number" && r.taskCount > 0) {
        return Math.round(r.completedTaskCount / r.taskCount * 100);
      }
      return r.progressPercent ?? 0;
    })();
    const rawStatus = r.status ?? "active";
    const statusVariant = statusVariantMap[rawStatus] ?? "default";
    const statusLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).replace(/-/g, " ");
    return {
      id: r.id ?? r.domain ?? r.path ?? r.slug ?? String(r.title || "").toLowerCase().replace(/\s+/g, "-"),
      title: r.title ?? r.name ?? "Untitled",
      statusVariant,
      statusLabel,
      progressPercent,
      progressText: `${progressPercent}%`,
      etaLabel: r.eta ?? null,
      bestMoveTitle: (r.nextAction && r.nextAction.title) ?? r.bestMove ?? r.nextActionTitle ?? null
    };
  });
}
async function fetchProjectById(id) {
  const all = await fetchProjects();
  return all.find((p) => p.id === id || p.id === decodeURIComponent(id)) ?? null;
}
function getProjectQueryOptions(id) {
  return {
    queryKey: ["project", id],
    queryFn: () => fetchProjectById(id),
    staleTime: 6e4,
    retry: 1
  };
}
const $$splitComponentImporter$v = () => import("./cod-status-SaNRfequ.js");
const Route$x = createFileRoute("/cod-status")({
  component: lazyRouteComponent($$splitComponentImporter$v, "component")
});
function CODStatusRoute({
  onRequestClose
} = {}) {
  const navigate = useNavigate();
  const {
    data: tasks
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchAllTasks,
    staleTime: 1e3 * 60
  });
  const {
    data: projects
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 1e3 * 60
  });
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
  const agentTasks = (tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status ?? void 0,
    priority: void 0,
    estimatedMin: t.estimatedTimeMin ?? void 0,
    project: void 0
  }));
  const agentProjects = (projects ?? []).map((p) => ({
    id: p.id ?? p.title,
    title: p.title
  }));
  const {
    data: summaryData
  } = useSystemSummarizerQuery(agentTasks, agentProjects, {
    enabled: agentTasks.length > 0
  });
  return /* @__PURE__ */ jsx("div", { className: "route-modal-overlay", onClick: closeOverlay, children: /* @__PURE__ */ jsxs("section", { className: "route-modal-card route-modal-card--cod genie-surface genie-surface--overlay", onClick: (event) => event.stopPropagation(), onKeyDown: (event) => event.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-label": "COD", children: [
    /* @__PURE__ */ jsx("button", { type: "button", className: "route-modal-close", onClick: closeOverlay, "aria-label": "Close COD", children: "✕" }),
    /* @__PURE__ */ jsxs("div", { className: "route-modal-scroll route-modal-body space-y-4", children: [
      /* @__PURE__ */ jsx("header", { className: "rounded-[28px] p-6 genie-surface genie-surface--hero genie-layer-hero", children: /* @__PURE__ */ jsxs("div", { className: "genie-content", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-semibold tracking-tight text-slate-800", children: "Readiness" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-600", children: "Can you work now, and under what constraints?" })
      ] }) }),
      summaryData?.summary && summaryData.summary.length > 0 && /* @__PURE__ */ jsx("div", { className: "genie-surface genie-surface--hero rounded-xl px-4 py-3 space-y-1.5", children: /* @__PURE__ */ jsxs("div", { className: "genie-content", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-slate-300 uppercase tracking-wider", children: "System State" }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: summaryData.summary.map((bullet, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-slate-200", children: [
          /* @__PURE__ */ jsx("span", { className: "mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" }),
          bullet
        ] }, i)) })
      ] }) }),
      /* @__PURE__ */ jsx(CodModal, {})
    ] })
  ] }) });
}
const appCss = "/_viewer/assets/styles-CQOqjJCR.css";
const SHELL_V3 = false;
const Route$w = createRootRouteWithContext()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "Vaulty Viewer" }
      ],
      links: [{ rel: "stylesheet", href: appCss }]
    }),
    component: RootComponent,
    errorComponent: RootError,
    notFoundComponent: RootNotFound
  }
);
function RootComponent() {
  const router2 = useRouter();
  const queryClient = router2.options.context.queryClient;
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });
  const [navOverlay, setNavOverlay] = React.useState(null);
  const hideShell = isShellHiddenPath(pathname);
  const routeHasOwnOverlay = pathname === "/avatar" || pathname === "/cod-status";
  const closeNavOverlay = React.useCallback(() => {
    setNavOverlay(null);
  }, []);
  React.useEffect(() => {
    setNavOverlay(null);
  }, [pathname]);
  React.useEffect(() => {
    if (hideShell) return;
    const onOverlayEvent = (event) => {
      const detail = event.detail;
      setNavOverlay(detail?.type ?? null);
    };
    window.addEventListener(NAV_OVERLAY_EVENT, onOverlayEvent);
    return () => window.removeEventListener(
      NAV_OVERLAY_EVENT,
      onOverlayEvent
    );
  }, [hideShell]);
  const dehydratedState = typeof window === "undefined" ? dehydrate(queryClient) : void 0;
  return /* @__PURE__ */ jsx(RootDocument, { dehydratedState, children: /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen", children: [
    hideShell ? /* @__PURE__ */ jsx(Outlet, {}) : /* @__PURE__ */ jsx(AppShell, { rail: /* @__PURE__ */ jsx(SidebarRail, {}), children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen pb-10", children: [
      /* @__PURE__ */ jsx(TopCommandBar, {}),
      /* @__PURE__ */ jsx(Outlet, {})
    ] }) }),
    !hideShell && /* @__PURE__ */ jsx(VerificationRailHost, {}),
    !routeHasOwnOverlay && navOverlay === "avatar" && /* @__PURE__ */ jsx(AvatarRoute$1, { onRequestClose: closeNavOverlay }),
    !routeHasOwnOverlay && navOverlay === "cod" && /* @__PURE__ */ jsx(CODStatusRoute, { onRequestClose: closeNavOverlay }),
    SHELL_V3,
    SHELL_V3
  ] }) }) });
}
function RootDocument({
  children,
  dehydratedState
}) {
  const hydrationScript = dehydratedState ? `window.__VIEWER_DEHYDRATED_STATE__=${serializeDehydratedQueryState(dehydratedState)};` : "";
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(
        "script",
        {
          suppressHydrationWarning: true,
          dangerouslySetInnerHTML: { __html: hydrationScript }
        }
      )
    ] })
  ] });
}
function RootError({ error }) {
  return /* @__PURE__ */ jsxs("main", { className: "page", children: [
    /* @__PURE__ */ jsxs("header", { className: "page-header", children: [
      /* @__PURE__ */ jsx("h1", { children: "Viewer Error" }),
      /* @__PURE__ */ jsx("p", { className: "lede", children: "Something went wrong while rendering this route." })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "card", children: /* @__PURE__ */ jsx("p", { children: error.message }) })
  ] });
}
function RootNotFound() {
  return /* @__PURE__ */ jsx("main", { className: "page", children: /* @__PURE__ */ jsxs("header", { className: "page-header", children: [
    /* @__PURE__ */ jsx("h1", { children: "Not Found" }),
    /* @__PURE__ */ jsx("p", { className: "lede", children: "This route does not exist." })
  ] }) });
}
const $$splitComponentImporter$u = () => import("./work-DR58IlIE.js");
const Route$v = createFileRoute("/work")({
  validateSearch: workSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$u, "component")
});
const $$splitComponentImporter$t = () => import("./timeline--RxMNxAy.js");
const Route$u = createFileRoute("/timeline")({
  validateSearch: timelineSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$t, "component")
});
const $$splitComponentImporter$s = () => import("./settings-q5dtLZSQ.js");
const Route$t = createFileRoute("/settings")({
  validateSearch: (search) => ({
    tab: readStringSearchParam(search.tab)
  }),
  component: lazyRouteComponent($$splitComponentImporter$s, "component")
});
const Route$s = createFileRoute("/projects")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/projects" || location.pathname === "/projects/") {
      throw redirect({
        to: "/work",
        replace: true,
        search: {}
      });
    }
  },
  component: ProjectsIndex
});
function ProjectsIndex() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const $$splitComponentImporter$r = () => import("./portfolio-dGqBXUCK.js");
const Route$r = createFileRoute("/portfolio")({
  validateSearch: portfolioSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$r, "component")
});
const $$splitComponentImporter$q = () => import("./note-CLbQTO8R.js");
const Route$q = createFileRoute("/note")({
  validateSearch: (search) => ({
    p: search.p ?? ""
  }),
  component: lazyRouteComponent($$splitComponentImporter$q, "component")
});
const $$splitComponentImporter$p = () => import("./login-BvDbZKeU.js");
const Route$p = createFileRoute("/login")({
  validateSearch: (search) => ({
    return_to: typeof search.return_to === "string" ? search.return_to : void 0,
    error: typeof search.error === "string" ? search.error : void 0
  }),
  component: lazyRouteComponent($$splitComponentImporter$p, "component")
});
const $$splitComponentImporter$o = () => import("./knowledge-ClUj-RZ-.js");
const Route$o = createFileRoute("/knowledge")({
  validateSearch: knowledgeSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$o, "component")
});
const $$splitComponentImporter$n = () => import("./kanban-pQhtYmKx.js");
const Route$n = createFileRoute("/kanban")({
  component: lazyRouteComponent($$splitComponentImporter$n, "component")
});
function getInboxNoteSource(notePath) {
  if (notePath.startsWith("inbox/rejected/")) return "rejected";
  if (notePath.startsWith("inbox/extracted/")) return "extracted";
  return "inbox";
}
function splitInboxNotes(rawNotes) {
  const workbenchNotes = [];
  const archiveNotes = [];
  for (const note of rawNotes) {
    const source = getInboxNoteSource(note.path);
    const enriched = { ...note, source };
    if (source === "rejected") {
      archiveNotes.push(enriched);
    } else {
      workbenchNotes.push(enriched);
    }
  }
  return { workbenchNotes, archiveNotes };
}
function computeInboxCounts(runs, workbenchNotes, archiveNotes) {
  return {
    queue: runs.length,
    workbench: workbenchNotes.length,
    archive: archiveNotes.length
  };
}
function defaultInboxView(queueCount) {
  return queueCount > 0 ? "queue" : "workbench";
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function clampScore(value, max = 10) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.round(value)));
}
function severityFromTask(task) {
  if (Array.isArray(task.blockers) && task.blockers.length > 0)
    return "critical";
  if (task.score >= 8 || task.priority >= 9) return "high";
  if (task.score >= 5 || task.priority >= 6) return "medium";
  return "low";
}
function reversibilityFromTask(task) {
  if (task.status === "in-progress") return "medium";
  if ((task.estimatedTimeMin ?? 0) > 90) return "low";
  return "high";
}
function taskSignalKind(task) {
  if (Array.isArray(task.blockers) && task.blockers.length > 0)
    return "blocker";
  if (task.status === "blocked") return "blocker";
  if (task.status === "in-progress") return "risk";
  return "stale";
}
function taskEntity(task) {
  return {
    id: task.id,
    type: "task",
    title: task.title,
    projectId: task.projectId,
    status: task.status
  };
}
function taskSignal(task) {
  const severity = severityFromTask(task);
  const signalScore = task.score || task.priority || 0;
  return {
    id: `signal:${task.id}`,
    kind: taskSignalKind(task),
    title: task.title,
    summary: task.description ?? (severity === "critical" ? "This task is actively blocked and likely holding up other work." : "This task surfaced from the active work queue."),
    severity,
    surfacedBy: "cod",
    sourceType: "task",
    sourceId: task.id,
    projectId: task.projectId,
    surfaceScope: task.projectId ? "project" : "home",
    surfacedAt: nowIso(),
    whySurfaced: Array.isArray(task.blockers) && task.blockers.length > 0 ? "Blocked work is prioritized because clearing it can unblock the rest of the queue." : task.score >= 8 ? "High combined priority and leverage make this task worth surfacing now." : "This task is near the top of the next-actions queue and is ready to move.",
    score: signalScore,
    state: "fresh",
    mutationRef: {
      domain: "work",
      operation: "create_task",
      targetId: task.id
    },
    confidence: task.score ? Math.min(0.95, Math.max(0.4, task.score / 10)) : 0.5,
    reversibility: reversibilityFromTask(task),
    allowedActions: [
      {
        actionType: "create_task",
        label: "Open task",
        mutationRef: {
          domain: "work",
          operation: "create_task",
          targetId: task.id
        }
      },
      {
        actionType: "defer",
        label: "Defer",
        mutationRef: {
          domain: "work",
          operation: "defer_signal",
          targetId: task.id
        }
      }
    ]
  };
}
function taskRecommendation(task) {
  const reversibility = reversibilityFromTask(task);
  const breakdown = {
    urgency: clampScore(task.priority),
    impact: clampScore(task.score),
    blockageRemoval: Array.isArray(task.blockers) && task.blockers.length > 0 ? 9 : 4,
    reversibility: reversibility === "high" ? 8 : reversibility === "medium" ? 5 : 2,
    confidence: clampScore((task.score || task.priority || 5) * 0.9),
    total: clampScore(
      (task.score || 0) + task.priority + (Array.isArray(task.blockers) && task.blockers.length > 0 ? 2 : 0),
      30
    ),
    normalizedTotal: Math.min(
      1,
      Math.max(0, ((task.score || 0) + task.priority) / 20)
    ),
    explanation: Array.isArray(task.blockers) && task.blockers.length > 0 ? "Blocked work gets extra weight because clearing it can unblock downstream items." : "Higher priority and leverage push the recommendation upward."
  };
  return {
    id: `action:${task.id}`,
    title: task.title,
    summary: task.description ?? "Recommended next move from the active queue.",
    actionType: "create_task",
    surfacedBy: "cod",
    sourceSignalIds: [`signal:${task.id}`],
    sourceEntities: [taskEntity(task)],
    projectId: task.projectId,
    score: task.score,
    scoreBreakdown: breakdown,
    whyNow: Array.isArray(task.blockers) && task.blockers.length > 0 ? "Resolving this item should remove immediate friction in the queue." : (task.estimatedTimeMin ?? 0) <= 45 ? "It is short enough to create momentum without expensive context switching." : "It sits high in the queue and carries meaningful leverage right now.",
    expectedEffect: task.projectId ? `Progress moves forward for ${task.projectId}.` : "The visible queue should become clearer after execution.",
    confidence: Math.min(0.95, Math.max(0.35, (task.score || 5) / 10)),
    reversibility,
    state: reversibility === "high" ? "ready" : "proposed",
    mutationRef: {
      domain: "work",
      operation: "create_task",
      targetId: task.id
    }
  };
}
function noteRejectionType(note) {
  const source = note.frontmatter?.rejection_source;
  if (typeof source === "string" && source.toLowerCase().includes("user"))
    return "user";
  return "automated";
}
function buildHomeSurfacePayload(tasks) {
  const recommendations = tasks.slice(0, 5).map(taskRecommendation);
  const pressureBand = tasks.slice(0, 5).map(taskSignal);
  const verificationRail = tasks.slice(0, 3).map((task) => ({
    id: `verification:${task.id}`,
    actionId: `action:${task.id}`,
    mutationId: `mutation:${task.id}`,
    entity: taskEntity(task),
    startedAt: nowIso(),
    status: task.status === "blocked" ? "warning" : "pending",
    improved: void 0,
    followUpNeeded: task.status === "blocked",
    summary: `Verification pending for ${task.title}`,
    evidence: task.description ? [task.description] : void 0,
    nextRecommendedActionId: task.score >= 8 ? `action:${task.id}` : void 0,
    stage: "started",
    surfaceScope: task.projectId ? "project" : "home"
  }));
  return {
    pressureBand,
    decisionQueue: recommendations,
    immediateActions: recommendations.filter((item) => item.reversibility === "high").slice(0, 3),
    verificationRail,
    snapshots: {
      automation: pressureBand.filter((item) => item.kind === "blocker").slice(0, 2),
      knowledge: tasks.slice(0, 2).map((task) => ({
        id: `context:${task.id}`,
        contextType: "note",
        title: task.title,
        summary: task.description ?? "Task context selected from the active queue.",
        sourceId: task.id,
        projectId: task.projectId,
        reasonSelected: "This item is directly linked to currently surfaced work.",
        freshness: "fresh",
        linkedEntities: [taskEntity(task)]
      })),
      portfolio: pressureBand.filter((item) => item.projectId).slice(0, 2),
      bubble: [],
      health: []
    },
    contextTail: tasks.slice(0, 3).map((task) => ({
      id: `context-tail:${task.id}`,
      contextType: "note",
      title: task.title,
      summary: task.description ?? "Relevant queue context.",
      sourceId: task.id,
      projectId: task.projectId,
      reasonSelected: "Selected because it is adjacent to the highest-priority work.",
      freshness: "fresh",
      linkedEntities: [taskEntity(task)]
    }))
  };
}
function buildInboxSurfacePayload(args) {
  const runItems = args.runs.map((run, index) => {
    const runId = String(run.runId ?? `run-${index}`);
    const confidence = typeof run.confidence === "number" ? run.confidence : 0.5;
    return {
      id: `signal:${runId}`,
      kind: confidence < 0.45 ? "risk" : "rejection",
      title: String(run.action ?? run.runType ?? runId),
      summary: `${Number(run.itemCount ?? 0)} staged item(s) awaiting review.`,
      severity: confidence < 0.45 ? "high" : "medium",
      surfacedBy: "cod",
      sourceType: "note",
      sourceId: runId,
      surfacedAt: nowIso(),
      whySurfaced: "This staged run needs operator review before promotion or rejection.",
      confidence,
      reversibility: "high",
      allowedActions: [
        {
          actionType: "approve",
          label: "Approve",
          mutationRef: {
            domain: "knowledge",
            operation: "approve_pipeline",
            targetId: runId
          }
        },
        {
          actionType: "defer",
          label: "Defer",
          mutationRef: {
            domain: "knowledge",
            operation: "defer_signal",
            targetId: runId
          }
        }
      ],
      inboxBucket: confidence < 0.45 ? "needs_approval" : "needs_action"
    };
  });
  const rejected = args.archiveNotes.map((note) => {
    const rejectionType = noteRejectionType(note);
    return {
      id: `signal:${note.path}`,
      kind: "rejection",
      title: note.title,
      summary: note.path,
      severity: rejectionType === "user" ? "medium" : "high",
      surfacedBy: "cod",
      sourceType: "note",
      sourceId: note.path,
      surfacedAt: nowIso(),
      whySurfaced: rejectionType === "user" ? "Human rejection remains visible as a distinct audit trail." : "Automated rejection stays separate so override and fix paths remain visible.",
      confidence: rejectionType === "user" ? 0.85 : 0.65,
      reversibility: rejectionType === "user" ? "medium" : "high",
      allowedActions: rejectionType === "user" ? [
        {
          actionType: "reopen",
          label: "Reopen",
          mutationRef: {
            domain: "knowledge",
            operation: "reopen_signal",
            targetId: note.path
          }
        }
      ] : [
        {
          actionType: "override",
          label: "Override",
          mutationRef: {
            domain: "knowledge",
            operation: "override_rejection",
            targetId: note.path
          }
        }
      ],
      inboxBucket: rejectionType === "user" ? "rejected_user" : "rejected_automated",
      rejectionType,
      rejectionReason: typeof note.frontmatter?.rejection_reason === "string" ? String(note.frontmatter.rejection_reason) : void 0,
      rejectionSource: note.source
    };
  });
  const workbench = args.workbenchNotes.map((note) => ({
    id: `signal:${note.path}`,
    kind: "stale",
    title: note.title,
    summary: note.path,
    severity: "low",
    surfacedBy: "cod",
    sourceType: "note",
    sourceId: note.path,
    surfacedAt: nowIso(),
    whySurfaced: "Workbench items remain visible as operator context and follow-up material.",
    confidence: 0.55,
    reversibility: "high",
    allowedActions: [{ actionType: "open_source", label: "Open note" }],
    inboxBucket: "deferred"
  }));
  return [...runItems, ...rejected, ...workbench];
}
function buildActionsSurfacePayload(tasks) {
  const recommendations = tasks.map(taskRecommendation);
  const verificationRail = recommendations.slice(0, 3).map((item) => ({
    id: `verification:${item.id}`,
    actionId: item.id,
    mutationId: item.mutationRef ? `${item.mutationRef.domain}:${item.mutationRef.targetId}` : void 0,
    entity: item.sourceEntities[0],
    startedAt: nowIso(),
    status: item.reversibility === "high" ? "pending" : "warning",
    improved: void 0,
    followUpNeeded: item.requiresApproval ?? false,
    summary: `Verification pending for ${item.title}`,
    evidence: [item.whyNow],
    nextRecommendedActionId: item.id,
    stage: "started",
    surfaceScope: "actions"
  }));
  return {
    recommendations,
    verificationRail
  };
}
function buildProjectSurfacePayload(args) {
  const pressureBand = args.tasks.slice(0, 5).map(taskSignal);
  const decisionQueue = args.tasks.slice(0, 5).map(taskRecommendation);
  const contextPanel = args.tasks.slice(0, 3).map((task) => ({
    id: `context:${task.id}`,
    contextType: "note",
    title: task.title,
    summary: task.description ?? "Project-linked execution context.",
    sourceId: task.id,
    projectId: args.projectId,
    reasonSelected: "Selected because it is directly tied to this project queue.",
    freshness: "fresh",
    linkedEntities: [taskEntity(task)]
  }));
  return {
    projectId: args.projectId,
    pressureBand,
    decisionQueue,
    immediateActions: decisionQueue.filter((item) => item.reversibility === "high").slice(0, 3),
    verificationRail: decisionQueue.slice(0, 3).map((item) => ({
      id: `verification:${item.id}`,
      actionId: item.id,
      mutationId: item.mutationRef ? `${item.mutationRef.domain}:${item.mutationRef.targetId}` : void 0,
      entity: item.sourceEntities[0],
      startedAt: nowIso(),
      status: "pending",
      improved: void 0,
      followUpNeeded: item.reversibility !== "high",
      summary: `Project verification pending for ${item.title}`,
      evidence: [item.whyNow],
      nextRecommendedActionId: item.id,
      stage: "started",
      surfaceScope: "project"
    })),
    executionSnapshot: {
      activeTasks: args.tasks.slice(0, 5).map(taskEntity),
      activePipelines: [],
      activeRunners: [],
      hueyJobs: [],
      scheduleItems: []
    },
    contextPanel,
    timelineHints: args.tasks.slice(0, 3).map(taskEntity),
    dependencyRiskSignals: pressureBand.filter(
      (item) => item.kind === "blocker" || item.kind === "risk"
    )
  };
}
async function fetchRichNextActions(max = 25) {
  const res = await apiFetch(`/api/v1/tasks/next-actions?max=${max}`);
  if (!res.ok) throw new Error(`Failed to fetch next actions: ${res.status}`);
  const body = await res.json();
  const raw = body.structuredContent?.tasks ?? body.tasks ?? [];
  return raw.map(normalizeNextAction);
}
function getHomeSurfaceQueryOptions() {
  return {
    queryKey: ["viewer-adapter", "home-surface"],
    queryFn: async () => buildHomeSurfacePayload(await fetchRichNextActions(25)),
    staleTime: 6e4,
    retry: 1
  };
}
function useHomeSurface(initialData) {
  return useQuery({
    ...getHomeSurfaceQueryOptions(),
    initialData
  });
}
async function fetchInboxSurfaceSource() {
  const res = await apiFetch("/api/v1/inbox");
  if (!res.ok) throw new Error(`Failed to fetch inbox: ${res.status}`);
  const body = await res.json();
  const structured = body?.structuredContent;
  const notes = Array.isArray(structured?.notes ?? body?.notes) ? structured?.notes ?? body?.notes : [];
  const runs = Array.isArray(structured?.runs ?? body?.runs) ? structured?.runs ?? body?.runs : [];
  const { workbenchNotes, archiveNotes } = splitInboxNotes(notes);
  return {
    runs,
    workbenchNotes,
    archiveNotes
  };
}
function getInboxSurfaceQueryOptions() {
  return {
    queryKey: ["viewer-adapter", "inbox-surface"],
    queryFn: async () => buildInboxSurfacePayload(await fetchInboxSurfaceSource()),
    staleTime: 3e4,
    retry: 1
  };
}
function useInboxSurface(initialData) {
  return useQuery({
    ...getInboxSurfaceQueryOptions(),
    initialData
  });
}
function getActionsSurfaceQueryOptions() {
  return {
    queryKey: ["viewer-adapter", "actions-surface"],
    queryFn: async () => buildActionsSurfacePayload(await fetchRichNextActions(25)),
    staleTime: 6e4,
    retry: 1
  };
}
function useActionsSurface(initialData) {
  return useQuery({
    ...getActionsSurfaceQueryOptions(),
    initialData
  });
}
function getProjectSurfaceQueryOptions(projectId) {
  return {
    queryKey: ["viewer-adapter", "project-surface", projectId],
    queryFn: async () => {
      const tasks = await fetchRichNextActions(50);
      return buildProjectSurfacePayload({
        projectId,
        tasks: tasks.filter((task) => task.projectId === projectId)
      });
    },
    staleTime: 6e4,
    retry: 1
  };
}
function useProjectSurface(projectId, initialData) {
  return useQuery({
    ...getProjectSurfaceQueryOptions(projectId),
    enabled: !!projectId,
    initialData
  });
}
const $$splitComponentImporter$m = () => import("./inbox-CHogeHyu.js");
const Route$m = createFileRoute("/inbox")({
  validateSearch: inboxSearchParams,
  loader: async ({
    context
  }) => {
    await context.queryClient.ensureQueryData(getInboxSurfaceQueryOptions());
  },
  component: lazyRouteComponent($$splitComponentImporter$m, "component")
});
const $$splitComponentImporter$l = () => import("./huey-L17wA44C.js");
const Route$l = createFileRoute("/huey")({
  component: lazyRouteComponent($$splitComponentImporter$l, "component")
});
const $$splitComponentImporter$k = () => import("./health-C1-QcOr5.js");
const Route$k = createFileRoute("/health")({
  validateSearch: healthSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitComponentImporter$j = () => import("./graph-DcR0oAj5.js");
const Route$j = createFileRoute("/graph")({
  validateSearch: graphSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./goals-CGEji0BL.js");
const Route$i = createFileRoute("/goals")({
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const $$splitComponentImporter$h = () => import("./bubble-CqddcgXG.js");
const Route$h = createFileRoute("/bubble")({
  validateSearch: bubbleSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const $$splitComponentImporter$g = () => import("./automation-DKcqfVtw.js");
const Route$g = createFileRoute("/automation")({
  validateSearch: automationSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./archive-DqpNAbAl.js");
const Route$f = createFileRoute("/archive")({
  validateSearch: archiveSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./actions-CE07_-3l.js");
const Route$e = createFileRoute("/actions")({
  validateSearch: actionsSearchParams,
  loader: async ({
    context
  }) => {
    await context.queryClient.ensureQueryData(getActionsSurfaceQueryOptions());
  },
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./index-Bss0S4PI.js");
const Route$d = createFileRoute("/")({
  validateSearch: homeSearchParams,
  loader: async ({
    context
  }) => {
    await context.queryClient.ensureQueryData(getHomeSurfaceQueryOptions());
  },
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./session._id-CL-aAozg.js");
const Route$c = createFileRoute("/session/$id")({
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./projects._projectId-vzsMG2Mk.js");
const Route$b = createFileRoute("/projects/$projectId")({
  beforeLoad: ({
    params
  }) => {
    throw redirect({
      to: "/project/$slug",
      params: {
        slug: params.projectId
      },
      search: {
        tab: void 0,
        selectedId: void 0,
        noteId: void 0,
        mode: void 0,
        templateId: void 0,
        memoryTab: void 0
      },
      replace: true
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
function getAllTasksQueryOptions() {
  return {
    queryKey: ["tasks"],
    queryFn: fetchAllTasks,
    staleTime: 1e3 * 60,
    retry: 1
  };
}
function useAllTasks() {
  return useQuery(getAllTasksQueryOptions());
}
const $$splitComponentImporter$a = () => import("./project._slug-B3MZf9w5.js");
const Route$a = createFileRoute("/project/$slug")({
  validateSearch: projectSearchParams,
  loader: async ({
    params,
    context
  }) => {
    const projectId = params.slug;
    await Promise.all([context.queryClient.ensureQueryData(getProjectQueryOptions(projectId)), context.queryClient.ensureQueryData(getAllTasksQueryOptions()), context.queryClient.ensureQueryData(getProjectSurfaceQueryOptions(projectId))]);
  },
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./consent-BnF9gWV7.js");
const Route$9 = createFileRoute("/oauth/consent")({
  validateSearch: (search) => ({
    client_id: typeof search.client_id === "string" ? search.client_id : void 0,
    redirect_uri: typeof search.redirect_uri === "string" ? search.redirect_uri : void 0,
    scope: typeof search.scope === "string" ? search.scope : void 0,
    state: typeof search.state === "string" ? search.state : void 0,
    code_challenge: typeof search.code_challenge === "string" ? search.code_challenge : void 0,
    code_challenge_method: typeof search.code_challenge_method === "string" ? search.code_challenge_method : void 0,
    resource: typeof search.resource === "string" ? search.resource : void 0
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./knowledge.search-4Fq56crD.js");
const Route$8 = createFileRoute("/knowledge/search")({
  validateSearch: (search) => ({
    q: search.q ?? "",
    mode: search.mode === "semantic" ? "semantic" : "tag"
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./knowledge.graph-B1hMfdlu.js");
const Route$7 = createFileRoute("/knowledge/graph")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./project._slug.timeline-C08DtxYP.js");
const Route$6 = createFileRoute("/project/$slug/timeline")({
  validateSearch: projectSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./project._slug.tasks-B1lwhiGc.js");
const Route$5 = createFileRoute("/project/$slug/tasks")({
  validateSearch: projectSearchParams,
  loader: async ({
    context
  }) => {
    await context.queryClient.ensureQueryData(getAllTasksQueryOptions());
  },
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./project._slug.settings-DTEj45c-.js");
const Route$4 = createFileRoute("/project/$slug/settings")({
  validateSearch: projectSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./project._slug.risks-vQnbxEVf.js");
const Route$3 = createFileRoute("/project/$slug/risks")({
  validateSearch: projectSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./project._slug.knowledge-dIzOIWka.js");
const Route$2 = createFileRoute("/project/$slug/knowledge")({
  validateSearch: projectSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./project._slug.dependencies-BUFEgSm4.js");
const Route$1 = createFileRoute("/project/$slug/dependencies")({
  validateSearch: projectSearchParams,
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./project._slug.automation-D0yQW-Pq.js");
const Route = createFileRoute("/project/$slug/automation")({
  validateSearch: projectSearchParams,
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const WorkRoute = Route$v.update({
  id: "/work",
  path: "/work",
  getParentRoute: () => Route$w
});
const TimelineRoute = Route$u.update({
  id: "/timeline",
  path: "/timeline",
  getParentRoute: () => Route$w
});
const SettingsRoute = Route$t.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => Route$w
});
const ProjectsRoute = Route$s.update({
  id: "/projects",
  path: "/projects",
  getParentRoute: () => Route$w
});
const PortfolioRoute = Route$r.update({
  id: "/portfolio",
  path: "/portfolio",
  getParentRoute: () => Route$w
});
const NoteRoute = Route$q.update({
  id: "/note",
  path: "/note",
  getParentRoute: () => Route$w
});
const LoginRoute = Route$p.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$w
});
const KnowledgeRoute = Route$o.update({
  id: "/knowledge",
  path: "/knowledge",
  getParentRoute: () => Route$w
});
const KanbanRoute = Route$n.update({
  id: "/kanban",
  path: "/kanban",
  getParentRoute: () => Route$w
});
const InboxRoute = Route$m.update({
  id: "/inbox",
  path: "/inbox",
  getParentRoute: () => Route$w
});
const HueyRoute = Route$l.update({
  id: "/huey",
  path: "/huey",
  getParentRoute: () => Route$w
});
const HealthRoute = Route$k.update({
  id: "/health",
  path: "/health",
  getParentRoute: () => Route$w
});
const GraphRoute = Route$j.update({
  id: "/graph",
  path: "/graph",
  getParentRoute: () => Route$w
});
const GoalsRoute = Route$i.update({
  id: "/goals",
  path: "/goals",
  getParentRoute: () => Route$w
});
const CodStatusRoute = Route$x.update({
  id: "/cod-status",
  path: "/cod-status",
  getParentRoute: () => Route$w
});
const BubbleRoute = Route$h.update({
  id: "/bubble",
  path: "/bubble",
  getParentRoute: () => Route$w
});
const AvatarRoute = Route$y.update({
  id: "/avatar",
  path: "/avatar",
  getParentRoute: () => Route$w
});
const AutomationRoute = Route$g.update({
  id: "/automation",
  path: "/automation",
  getParentRoute: () => Route$w
});
const ArchiveRoute = Route$f.update({
  id: "/archive",
  path: "/archive",
  getParentRoute: () => Route$w
});
const ActionsRoute = Route$e.update({
  id: "/actions",
  path: "/actions",
  getParentRoute: () => Route$w
});
const IndexRoute = Route$d.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$w
});
const SessionIdRoute = Route$c.update({
  id: "/session/$id",
  path: "/session/$id",
  getParentRoute: () => Route$w
});
const ProjectsProjectIdRoute = Route$b.update({
  id: "/$projectId",
  path: "/$projectId",
  getParentRoute: () => ProjectsRoute
});
const ProjectSlugRoute = Route$a.update({
  id: "/project/$slug",
  path: "/project/$slug",
  getParentRoute: () => Route$w
});
const OauthConsentRoute = Route$9.update({
  id: "/oauth/consent",
  path: "/oauth/consent",
  getParentRoute: () => Route$w
});
const KnowledgeSearchRoute = Route$8.update({
  id: "/search",
  path: "/search",
  getParentRoute: () => KnowledgeRoute
});
const KnowledgeGraphRoute = Route$7.update({
  id: "/graph",
  path: "/graph",
  getParentRoute: () => KnowledgeRoute
});
const ProjectSlugTimelineRoute = Route$6.update({
  id: "/timeline",
  path: "/timeline",
  getParentRoute: () => ProjectSlugRoute
});
const ProjectSlugTasksRoute = Route$5.update({
  id: "/tasks",
  path: "/tasks",
  getParentRoute: () => ProjectSlugRoute
});
const ProjectSlugSettingsRoute = Route$4.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => ProjectSlugRoute
});
const ProjectSlugRisksRoute = Route$3.update({
  id: "/risks",
  path: "/risks",
  getParentRoute: () => ProjectSlugRoute
});
const ProjectSlugKnowledgeRoute = Route$2.update({
  id: "/knowledge",
  path: "/knowledge",
  getParentRoute: () => ProjectSlugRoute
});
const ProjectSlugDependenciesRoute = Route$1.update({
  id: "/dependencies",
  path: "/dependencies",
  getParentRoute: () => ProjectSlugRoute
});
const ProjectSlugAutomationRoute = Route.update({
  id: "/automation",
  path: "/automation",
  getParentRoute: () => ProjectSlugRoute
});
const KnowledgeRouteChildren = {
  KnowledgeGraphRoute,
  KnowledgeSearchRoute
};
const KnowledgeRouteWithChildren = KnowledgeRoute._addFileChildren(
  KnowledgeRouteChildren
);
const ProjectsRouteChildren = {
  ProjectsProjectIdRoute
};
const ProjectsRouteWithChildren = ProjectsRoute._addFileChildren(
  ProjectsRouteChildren
);
const ProjectSlugRouteChildren = {
  ProjectSlugAutomationRoute,
  ProjectSlugDependenciesRoute,
  ProjectSlugKnowledgeRoute,
  ProjectSlugRisksRoute,
  ProjectSlugSettingsRoute,
  ProjectSlugTasksRoute,
  ProjectSlugTimelineRoute
};
const ProjectSlugRouteWithChildren = ProjectSlugRoute._addFileChildren(
  ProjectSlugRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  ActionsRoute,
  ArchiveRoute,
  AutomationRoute,
  AvatarRoute,
  BubbleRoute,
  CodStatusRoute,
  GoalsRoute,
  GraphRoute,
  HealthRoute,
  HueyRoute,
  InboxRoute,
  KanbanRoute,
  KnowledgeRoute: KnowledgeRouteWithChildren,
  LoginRoute,
  NoteRoute,
  PortfolioRoute,
  ProjectsRoute: ProjectsRouteWithChildren,
  SettingsRoute,
  TimelineRoute,
  WorkRoute,
  OauthConsentRoute,
  ProjectSlugRoute: ProjectSlugRouteWithChildren,
  SessionIdRoute
};
const routeTree = Route$w._addFileChildren(rootRouteChildren)._addFileTypes();
function createRouter(options) {
  const queryClient = options?.queryClient ?? (typeof window === "undefined" ? createQueryClient() : getBrowserQueryClient());
  return createRouter$1({
    routeTree,
    context: {
      queryClient
    }
  });
}
let _router;
function getRouter() {
  if (typeof window === "undefined") {
    return createRouter();
  }
  if (!_router) {
    _router = createRouter();
  }
  return _router;
}
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createRouter,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  getProjectTabPath as $,
  isStale as A,
  formatTimeBudget as B,
  CodModal as C,
  isMetricReal as D,
  ReadinessCard as E,
  apiBadgeText as F,
  deriveCapacityGuidance as G,
  Route$e as H,
  IconButton as I,
  useActionsSurface as J,
  Route$d as K,
  useHomeSurface as L,
  useWhatNowQuery as M,
  useUpNextQuery as N,
  formatScore as O,
  PrimaryButton as P,
  normalizeNextAction as Q,
  Route$q as R,
  SecondaryButton as S,
  normalizeSessionSummary as T,
  elapsedMinutes as U,
  VitalsPanel as V,
  formatSessionDuration as W,
  Route$c as X,
  formatDuration as Y,
  projectSearchParams as Z,
  PROJECT_ROUTE_TABS as _,
  SoftPanel as a,
  ProjectRouteShellProvider as a0,
  getProjectQueryOptions as a1,
  useAllTasks as a2,
  useProjectSurface as a3,
  toProjectSummaryDisplay as a4,
  Route$a as a5,
  Route$9 as a6,
  Route$8 as a7,
  Route$5 as a8,
  useProjectRouteShellContext as a9,
  Route$2 as aa,
  router as ab,
  apiFetch as b,
  Route$p as c,
  Route$o as d,
  buildColumns as e,
  fetchProjects as f,
  filterBacklog as g,
  STATUS_COLUMNS as h,
  getApiBase as i,
  computeInboxCounts as j,
  useInboxSurface as k,
  Route$m as l,
  defaultInboxView as m,
  normalizeTask as n,
  toInboxItemDisplay as o,
  useInboxConverterMutation as p,
  SectionHeader as q,
  useStepExtractorQuery as r,
  splitInboxNotes as s,
  toNoteHeaderDisplay as t,
  useHydrated as u,
  dispatchNavOverlay as v,
  fetchAllTasks as w,
  useSystemSummarizerQuery as x,
  useAvatar as y,
  deriveReadiness as z
};
