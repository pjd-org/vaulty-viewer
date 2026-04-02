import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { aa as Route } from "./router-Dve3S_a4.js";
import { Link } from "@tanstack/react-router";
import { K as KnowledgeWorkspaceSurface } from "./KnowledgeWorkspaceSurface-BrVnINPW.js";
import { P as ProjectTabPlaceholder } from "./ProjectTabPlaceholder-BhUpY5nJ.js";
import "@tanstack/react-query";
import "zustand";
import "clsx";
import "./KnowledgeNoteCard-CO55Qh-_.js";
import "./KnowledgeHealthBanner-DkyCWad7.js";
import "./KnowledgeWorkspacePane-C4GxktGV.js";
import "sanitize-html";
import "./NoteBodyRenderer-C6h_gm3u.js";
import "./Chips-CuvTXI26.js";
import "marked";
import "./EmptyState-DhW0XD8j.js";
function normalizeLane(tab) {
  if (tab === "views" || tab === "memories") return tab;
  return "notes";
}
function buildLaneSearch({
  lane,
  selectedId,
  noteId,
  mode,
  templateId,
  memoryTab
}) {
  return {
    tab: lane,
    selectedId,
    noteId,
    mode,
    templateId,
    memoryTab
  };
}
function ProjectKnowledgeLaneShell({
  slug,
  tab,
  selectedId,
  noteId,
  mode,
  templateId,
  memoryTab
}) {
  const activeLane = normalizeLane(tab);
  const workspaceSearch = buildLaneSearch({
    lane: activeLane,
    selectedId,
    noteId,
    mode,
    templateId,
    memoryTab
  });
  const laneParams = { slug };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("div", { className: "genie-surface genie-surface--utility rounded-[24px] p-2", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: ["notes", "views", "memories"].map((lane) => {
      const active = lane === activeLane;
      return /* @__PURE__ */ jsx(
        Link,
        {
          to: "/project/$slug/knowledge",
          params: laneParams,
          search: buildLaneSearch({
            lane,
            selectedId,
            noteId,
            mode,
            templateId,
            memoryTab
          }),
          className: [
            "tab rounded-full px-4 py-2 text-sm font-medium transition-colors",
            active ? "active text-slate-100" : "text-slate-300"
          ].join(" "),
          children: lane.charAt(0).toUpperCase() + lane.slice(1)
        },
        lane
      );
    }) }) }),
    activeLane === "notes" ? /* @__PURE__ */ jsx(
      KnowledgeWorkspaceSurface,
      {
        noteId,
        mode,
        projectId: slug,
        templateId,
        memoryTab,
        workspaceSearch,
        workspaceTo: "/project/$slug/knowledge",
        workspaceParams: laneParams
      }
    ) : activeLane === "views" ? /* @__PURE__ */ jsx(
      ProjectTabPlaceholder,
      {
        title: "Project Knowledge Views",
        description: "Project-scoped views, curated lenses, and lane-specific summaries will render here."
      }
    ) : /* @__PURE__ */ jsx(
      ProjectTabPlaceholder,
      {
        title: "Project Memories",
        description: `Agent and project memories will render here${memoryTab ? ` for ${memoryTab}` : ""}.`
      }
    )
  ] });
}
function ProjectKnowledgeRoute() {
  const {
    slug
  } = Route.useParams();
  const {
    tab,
    selectedId,
    noteId,
    mode,
    templateId,
    memoryTab
  } = Route.useSearch();
  return /* @__PURE__ */ jsx(ProjectKnowledgeLaneShell, { slug, tab, selectedId, noteId, mode, templateId, memoryTab });
}
export {
  ProjectKnowledgeRoute as component
};
