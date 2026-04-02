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
function ArchiveRoute() {
  return /* @__PURE__ */ jsx(WorkspaceScaffold, { title: "Archive", subtitle: "Historical decisions, rejected artifacts, and completed operational context.", summaryItems: [{
    label: "Rejected",
    value: "Split",
    detail: "User and automated histories stay separate"
  }, {
    label: "Deferred",
    value: "Kept",
    detail: "Archived without losing context"
  }, {
    label: "Audit",
    value: "Ready",
    detail: "Timeline and archive link cleanly"
  }, {
    label: "Search",
    value: "URL-backed",
    detail: "Source and selection params reserved"
  }], primaryTitle: "Archive Workspace", primarySubtitle: "Historical queues and archived interventions.", primary: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Archive is now a first-class route instead of being trapped inside other views." }), asideTitle: "Archive Detail", asideSubtitle: "Why it was archived and what can be reopened.", aside: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Selection-driven archive detail renders here." }) });
}
export {
  ArchiveRoute as component
};
