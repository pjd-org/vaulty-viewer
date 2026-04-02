import { jsx, jsxs } from "react/jsx-runtime";
import "./router-Dve3S_a4.js";
import "react";
import { W as WorkspaceScaffold } from "./WorkspaceScaffold-ClVsxrpP.js";
import "@tanstack/react-router";
import "@tanstack/react-query";
import "zustand";
import "clsx";
import "./SummaryRow-3HynMwwn.js";
import "./PageFrame-Cq4YOB6Y.js";
function AutomationRoute() {
  return /* @__PURE__ */ jsx(WorkspaceScaffold, { title: "Automation", subtitle: "Pipelines, Huey, schedules, and runners in one machine-control lane.", summaryItems: [{
    label: "Pipelines",
    value: "4",
    detail: "Simulated, pending, failed, applied"
  }, {
    label: "Huey",
    value: "Healthy",
    detail: "Queue health and worker posture"
  }, {
    label: "Stuck runs",
    value: "1",
    detail: "Needs inspection"
  }, {
    label: "Schedules",
    value: "9",
    detail: "Today and upcoming"
  }], primaryTitle: "Operational Workspace", primarySubtitle: "Phase 1 shell for tabs, filters, and scoped details.", primary: /* @__PURE__ */ jsxs("ul", { className: "space-y-3 text-sm text-slate-300", children: [
    /* @__PURE__ */ jsx("li", { children: "Pipelines, runners, Huey, and schedules now have a canonical home." }),
    /* @__PURE__ */ jsx("li", { children: "Search params are reserved for tab, subtab, selection, and auto-refresh state." }),
    /* @__PURE__ */ jsx("li", { children: "Phase 3 will connect these panes to runtime-backed tables and inspection flows." })
  ] }), asideTitle: "Detail Panel", asideSubtitle: "Retry, inspect, and verification hooks live here.", aside: /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm text-slate-300", children: [
    /* @__PURE__ */ jsx("p", { children: "The shell is ready for runner details, retry actions, and queue health overlays." }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Huey remains reachable directly at ",
      /* @__PURE__ */ jsx("code", { children: "/huey" }),
      " during the transition."
    ] })
  ] }) });
}
export {
  AutomationRoute as component
};
