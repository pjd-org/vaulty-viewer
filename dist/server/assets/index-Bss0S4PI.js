import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useCallback, useEffect } from "react";
import { K as Route, L as useHomeSurface, M as useWhatNowQuery, N as useUpNextQuery, q as SectionHeader, O as formatScore, b as apiFetch, Q as normalizeNextAction, T as normalizeSessionSummary, U as elapsedMinutes, P as PrimaryButton, S as SecondaryButton, W as formatSessionDuration } from "./router-Dve3S_a4.js";
import { useNavigate, Link } from "@tanstack/react-router";
import { W as WorkspaceScaffold } from "./WorkspaceScaffold-ClVsxrpP.js";
import { E as EmptyState } from "./EmptyState-DhW0XD8j.js";
import "@tanstack/react-query";
import "zustand";
import "clsx";
import "./SummaryRow-3HynMwwn.js";
import "./PageFrame-Cq4YOB6Y.js";
function useFocusData() {
  const [nextActions, setNextActions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [actionsRes, sessionsRes, recentRes] = await Promise.all([apiFetch("/api/v1/tasks/next-actions?max=10"), apiFetch("/api/v1/sessions?status=active&limit=1"), apiFetch("/api/v1/sessions?limit=3")]);
      if (actionsRes.ok) {
        const body = await actionsRes.json();
        const raw = body.structuredContent?.tasks ?? body.tasks ?? [];
        setNextActions(raw.map(normalizeNextAction));
        setApiOnline(true);
      } else {
        setApiOnline(false);
      }
      if (sessionsRes.ok) {
        const body = await sessionsRes.json();
        const sessions = body.structuredContent?.sessions ?? body.sessions ?? [];
        setActiveSession(sessions.find((s) => s.status === "active") ?? null);
      }
      if (recentRes.ok) {
        const body = await recentRes.json();
        const raw = body.structuredContent?.sessions ?? body.sessions ?? [];
        setRecentSessions(raw.map(normalizeSessionSummary));
      }
    } catch {
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return {
    nextActions,
    activeSession,
    recentSessions,
    loading,
    apiOnline,
    reload
  };
}
function RecentSessionsPanel({
  sessions
}) {
  if (!sessions.length) return null;
  return /* @__PURE__ */ jsxs("div", { className: "genie-surface genie-surface--utility rounded-[28px] p-4 space-y-2", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3", children: "Recent sessions" }),
    sessions.map((s) => /* @__PURE__ */ jsxs(Link, { to: "/session/$id", params: {
      id: s.id
    }, className: "flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/10 transition-colors", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-800 truncate", children: s.title ?? `Session ${s.id.slice(0, 6)}` }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0 ml-3", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500", children: formatSessionDuration(s.startedAt, s.endedAt) }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-600 capitalize", children: s.status })
      ] })
    ] }, s.id))
  ] });
}
function ActiveSessionBanner({
  session,
  onResume,
  onEnd
}) {
  const elapsed = session.startedAt ? elapsedMinutes(session.startedAt) : null;
  const tasksDone = session.tasks?.filter((t) => t.status === "done").length ?? 0;
  const tasksTotal = session.tasks?.length ?? 0;
  return /* @__PURE__ */ jsxs("div", { className: "genie-surface genie-surface--utility rounded-[28px] p-4 flex items-center justify-between", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-sky-300 uppercase tracking-wide", children: "Session active" }),
      session.title && /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-slate-800", children: session.title }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-600", children: [
        elapsed !== null && /* @__PURE__ */ jsxs(Fragment, { children: [
          elapsed,
          "m elapsed",
          tasksTotal > 0 ? " · " : ""
        ] }),
        tasksTotal > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
          tasksDone,
          "/",
          tasksTotal,
          " tasks"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(PrimaryButton, { onClick: onResume, children: "Resume" }),
      /* @__PURE__ */ jsx(SecondaryButton, { onClick: onEnd, children: "End" })
    ] })
  ] });
}
function FocusRoute() {
  const navigate = useNavigate();
  const {
    q,
    collection,
    session,
    snapshot,
    detailId
  } = Route.useSearch();
  const {
    nextActions,
    activeSession,
    recentSessions,
    loading,
    reload
  } = useFocusData();
  const {
    data: surface,
    isLoading: surfaceLoading,
    error: surfaceError
  } = useHomeSurface();
  const [endingSession, setEndingSession] = useState(false);
  const agentTasks = useMemo(() => nextActions.slice(0, 20).map((t) => ({
    id: t.id,
    title: t.title,
    estimatedMinutes: t.estimatedTimeMin,
    focusCost: t.focusCost,
    priority: t.priority,
    project: t.projectId,
    status: t.status
  })), [nextActions]);
  const {
    data: whatNow,
    isError: whatNowFailed
  } = useWhatNowQuery(agentTasks, {
    enabled: !loading && agentTasks.length > 0
  });
  const {
    data: upNext,
    isError: upNextFailed
  } = useUpNextQuery(agentTasks, {
    enabled: !loading && agentTasks.length > 0
  });
  const endSession = async () => {
    if (!activeSession) return;
    setEndingSession(true);
    try {
      await apiFetch("/cod/session/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId: activeSession.id,
          status: "completed"
        })
      });
      reload();
    } finally {
      setEndingSession(false);
    }
  };
  const pressureBand = surface?.pressureBand ?? [];
  const decisionQueue = surface?.decisionQueue ?? [];
  const immediateActions = surface?.immediateActions ?? [];
  const verificationRail = surface?.verificationRail ?? [];
  const snapshots = surface?.snapshots ?? {
    automation: [],
    knowledge: [],
    portfolio: [],
    bubble: [],
    health: []
  };
  const contextTail = surface?.contextTail ?? [];
  const searchEcho = [q, collection, session, snapshot, detailId].filter((value) => Boolean(value));
  const summaryItems = [{
    label: "Pressure",
    value: surfaceLoading && !surface ? "Loading" : String(pressureBand.length),
    detail: "Highest-pressure signals"
  }, {
    label: "Queue",
    value: surfaceLoading && !surface ? "Loading" : String(decisionQueue.length),
    detail: "COD-ranked next moves"
  }, {
    label: "Immediate",
    value: surfaceLoading && !surface ? "Loading" : String(immediateActions.length),
    detail: "Low-friction interventions"
  }, {
    label: "Verification",
    value: surfaceLoading && !surface ? "Loading" : verificationRail.length ? "Active" : "Ready",
    detail: "Feedback loop"
  }];
  const renderSignalActions = (sourceId) => /* @__PURE__ */ jsx(Link, { to: "/work", search: {
    selectedId: sourceId
  }, className: "text-xs font-semibold text-sky-100 underline decoration-sky-300/40 underline-offset-4", children: "Open work" });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    activeSession && !endingSession ? /* @__PURE__ */ jsx(ActiveSessionBanner, { session: activeSession, onResume: () => navigate({
      to: "/session/$id",
      params: {
        id: activeSession.id
      }
    }), onEnd: endSession }) : null,
    /* @__PURE__ */ jsx(WorkspaceScaffold, { title: "Home", subtitle: searchEcho.length ? `Global mission control · ${searchEcho.join(" · ")}` : "Global mission control", summaryItems, primaryTitle: "Pressure Band", primarySubtitle: "Highest-pressure signals across the system.", primary: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      surfaceError && !surface ? /* @__PURE__ */ jsx(EmptyState, { title: "Home surface unavailable.", description: "The adapter query failed to load." }) : null,
      /* @__PURE__ */ jsx("section", { className: "space-y-3", children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: pressureBand.length > 0 ? pressureBand.map((item) => /* @__PURE__ */ jsxs("article", { className: "rounded-[22px] border border-white/8 bg-white/5 p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-slate-100", children: item.title }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: item.summary })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "rounded-full bg-sky-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-100", children: item.severity })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400", children: [
          /* @__PURE__ */ jsx("span", { children: item.sourceType }),
          /* @__PURE__ */ jsx("span", { children: "·" }),
          /* @__PURE__ */ jsx("span", { children: item.sourceId }),
          item.projectId ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { children: "·" }),
            /* @__PURE__ */ jsx("span", { children: item.projectId })
          ] }) : null
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-slate-300", children: item.whySurfaced }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [
          renderSignalActions(item.sourceId),
          item.allowedActions.map((action) => /* @__PURE__ */ jsx("span", { className: "rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300", children: action.label }, `${item.id}-${action.actionType}`))
        ] })
      ] }, item.id)) : /* @__PURE__ */ jsx(EmptyState, { title: "No pressure is surfaced right now.", description: "Once the adapter has signals, the pressure band will populate here." }) }) }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(SectionHeader, { title: "Decision Queue", subtitle: "Top ranked recommendations." }),
        decisionQueue.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: decisionQueue.map((item) => /* @__PURE__ */ jsxs("article", { className: "rounded-[22px] border border-white/8 bg-white/5 p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-slate-100", children: item.title }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: item.summary })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-sky-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-100", children: formatScore(item.score) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 grid gap-3 md:grid-cols-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Why now" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: item.whyNow })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Expected effect" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: item.expectedEffect })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Confidence" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-slate-200", children: [
                (item.confidence * 100).toFixed(0),
                "%"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                item.reversibility,
                " reversibility"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsx(Link, { to: "/actions", search: {
              selectedId: item.id,
              sort: void 0,
              simulatableOnly: void 0
            }, className: "text-xs font-semibold text-sky-100 underline decoration-sky-300/40 underline-offset-4", children: "Inspect in Actions" }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300", children: "Execute" }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300", children: "Simulate" }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300", children: "Defer" })
          ] })
        ] }, item.id)) }) : /* @__PURE__ */ jsx(EmptyState, { title: "No decisions are surfaced right now.", description: "Once the queue refreshes, the best next moves will appear here." })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(SectionHeader, { title: "Immediate Interventions", subtitle: "Low-friction actions only." }),
        immediateActions.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: immediateActions.map((item) => /* @__PURE__ */ jsxs("article", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: item.title }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: item.summary })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-sky-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-100", children: item.reversibility })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-slate-400", children: item.expectedEffect })
        ] }, item.id)) }) : /* @__PURE__ */ jsx(EmptyState, { title: "No immediate interventions are surfaced.", description: "The adapter will surface low-friction actions once they are available." })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(SectionHeader, { title: "Legacy coaching", subtitle: "Agent guidance stays parallel for now." }),
        whatNow || upNext ? /* @__PURE__ */ jsxs("div", { className: "genie-surface genie-surface--utility rounded-[22px] px-4 py-3 text-sm space-y-2", children: [
          whatNow ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-slate-700", children: whatNow.rationale }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: whatNow.why_now })
          ] }) : null,
          upNext ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-slate-500", children: upNext.flow_label ?? "Up next" }),
            upNext.steps.slice(0, 3).map((step) => /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-700", children: step.title }, step.id))
          ] }) : null
        ] }) : /* @__PURE__ */ jsx(EmptyState, { title: "Legacy coaching is quiet.", description: "The route still keeps the parallel agent lane available when tasks exist." }),
        (whatNowFailed || upNextFailed) && /* @__PURE__ */ jsxs("div", { className: "genie-surface genie-surface--utility rounded-[22px] px-4 py-3 text-sm space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-slate-700", children: "AI guidance is temporarily unavailable." }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "The adapter-backed surface still remains current." })
        ] })
      ] })
    ] }), asideTitle: "Verification Rail", asideSubtitle: "Feedback, snapshots, and context.", aside: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("section", { className: "space-y-3", children: verificationRail.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: verificationRail.map((item) => /* @__PURE__ */ jsxs("article", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: item.summary }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-400", children: item.actionId })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "rounded-full bg-sky-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-100", children: item.status })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400", children: [
          item.improved ? /* @__PURE__ */ jsx("span", { children: "Improved" }) : null,
          item.followUpNeeded ? /* @__PURE__ */ jsx("span", { children: "Follow-up needed" }) : null,
          item.resolvedAt ? /* @__PURE__ */ jsx("span", { children: item.resolvedAt }) : null
        ] })
      ] }, item.id)) }) : /* @__PURE__ */ jsx(EmptyState, { title: "Verification rail is ready.", description: "Results will appear here after actions are executed." }) }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(SectionHeader, { title: "Snapshot Grid", subtitle: "Domain-level pressure snapshots." }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3", children: [{
          label: "Automation",
          items: snapshots.automation
        }, {
          label: "Knowledge",
          items: snapshots.knowledge
        }, {
          label: "Portfolio",
          items: snapshots.portfolio
        }, {
          label: "Bubble",
          items: snapshots.bubble
        }, {
          label: "Health",
          items: snapshots.health
        }].map((snapshotGroup) => /* @__PURE__ */ jsxs("div", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: snapshotGroup.label }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-2xl font-semibold tracking-tight text-slate-100", children: snapshotGroup.items.length })
        ] }, snapshotGroup.label)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(SectionHeader, { title: "Context Tail", subtitle: "COD-selected context, not just recent notes." }),
        contextTail.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: contextTail.map((item) => /* @__PURE__ */ jsxs("article", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: item.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: item.summary }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-slate-400", children: item.reasonSelected })
        ] }, item.id)) }) : /* @__PURE__ */ jsx(EmptyState, { title: "No context tail is selected.", description: "COD-selected context will appear here when available." })
      ] }),
      recentSessions.length > 0 ? /* @__PURE__ */ jsx(RecentSessionsPanel, { sessions: recentSessions }) : null
    ] }) })
  ] });
}
export {
  FocusRoute as component
};
