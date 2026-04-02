import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { K as KnowledgeWorkspaceSurface } from "./KnowledgeWorkspaceSurface-BrVnINPW.js";
import { d as Route } from "./router-Dve3S_a4.js";
import "react";
import "./KnowledgeNoteCard-CO55Qh-_.js";
import "./KnowledgeHealthBanner-DkyCWad7.js";
import "./KnowledgeWorkspacePane-C4GxktGV.js";
import "sanitize-html";
import "./NoteBodyRenderer-C6h_gm3u.js";
import "./Chips-CuvTXI26.js";
import "marked";
import "./EmptyState-DhW0XD8j.js";
import "@tanstack/react-query";
import "zustand";
import "clsx";
function KnowledgeRoute() {
  const {
    tab,
    noteId,
    mode,
    templateId,
    memoryTab,
    projectId
  } = Route.useSearch();
  const workspaceSearch = {
    tab: tab ?? "notes",
    ...mode ? {
      mode
    } : {},
    ...templateId ? {
      templateId
    } : {},
    ...memoryTab ? {
      memoryTab
    } : {},
    ...projectId ? {
      projectId
    } : {}
  };
  return /* @__PURE__ */ jsxs("main", { className: "page", children: [
    /* @__PURE__ */ jsx("header", { className: "page-header", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { children: "Knowledge" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-500", children: "Active authoring and context operations." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx(Link, { to: "/knowledge/search", search: ((prev) => ({
          ...prev,
          mode: "semantic"
        })), className: "btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-700", children: "Search" }),
        /* @__PURE__ */ jsx(Link, { to: "/knowledge/graph", className: "btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-700", children: "Graph" }),
        noteId && /* @__PURE__ */ jsx(Link, { to: "/note", search: {
          p: noteId
        }, className: "btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-700", children: "Open note" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(KnowledgeWorkspaceSurface, { noteId, mode, projectId, templateId, memoryTab, workspaceSearch, workspaceTo: "/knowledge" })
  ] });
}
export {
  KnowledgeRoute as component
};
