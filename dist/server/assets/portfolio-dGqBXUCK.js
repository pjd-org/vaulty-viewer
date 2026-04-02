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
function PortfolioRoute() {
  return /* @__PURE__ */ jsx(WorkspaceScaffold, { title: "Portfolio", subtitle: "Capital-control lane for allocation, drift, and rebalance actions.", summaryItems: [{
    label: "Value",
    value: "Tracked",
    detail: "Portfolio summary scaffolded"
  }, {
    label: "Drift",
    value: "Visible",
    detail: "Route ready for adapter payloads"
  }, {
    label: "Risk",
    value: "Pending",
    detail: "Detail panel reserved"
  }, {
    label: "Action",
    value: "Rebalance",
    detail: "Primary CTA slot established"
  }], primaryTitle: "Portfolio Workspace", primarySubtitle: "Allocation, performance, drift, positions, and risks.", primary: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "The portfolio lane is now a first-class route in the shell. Phase 3 will bind charts, risk explanations, and rebalance workflows to this surface." }), asideTitle: "Action Surface", asideSubtitle: "Rebalance, create review, or inspect holdings.", aside: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Selection-driven details will render here." }) });
}
export {
  PortfolioRoute as component
};
