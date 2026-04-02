import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useReducer, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import sanitizeHtml from "sanitize-html";
import { a as SoftPanel, t as toNoteHeaderDisplay, b as apiFetch } from "./router-Dve3S_a4.js";
import { t as toNoteSearchPath, N as NoteHeader, a as NoteBodyRenderer, b as NoteMetaRail, c as toApiNotePath, g as getLifecycleContext, r as renderNoteMarkdown, s as stripMarkdownExtension, f as formatNoteLabel } from "./NoteBodyRenderer-C6h_gm3u.js";
import { S as SoftChip } from "./Chips-CuvTXI26.js";
import { E as EmptyState } from "./EmptyState-DhW0XD8j.js";
const sanitizeOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "code",
    "pre",
    "kbd",
    "mark",
    "details",
    "summary",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td"
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    code: ["class"],
    pre: ["class"],
    "*": ["class", "id"]
  }
};
function workspaceReducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true, error: null };
    case "LOAD_ERROR":
      return { note: null, relatedNotes: [], loading: false, error: action.error };
    case "LOAD_DONE":
      return { note: action.note, relatedNotes: action.relatedNotes, loading: false, error: null };
    case "CLEAR":
      return { note: null, relatedNotes: [], loading: false, error: null };
  }
}
function getStringValue(value) {
  return typeof value === "string" ? value : null;
}
function KnowledgeWorkspacePane({
  noteId,
  mode = "read",
  projectId,
  templateId,
  memoryTab,
  workspaceSearch
}) {
  const [{ note, relatedNotes, loading, error }, dispatch] = useReducer(workspaceReducer, {
    note: null,
    relatedNotes: [],
    loading: false,
    error: null
  });
  useEffect(() => {
    const requestedPath = noteId ? toNoteSearchPath(noteId) : null;
    if (!requestedPath) {
      dispatch({ type: "CLEAR" });
      return;
    }
    let cancelled = false;
    dispatch({ type: "LOAD_START" });
    const loadNote = async () => {
      const apiPath = toApiNotePath(requestedPath);
      const encodedPath = encodeURIComponent(apiPath);
      const [noteResponse, relatedResponse] = await Promise.all([
        apiFetch(`/api/v1/notes/${encodedPath}`),
        apiFetch(`/api/v1/graph/related/${encodedPath}?limit=8`)
      ]);
      if (!noteResponse.ok) {
        throw new Error(`Note not found: ${requestedPath}`);
      }
      const noteResult = await noteResponse.json();
      const structured = noteResult.structuredContent || {};
      const frontmatter = structured.frontmatter || {};
      const resolvedPath = getStringValue(structured.path) || apiPath;
      const rawContent = getStringValue(structured.content) || "";
      const lifecycle = getLifecycleContext(resolvedPath, frontmatter);
      const loadedNote = {
        path: resolvedPath,
        searchPath: stripMarkdownExtension(resolvedPath),
        title: getStringValue(frontmatter.title) || formatNoteLabel(stripMarkdownExtension(resolvedPath).split("/").pop() || ""),
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map((tag) => String(tag)) : [],
        collection: stripMarkdownExtension(resolvedPath).split("/")[0] ?? "",
        content: rawContent,
        html: renderNoteMarkdown(rawContent),
        frontmatter,
        lifecycle
      };
      const relatedResult = relatedResponse.ok ? await relatedResponse.json() : null;
      const nextRelated = relatedResult?.structuredContent?.related ?? relatedResult?.related ?? [];
      if (!cancelled) {
        dispatch({ type: "LOAD_DONE", note: loadedNote, relatedNotes: nextRelated });
      }
    };
    void loadNote().catch((err) => {
      if (!cancelled) {
        dispatch({
          type: "LOAD_ERROR",
          error: err instanceof Error ? err.message : "Unable to load the selected note."
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [noteId]);
  const modeLabel = mode === "edit" ? "Edit mode" : "Read mode";
  const summaryChips = useMemo(
    () => [
      /* @__PURE__ */ jsx(SoftChip, { label: modeLabel, variant: "default" }, "mode"),
      projectId ? /* @__PURE__ */ jsx(SoftChip, { label: `Project ${projectId}`, variant: "default" }, "project") : null,
      templateId ? /* @__PURE__ */ jsx(SoftChip, { label: `Template ${templateId}`, variant: "default" }, "template") : null,
      memoryTab ? /* @__PURE__ */ jsx(SoftChip, { label: `Memory ${memoryTab}`, variant: "default" }, "memory") : null
    ].filter(Boolean),
    [memoryTab, modeLabel, projectId, templateId]
  );
  const selectedLabel = note ? note.title : "Select a note";
  return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxs(
    SoftPanel,
    {
      variant: "utility",
      title: "Active note",
      subtitle: "Authoring workspace and context operations",
      children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: summaryChips }),
        !noteId && /* @__PURE__ */ jsx(
          EmptyState,
          {
            title: "Select a note from the browser",
            description: "Open a note on the left to load its editor, metadata, and related references."
          }
        ),
        loading && /* @__PURE__ */ jsx(
          EmptyState,
          {
            title: "Loading note",
            description: "Fetching the selected note and its related references."
          }
        ),
        !loading && error && /* @__PURE__ */ jsx(
          EmptyState,
          {
            title: "Note unavailable",
            description: error
          }
        ),
        !loading && !error && note && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx(
            NoteHeader,
            {
              display: toNoteHeaderDisplay({
                title: note.title,
                type: getStringValue(note.frontmatter.type),
                status: getStringValue(note.frontmatter.status),
                path: note.path
              }),
              extraActions: /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: "/note",
                    search: { p: note.searchPath },
                    className: "btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/80",
                    children: "Open full editor"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: "/knowledge/search",
                    search: ((prev) => ({ ...prev, q: note.title, mode: "semantic" })),
                    className: "btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/80",
                    children: "Search around note"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: "/knowledge/graph",
                    className: "btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/80",
                    children: "Open graph"
                  }
                )
              ] })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.9fr)]", children: [
            /* @__PURE__ */ jsx(SoftPanel, { variant: "utility", title: "Preview", subtitle: selectedLabel, children: /* @__PURE__ */ jsx(
              NoteBodyRenderer,
              {
                html: sanitizeHtml(note.html, sanitizeOptions)
              }
            ) }),
            /* @__PURE__ */ jsx(
              NoteMetaRail,
              {
                frontmatter: note.frontmatter,
                lifecycle: note.lifecycle,
                relatedNotes,
                path: note.path,
                workspaceLink: true,
                workspaceSearch
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            SoftPanel,
            {
              variant: "utility",
              title: "Workspace actions",
              subtitle: "Context operations for the selected note",
              children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: "/note",
                    search: { p: note.searchPath },
                    className: "btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/80",
                    children: "Open note in editor"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: "/knowledge/search",
                    search: ((prev) => ({ ...prev, q: note.title, mode: "semantic" })),
                    className: "btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/80",
                    children: "Search related context"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: "/knowledge/graph",
                    className: "btn-secondary rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/80",
                    children: "Open knowledge graph"
                  }
                )
              ] })
            }
          )
        ] })
      ]
    }
  ) });
}
export {
  KnowledgeWorkspacePane as K
};
