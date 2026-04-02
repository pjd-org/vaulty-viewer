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
function HealthRoute() {
  return /* @__PURE__ */ jsx(WorkspaceScaffold, { title: "Health", subtitle: "Platform-integrity lane for freshness, incidents, sync, and degraded services.", summaryItems: [{
    label: "Freshness",
    value: "Tracked",
    detail: "Data age and gaps"
  }, {
    label: "Integrity",
    value: "Scoped",
    detail: "Validation and sync posture"
  }, {
    label: "Incidents",
    value: "Live",
    detail: "Incident feed shell ready"
  }, {
    label: "Degraded",
    value: "0",
    detail: "Reserved for runtime status"
  }], primaryTitle: "Health Workspace", primarySubtitle: "Service and incident list.", primary: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Health is now a stable destination in the shell. Phase 3 will connect incident feeds and service status tables." }), asideTitle: "Investigation Panel", asideSubtitle: "Root cause, related entities, and timeline links.", aside: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Selection-driven investigations will render here." }) });
}
export {
  HealthRoute as component
};
