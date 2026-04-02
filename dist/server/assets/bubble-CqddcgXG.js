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
function BubbleRoute() {
  return /* @__PURE__ */ jsx(WorkspaceScaffold, { title: "Bubble", subtitle: "Behavioral control lane for pressure, drift, momentum, and rewards.", summaryItems: [{
    label: "Momentum",
    value: "Monitored",
    detail: "Trend surface ready"
  }, {
    label: "Pressure",
    value: "Visible",
    detail: "COD signals belong here"
  }, {
    label: "Rewards",
    value: "Scoped",
    detail: "Action surface reserved"
  }, {
    label: "Energy",
    value: "Tracked",
    detail: "Phase 3 chart hooks"
  }], primaryTitle: "Bubble Workspace", primarySubtitle: "Interpretation on the left, intervention on the right.", primary: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Bubble is now part of the canonical command loop shell instead of living as implied context." }), asideTitle: "Intervention Panel", asideSubtitle: "Adjust state or create follow-up.", aside: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Selection-driven bubble actions will render here." }) });
}
export {
  BubbleRoute as component
};
