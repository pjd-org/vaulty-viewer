import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useReducer, useState, useEffect } from "react";
import { b as apiFetch } from "./router-Dve3S_a4.js";
import { K as KnowledgeNoteCard } from "./KnowledgeNoteCard-CO55Qh-_.js";
import { K as KnowledgeHealthBanner } from "./KnowledgeHealthBanner-DkyCWad7.js";
import { K as KnowledgeWorkspacePane } from "./KnowledgeWorkspacePane-C4GxktGV.js";
function SkeletonCard() {
  return /* @__PURE__ */ jsxs("div", { className: "skeleton-card", children: [
    /* @__PURE__ */ jsx("div", { className: "skeleton skeleton--circle" }),
    /* @__PURE__ */ jsxs("div", { className: "skeleton-card__content", children: [
      /* @__PURE__ */ jsx("div", { className: "skeleton skeleton--title" }),
      /* @__PURE__ */ jsx("div", { className: "skeleton skeleton--text" }),
      /* @__PURE__ */ jsx("div", { className: "skeleton skeleton--text skeleton--short" })
    ] })
  ] });
}
function SkeletonCardGrid({ count = 6 }) {
  return /* @__PURE__ */ jsx("div", { className: "grid", children: Array.from({ length: count }).map((_, i) => /* @__PURE__ */ jsx(SkeletonCard, {}, i)) });
}
function getAllDomains(notes) {
  const domains = /* @__PURE__ */ new Set();
  for (const note of notes) {
    if (note.domain) domains.add(note.domain);
  }
  return Array.from(domains).sort();
}
function filterNotes(notes, domain, maturity) {
  return notes.filter((n) => {
    if (domain && n.domain !== domain) return false;
    if (maturity && n.status !== maturity) return false;
    return true;
  });
}
function AudienceColumn({
  audience,
  notes,
  loading,
  selectedNoteId,
  workspaceSearch,
  workspaceTo,
  workspaceParams
}) {
  if (loading) return /* @__PURE__ */ jsx(SkeletonCardGrid, { count: 3 });
  if (notes.length === 0) {
    return /* @__PURE__ */ jsxs("p", { className: "knowledge-col__empty", children: [
      "No ",
      audience,
      " knowledge notes yet."
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "knowledge-col__notes", children: notes.map((note) => /* @__PURE__ */ jsx(
    KnowledgeNoteCard,
    {
      ...note,
      workspaceLink: true,
      workspaceTo,
      workspaceParams,
      selected: selectedNoteId ? note.path === selectedNoteId : false,
      workspaceSearch
    },
    note.path
  )) });
}
function knowledgeReducer(state, action) {
  switch (action.type) {
    case "HEALTH_LOADED":
      return { ...state, health: action.health, healthLoading: false };
    case "NOTES_LOADED":
      return { ...state, audienceData: action.audienceData, notesLoading: false };
  }
}
function KnowledgeWorkspaceSurface({
  noteId,
  mode,
  projectId,
  templateId,
  memoryTab,
  workspaceSearch,
  workspaceTo,
  workspaceParams
}) {
  const [{ health, healthLoading, audienceData, notesLoading }, dispatch] = useReducer(
    knowledgeReducer,
    { health: null, healthLoading: true, audienceData: { human: [], agent: [], bubble: [] }, notesLoading: true }
  );
  const [domainFilter, setDomainFilter] = useState("");
  const [maturityFilter, setMaturityFilter] = useState("");
  useEffect(() => {
    apiFetch("/api/knowledge/health").then((r) => r.json()).then((data) => dispatch({ type: "HEALTH_LOADED", health: data })).catch(() => dispatch({ type: "HEALTH_LOADED", health: null }));
    const audiences = ["human", "agent", "bubble"];
    Promise.all(
      audiences.map(
        (a) => apiFetch(`/api/knowledge/by-audience?audience=${a}`).then((r) => r.json()).then((data) => data).catch(() => ({ audience: a, notes: [] }))
      )
    ).then((results) => {
      const map = {};
      for (const r of results) map[r.audience] = r.notes;
      dispatch({ type: "NOTES_LOADED", audienceData: map });
    });
  }, []);
  const allNotes = [...audienceData.human ?? [], ...audienceData.agent ?? [], ...audienceData.bubble ?? []];
  const allDomains = getAllDomains(allNotes);
  const filteredHuman = filterNotes(audienceData.human ?? [], domainFilter, maturityFilter);
  const filteredAgent = filterNotes(audienceData.agent ?? [], domainFilter, maturityFilter);
  const filteredBubble = filterNotes(audienceData.bubble ?? [], domainFilter, maturityFilter);
  const allVisibleNotes = [...filteredHuman, ...filteredAgent, ...filteredBubble];
  const workspaceNoteId = noteId ?? allVisibleNotes[0]?.path;
  const targetTo = workspaceTo ?? "/knowledge";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(KnowledgeHealthBanner, { health, loading: healthLoading }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]", children: [
      /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "knowledge-filters", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "knowledge-domain-filter", children: "Domain" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              id: "knowledge-domain-filter",
              value: domainFilter,
              onChange: (e) => setDomainFilter(e.target.value),
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "All domains" }),
                allDomains.map((d) => /* @__PURE__ */ jsx("option", { value: d, children: d }, d))
              ]
            }
          ),
          /* @__PURE__ */ jsx("label", { htmlFor: "knowledge-maturity-filter", children: "Maturity" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              id: "knowledge-maturity-filter",
              value: maturityFilter,
              onChange: (e) => setMaturityFilter(e.target.value),
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "All" }),
                /* @__PURE__ */ jsx("option", { value: "draft", children: "Draft" }),
                /* @__PURE__ */ jsx("option", { value: "stable", children: "Stable" }),
                /* @__PURE__ */ jsx("option", { value: "deprecated", children: "Deprecated" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "knowledge-grid", children: [
          /* @__PURE__ */ jsxs("section", { className: "knowledge-col", children: [
            /* @__PURE__ */ jsx("h2", { className: "knowledge-col__title", children: "Human" }),
            /* @__PURE__ */ jsx(
              AudienceColumn,
              {
                audience: "human",
                notes: filteredHuman,
                loading: notesLoading,
                selectedNoteId: workspaceNoteId,
                workspaceSearch,
                workspaceTo: targetTo,
                workspaceParams
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "knowledge-col", children: [
            /* @__PURE__ */ jsx("h2", { className: "knowledge-col__title", children: "Agent" }),
            /* @__PURE__ */ jsx(
              AudienceColumn,
              {
                audience: "agent",
                notes: filteredAgent,
                loading: notesLoading,
                selectedNoteId: workspaceNoteId,
                workspaceSearch,
                workspaceTo: targetTo,
                workspaceParams
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "knowledge-col", children: [
            /* @__PURE__ */ jsx("h2", { className: "knowledge-col__title", children: "Bubble" }),
            /* @__PURE__ */ jsx(
              AudienceColumn,
              {
                audience: "bubble",
                notes: filteredBubble,
                loading: notesLoading,
                selectedNoteId: workspaceNoteId,
                workspaceSearch,
                workspaceTo: targetTo,
                workspaceParams
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        KnowledgeWorkspacePane,
        {
          noteId: workspaceNoteId,
          mode,
          projectId,
          templateId,
          memoryTab,
          workspaceSearch
        }
      )
    ] })
  ] });
}
export {
  KnowledgeWorkspaceSurface as K
};
