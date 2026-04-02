import { jsx, jsxs } from "react/jsx-runtime";
import React__default from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { w as fetchAllTasks, f as fetchProjects, x as useSystemSummarizerQuery, C as CodModal } from "./router-Dve3S_a4.js";
import "zustand";
import "clsx";
function CODStatusRoute({
  onRequestClose
} = {}) {
  const navigate = useNavigate();
  const {
    data: tasks
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchAllTasks,
    staleTime: 1e3 * 60
  });
  const {
    data: projects
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 1e3 * 60
  });
  const closeOverlay = React__default.useCallback(() => {
    if (onRequestClose) {
      onRequestClose();
      return;
    }
    void navigate({
      to: "/",
      search: {}
    });
  }, [navigate, onRequestClose]);
  React__default.useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeOverlay();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeOverlay]);
  const agentTasks = (tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status ?? void 0,
    priority: void 0,
    estimatedMin: t.estimatedTimeMin ?? void 0,
    project: void 0
  }));
  const agentProjects = (projects ?? []).map((p) => ({
    id: p.id ?? p.title,
    title: p.title
  }));
  const {
    data: summaryData
  } = useSystemSummarizerQuery(agentTasks, agentProjects, {
    enabled: agentTasks.length > 0
  });
  return /* @__PURE__ */ jsx("div", { className: "route-modal-overlay", onClick: closeOverlay, children: /* @__PURE__ */ jsxs("section", { className: "route-modal-card route-modal-card--cod genie-surface genie-surface--overlay", onClick: (event) => event.stopPropagation(), onKeyDown: (event) => event.stopPropagation(), role: "dialog", "aria-modal": "true", "aria-label": "COD", children: [
    /* @__PURE__ */ jsx("button", { type: "button", className: "route-modal-close", onClick: closeOverlay, "aria-label": "Close COD", children: "✕" }),
    /* @__PURE__ */ jsxs("div", { className: "route-modal-scroll route-modal-body space-y-4", children: [
      /* @__PURE__ */ jsx("header", { className: "rounded-[28px] p-6 genie-surface genie-surface--hero genie-layer-hero", children: /* @__PURE__ */ jsxs("div", { className: "genie-content", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-semibold tracking-tight text-slate-800", children: "Readiness" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-600", children: "Can you work now, and under what constraints?" })
      ] }) }),
      summaryData?.summary && summaryData.summary.length > 0 && /* @__PURE__ */ jsx("div", { className: "genie-surface genie-surface--hero rounded-xl px-4 py-3 space-y-1.5", children: /* @__PURE__ */ jsxs("div", { className: "genie-content", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-slate-300 uppercase tracking-wider", children: "System State" }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: summaryData.summary.map((bullet, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-slate-200", children: [
          /* @__PURE__ */ jsx("span", { className: "mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" }),
          bullet
        ] }, i)) })
      ] }) }),
      /* @__PURE__ */ jsx(CodModal, {})
    ] })
  ] }) });
}
const SplitComponent = () => /* @__PURE__ */ jsx(CODStatusRoute, {});
export {
  CODStatusRoute,
  SplitComponent as component
};
