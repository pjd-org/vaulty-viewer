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
function SettingsRoute() {
  return /* @__PURE__ */ jsx(WorkspaceScaffold, { title: "Settings", subtitle: "Scoring, alerts, commands, sources, and viewer preferences.", summaryItems: [{
    label: "Scoring",
    value: "Scoped",
    detail: "Viewer-level settings route"
  }, {
    label: "Alerts",
    value: "Reserved",
    detail: "Future control pane"
  }, {
    label: "Commands",
    value: "Ready",
    detail: "Global shell slot established"
  }, {
    label: "Preferences",
    value: "Live",
    detail: "Density and shell choices can land here"
  }], primaryTitle: "Settings Workspace", primarySubtitle: "Preference groups and control forms.", primary: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Settings now has a canonical route and search contract." }), asideTitle: "Preview Panel", asideSubtitle: "How changes affect the shell.", aside: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Selected settings previews will render here." }) });
}
export {
  SettingsRoute as component
};
