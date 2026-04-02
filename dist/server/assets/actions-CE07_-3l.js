import { jsxs, jsx } from "react/jsx-runtime";
import React__default from "react";
import { useNavigate } from "@tanstack/react-router";
import { H as Route, J as useActionsSurface } from "./router-Dve3S_a4.js";
import { W as WorkspaceScaffold } from "./WorkspaceScaffold-ClVsxrpP.js";
import { E as EmptyState } from "./EmptyState-DhW0XD8j.js";
import "@tanstack/react-query";
import "zustand";
import "clsx";
import "./SummaryRow-3HynMwwn.js";
import "./PageFrame-Cq4YOB6Y.js";
const REVERB_RANK = {
  low: 0,
  medium: 1,
  high: 2
};
function ActionsRoute() {
  const {
    sort,
    simulatableOnly,
    selectedId
  } = Route.useSearch();
  const {
    data: surface,
    isLoading,
    error
  } = useActionsSurface();
  const navigate = useNavigate();
  const currentSort = sort ?? "urgency";
  const allRecommendations = surface?.recommendations ?? [];
  const recommendations = React__default.useMemo(() => {
    const base = allRecommendations;
    const filtered = simulatableOnly ? base.filter((item) => item.reversibility === "high") : base;
    const sorted = [...filtered];
    switch (currentSort) {
      case "impact":
        sorted.sort((a, b) => b.scoreBreakdown.impact - a.scoreBreakdown.impact);
        break;
      case "confidence":
        sorted.sort((a, b) => b.confidence - a.confidence);
        break;
      case "reversibility":
        sorted.sort((a, b) => REVERB_RANK[b.reversibility] - REVERB_RANK[a.reversibility] || b.score - a.score);
        break;
      case "source":
        sorted.sort((a, b) => b.sourceSignalIds.length - a.sourceSignalIds.length || b.sourceEntities.length - a.sourceEntities.length || b.score - a.score);
        break;
      default:
        sorted.sort((a, b) => b.score - a.score);
        break;
    }
    return sorted;
  }, [allRecommendations, simulatableOnly, currentSort]);
  const selected = recommendations.find((item) => item.id === selectedId) ?? recommendations[0];
  const verificationCount = surface?.verificationRail.length ?? 0;
  const setSearch = React__default.useCallback((next) => {
    navigate({
      to: "/actions",
      search: {
        sort: next.sort,
        simulatableOnly: next.simulatableOnly,
        selectedId
      },
      replace: true
    });
  }, [navigate, selectedId]);
  const toolbar = /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "actions-sort", children: "Sort mode" }),
      /* @__PURE__ */ jsxs("select", { id: "actions-sort", value: currentSort, onChange: (event) => setSearch({
        sort: event.target.value,
        simulatableOnly
      }), className: "rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-300/50", children: [
        /* @__PURE__ */ jsx("option", { value: "urgency", children: "Urgency" }),
        /* @__PURE__ */ jsx("option", { value: "impact", children: "Impact" }),
        /* @__PURE__ */ jsx("option", { value: "confidence", children: "Confidence" }),
        /* @__PURE__ */ jsx("option", { value: "source", children: "Source" }),
        /* @__PURE__ */ jsx("option", { value: "reversibility", children: "Reversibility" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100", children: [
      /* @__PURE__ */ jsx("input", { id: "actions-simulatable-only", type: "checkbox", checked: Boolean(simulatableOnly), onChange: (event) => setSearch({
        sort: currentSort,
        simulatableOnly: event.target.checked ? true : void 0
      }), className: "h-4 w-4 rounded border-white/20 bg-transparent text-sky-400" }),
      /* @__PURE__ */ jsx("span", { children: "Simulatable only" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-full border border-white/10 bg-white/10 px-4 py-2 text-right text-xs text-slate-300", children: [
      /* @__PURE__ */ jsxs("p", { children: [
        "Showing ",
        recommendations.length,
        " of ",
        allRecommendations.length,
        " recommendations"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 font-medium text-slate-100", children: [
        "Selected: ",
        selected?.title ?? "None"
      ] })
    ] })
  ] });
  const summaryItems = [{
    label: "Recommended",
    value: String(recommendations.length),
    detail: "Live adapter-ranked actions"
  }, {
    label: "High impact",
    value: String(recommendations.filter((item) => item.scoreBreakdown.impact >= 7).length),
    detail: "Strong leverage right now"
  }, {
    label: "Low friction",
    value: String(recommendations.filter((item) => item.reversibility === "high").length),
    detail: "Safe quick-command candidates"
  }, {
    label: "Verification",
    value: surface?.verificationRail.length ? "Active" : "Ready",
    detail: "Feedback loop reserved for mutation outcomes"
  }];
  return /* @__PURE__ */ jsx(WorkspaceScaffold, { title: "Actions", subtitle: "Execution console for COD-ranked interventions.", actions: toolbar, summaryItems, primaryTitle: "Recommended Actions", primarySubtitle: "Ranked by urgency, impact, confidence, and reversibility.", primary: isLoading && !surface ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Array.from({
    length: 4
  }).map((_, index) => /* @__PURE__ */ jsx("div", { className: "h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" }, index)) }) : error && !surface ? /* @__PURE__ */ jsx(EmptyState, { title: "Action recommendations are temporarily unavailable.", description: "The shell is intact. Retry once the task service responds again." }) : recommendations.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "No actions are surfaced right now.", description: "Once the queue refreshes, this lane will rank the best next moves." }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: recommendations.map((item) => {
    const active = item.id === selected?.id;
    return /* @__PURE__ */ jsxs("article", { className: ["rounded-[22px] border p-4 transition", active ? "border-sky-300/40 bg-white/10 shadow-[0_18px_45px_rgba(56,189,248,0.14)]" : "border-white/8 bg-white/5"].join(" "), children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-slate-100", children: item.title }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: item.summary })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "rounded-full bg-sky-400/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-100", children: item.actionType.replace("_", " ") })
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
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Score" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-slate-200", children: [
            item.score.toFixed(1),
            " / 10"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
            "Confidence ",
            (item.confidence * 100).toFixed(0),
            "% ·",
            " ",
            item.reversibility,
            " reversibility"
          ] })
        ] })
      ] })
    ] }, item.id);
  }) }), asideTitle: "Detail Panel", asideSubtitle: "Selection-driven explanation and controls.", aside: selected ? /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-sm text-slate-300", children: [
    /* @__PURE__ */ jsxs("div", { className: "rounded-[22px] border border-white/8 bg-white/5 p-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Selected action" }),
      /* @__PURE__ */ jsx("h3", { className: "mt-3 text-lg font-semibold text-slate-100", children: selected.title }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-300", children: selected.summary })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Score breakdown" }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 space-y-2", children: Object.entries(selected.scoreBreakdown).map(([key, value]) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-400 capitalize", children: key.replace(/([A-Z])/g, " $1") }),
          /* @__PURE__ */ jsx("span", { className: "text-slate-200", children: value })
        ] }, key)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Mutation path" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-slate-200", children: selected.mutationRef ? `${selected.mutationRef.domain} / ${selected.mutationRef.operation}` : "Simulation only" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-slate-400", children: [
          "Source entities: ",
          selected.sourceEntities.length
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Source signals" }),
        selected.sourceSignalIds.length > 0 ? /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: selected.sourceSignalIds.map((signalId) => /* @__PURE__ */ jsx("span", { className: "rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-100", children: signalId }, signalId)) }) : /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-slate-400", children: "No source signals surfaced." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Verification preview" }),
        verificationCount > 0 ? /* @__PURE__ */ jsx("div", { className: "mt-3 space-y-2", children: surface?.verificationRail.map((item) => /* @__PURE__ */ jsx("article", { className: "rounded-[14px] border border-white/10 bg-white/5 p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-100", children: item.summary }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-400", children: item.actionId })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100", children: item.status })
        ] }) }, item.id)) }) : /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-slate-400", children: "Ready for post-action verification." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Action controls" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx("button", { type: "button", disabled: !selected.mutationRef, className: "rounded-full border border-sky-300/30 bg-sky-400/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100 transition disabled:cursor-not-allowed disabled:opacity-50", children: "Execute" }),
          /* @__PURE__ */ jsx("button", { type: "button", disabled: selected.reversibility !== "high", className: "rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition disabled:cursor-not-allowed disabled:opacity-50", children: "Simulate" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition", children: "Defer" })
        ] })
      ] })
    ] })
  ] }) : /* @__PURE__ */ jsx(EmptyState, { title: "Select an action to inspect.", description: "The right rail will expose explanation, confidence, and mutation details." }) });
}
export {
  ActionsRoute as component
};
