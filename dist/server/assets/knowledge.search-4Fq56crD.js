import { jsxs, jsx } from "react/jsx-runtime";
import { useReducer, useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { a7 as Route, b as apiFetch } from "./router-Dve3S_a4.js";
import { K as KnowledgeNoteCard } from "./KnowledgeNoteCard-CO55Qh-_.js";
import { K as KnowledgeHealthBanner } from "./KnowledgeHealthBanner-DkyCWad7.js";
import "@tanstack/react-query";
import "zustand";
import "clsx";
function searchReducer(state, action) {
  switch (action.type) {
    case "SET_Q":
      return {
        ...state,
        q: action.q
      };
    case "SET_MODE":
      return {
        ...state,
        mode: action.mode
      };
    case "SEARCH_START":
      return {
        ...state,
        searching: true
      };
    case "SEARCH_DONE":
      return {
        ...state,
        searching: false,
        results: action.results
      };
  }
}
function KnowledgeSearchRoute() {
  const {
    q: initialQ,
    mode: initialMode
  } = Route.useSearch();
  const navigate = useNavigate({
    from: "/knowledge/search"
  });
  const [{
    q,
    mode,
    results,
    searching
  }, dispatch] = useReducer(searchReducer, {
    q: initialQ,
    mode: initialMode,
    results: [],
    searching: false
  });
  const [health, setHealth] = useState(null);
  const debounceRef = useRef(null);
  useEffect(() => {
    apiFetch("/api/knowledge/health").then((r) => r.json()).then((data) => setHealth(data)).catch(() => setHealth(null));
  }, []);
  const doSearch = (query, searchMode) => {
    if (!query.trim()) {
      dispatch({
        type: "SEARCH_DONE",
        results: []
      });
      return;
    }
    dispatch({
      type: "SEARCH_START"
    });
    apiFetch(`/api/knowledge/search?q=${encodeURIComponent(query)}&mode=${searchMode}`).then((r) => r.json()).then((data) => dispatch({
      type: "SEARCH_DONE",
      results: data.results ?? []
    })).catch(() => dispatch({
      type: "SEARCH_DONE",
      results: []
    }));
  };
  const handleQueryChange = (newQ) => {
    dispatch({
      type: "SET_Q",
      q: newQ
    });
    navigate({
      search: {
        q: newQ,
        mode
      }
    });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(newQ, mode), 300);
  };
  const handleModeChange = (newMode) => {
    dispatch({
      type: "SET_MODE",
      mode: newMode
    });
    navigate({
      search: {
        q,
        mode: newMode
      }
    });
    doSearch(q, newMode);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSearch(q, mode);
  };
  return /* @__PURE__ */ jsxs("main", { className: "page", children: [
    /* @__PURE__ */ jsx("header", { className: "page-header", children: /* @__PURE__ */ jsx("h1", { children: "Knowledge Search" }) }),
    /* @__PURE__ */ jsx(KnowledgeHealthBanner, { health, loading: false }),
    /* @__PURE__ */ jsxs("form", { className: "knowledge-search__form", onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsx("input", { type: "search", className: "knowledge-search__input", value: q, onChange: (e) => handleQueryChange(e.target.value), placeholder: "Search knowledge notes…" }),
      /* @__PURE__ */ jsxs("div", { className: "knowledge-search__mode-toggle", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: `knowledge-search__mode-btn${mode === "tag" ? " knowledge-search__mode-btn--active" : ""}`, onClick: () => handleModeChange("tag"), children: "Structural" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: `knowledge-search__mode-btn${mode === "semantic" ? " knowledge-search__mode-btn--active" : ""}`, onClick: () => handleModeChange("semantic"), children: "Semantic" })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "knowledge-search__submit", children: "Search" })
    ] }),
    searching && /* @__PURE__ */ jsx("div", { className: "knowledge-search__loading", children: "Searching…" }),
    !searching && results.length === 0 && q.trim() !== "" && /* @__PURE__ */ jsxs("p", { className: "knowledge-search__empty", children: [
      'No results for "',
      q,
      '".'
    ] }),
    /* @__PURE__ */ jsx("div", { className: "knowledge-search__results", children: results.map((note) => /* @__PURE__ */ jsx(KnowledgeNoteCard, { ...note }, note.path)) })
  ] });
}
export {
  KnowledgeSearchRoute as component
};
