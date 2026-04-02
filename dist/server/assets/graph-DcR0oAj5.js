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
function GraphRoute() {
  return /* @__PURE__ */ jsx(WorkspaceScaffold, { title: "Graph", subtitle: "Deep-context lane for knowledge, dependency, incident, and memory graphs.", summaryItems: [{
    label: "Global graph",
    value: "Ready",
    detail: "Route canon established"
  }, {
    label: "Dependency",
    value: "Scoped",
    detail: "Project and global views"
  }, {
    label: "Memory",
    value: "Planned",
    detail: "Agent and note links"
  }, {
    label: "Paths",
    value: "Searchable",
    detail: "Node and path params reserved"
  }], primaryTitle: "Graph Workspace", primarySubtitle: "Graph canvas and filters.", primary: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Graph now has a canonical shell route and URL contract." }), asideTitle: "Entity Inspector", asideSubtitle: "Selected node, path, and linked actions.", aside: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Entity detail will render here in later phases." }) });
}
export {
  GraphRoute as component
};
