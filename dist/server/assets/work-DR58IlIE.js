import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { f as fetchProjects } from "./router-Dve3S_a4.js";
import { W as WorkspaceScaffold } from "./WorkspaceScaffold-ClVsxrpP.js";
import { useQuery } from "@tanstack/react-query";
import { S as SoftChip } from "./Chips-CuvTXI26.js";
import { E as EmptyState } from "./EmptyState-DhW0XD8j.js";
import "./KnowledgeWorkspacePane-C4GxktGV.js";
import "@tanstack/react-router";
import "zustand";
import "clsx";
import "./SummaryRow-3HynMwwn.js";
import "./PageFrame-Cq4YOB6Y.js";
import "sanitize-html";
import "./NoteBodyRenderer-C6h_gm3u.js";
import "marked";
const GAP_CLASS = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10"
};
function CardGrid({ cols = 12, gap = 6, children }) {
  const colClass = cols === 12 ? "grid-cols-12" : `grid-cols-${cols}`;
  const gapClass = GAP_CLASS[gap] ?? "gap-6";
  return /* @__PURE__ */ jsx("div", { className: `grid ${colClass} ${gapClass}`, children });
}
const ProjectCard = ({ project }) => {
  return /* @__PURE__ */ jsxs("div", { className: "genie-surface genie-surface--elevated p-6 transition hover:-translate-y-1 hover:shadow-lg", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-slate-800", children: project.title }),
      /* @__PURE__ */ jsx(SoftChip, { label: project.statusLabel, variant: project.statusVariant })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-600", children: project.bestMoveTitle }),
    /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsx("div", { className: "progress h-2 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "progress-fill h-2", style: { width: `${project.progressPercent ?? 0}%` } }) }) })
  ] });
};
function ProjectsWorkspace() {
  const {
    data: projects,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 6e4,
    retry: 1
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-sky-300" }) });
  }
  if (isError) {
    return /* @__PURE__ */ jsx(
      EmptyState,
      {
        title: "Failed to load projects",
        description: "Try reloading the page."
      }
    );
  }
  if (!projects?.length) {
    return /* @__PURE__ */ jsx(
      EmptyState,
      {
        title: "No projects",
        description: "Create a project to get started."
      }
    );
  }
  return /* @__PURE__ */ jsx(CardGrid, { children: projects.map((project) => /* @__PURE__ */ jsx("div", { className: "col-span-1", children: /* @__PURE__ */ jsx("a", { href: `/project/${encodeURIComponent(project.id)}`, className: "block", children: /* @__PURE__ */ jsx(ProjectCard, { project }) }) }, project.id)) });
}
function WorkRoute() {
  return /* @__PURE__ */ jsx(WorkspaceScaffold, { title: "Work", subtitle: "Durable execution lane for tasks, projects, and dependencies.", summaryItems: [{
    label: "Projects",
    value: "Live",
    detail: "Legacy projects index now lands here"
  }, {
    label: "Tasks",
    value: "Queued",
    detail: "Today, overdue, blocked, active"
  }, {
    label: "Dependencies",
    value: "Tracked",
    detail: "Unblock paths and bottlenecks"
  }, {
    label: "Scope",
    value: "Portfolio",
    detail: "Global work lane"
  }], primaryTitle: "Projects", primarySubtitle: "Compatibility-preserving project list while the work lane grows.", primary: /* @__PURE__ */ jsx(ProjectsWorkspace, {}), asideTitle: "Execution Notes", asideSubtitle: "What ships in later phases.", aside: /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm text-slate-300", children: [
    /* @__PURE__ */ jsxs("p", { children: [
      "Phase 1 keeps project discovery intact under the canonical ",
      /* @__PURE__ */ jsx("code", { children: "/work" }),
      " route."
    ] }),
    /* @__PURE__ */ jsx("p", { children: "Phase 3 adds the task and dependency workspaces beside this project surface." })
  ] }) });
}
export {
  WorkRoute as component
};
