import { jsx } from "react/jsx-runtime";
import "./router-Dve3S_a4.js";
import "react";
import { W as WorkspaceScaffold } from "./WorkspaceScaffold-ClVsxrpP.js";
import "@tanstack/react-router";
import "@tanstack/react-query";
import "zustand";
import "clsx";
import "./SummaryRow-3HynMwwn.js";
import "./PageFrame-Cq4YOB6Y.js";
function TimelineRoute() {
  return /* @__PURE__ */ jsx(WorkspaceScaffold, { title: "Timeline", subtitle: "Replay and audit surface for interventions, incidents, rejections, and runs.", summaryItems: [{
    label: "Mode",
    value: "Audit",
    detail: "Live and replay params reserved"
  }, {
    label: "Interventions",
    value: "Tracked",
    detail: "Verification-aware stream"
  }, {
    label: "Rejections",
    value: "Split",
    detail: "User vs automated stays distinct"
  }, {
    label: "Runs",
    value: "Linked",
    detail: "Huey, pipelines, schedules, agents"
  }], primaryTitle: "Event Stream", primarySubtitle: "Timeline list and filter controls.", primary: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Timeline now has a stable path and query surface for live/audit modes." }), asideTitle: "Event Detail", asideSubtitle: "Before/after state, actors, context, and replay.", aside: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Detailed event inspection lands here." }) });
}
export {
  TimelineRoute as component
};
