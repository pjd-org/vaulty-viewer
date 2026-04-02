import { jsxs, jsx } from "react/jsx-runtime";
import { a9 as useProjectRouteShellContext, a as SoftPanel } from "./router-Dve3S_a4.js";
import "react";
function ProjectTabPlaceholder({
  title,
  description
}) {
  const shellContext = useProjectRouteShellContext();
  return /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]", children: [
    /* @__PURE__ */ jsx(SoftPanel, { title, subtitle: "Phase 1 scaffold", variant: "elevated", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm text-slate-300", children: [
      /* @__PURE__ */ jsx("p", { children: description }),
      /* @__PURE__ */ jsx("p", { children: "This view now resolves inside the canonical project shell and is ready for Phase 3 and Phase 4 feature work." })
    ] }) }),
    /* @__PURE__ */ jsxs(
      SoftPanel,
      {
        title: "Why it is here",
        subtitle: "Viewer V3 shell contract",
        variant: "utility",
        children: [
          /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm text-slate-300", children: [
            /* @__PURE__ */ jsx("li", { children: "Project routes now share one scoped command-center shell." }),
            /* @__PURE__ */ jsx("li", { children: "Tabs are URL-addressable and safe to link directly." }),
            /* @__PURE__ */ jsx("li", { children: "Verification stays visible at the global shell level." })
          ] }),
          shellContext ? /* @__PURE__ */ jsxs(
            "div",
            {
              "data-testid": "project-shell-context",
              className: "mt-4 rounded-[18px] border border-sky-300/20 bg-sky-400/10 p-4 text-sm text-slate-200",
              children: [
                /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100", children: "Inherited project shell" }),
                /* @__PURE__ */ jsxs("p", { className: "mt-2 font-medium text-slate-100", children: [
                  "Project: ",
                  shellContext.projectId
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-slate-300", children: shellContext.projectSurface ? `${shellContext.projectSurface.pressureBand.length} pressure signal${shellContext.projectSurface.pressureBand.length === 1 ? "" : "s"}, ${shellContext.projectSurface.decisionQueue.length} decision${shellContext.projectSurface.decisionQueue.length === 1 ? "" : "s"}, and ${shellContext.projectSurface.verificationRail.length} verification item${shellContext.projectSurface.verificationRail.length === 1 ? "" : "s"} are available to this tab.` : "Project surface is still loading." })
              ]
            }
          ) : null
        ]
      }
    )
  ] });
}
export {
  ProjectTabPlaceholder as P
};
