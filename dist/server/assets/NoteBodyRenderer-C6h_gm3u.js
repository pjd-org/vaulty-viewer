import { jsxs, jsx } from "react/jsx-runtime";
import React__default from "react";
import { a as SoftPanel, P as PrimaryButton, S as SecondaryButton } from "./router-Dve3S_a4.js";
import { S as SoftChip, a as StatusPill } from "./Chips-CuvTXI26.js";
import { Link } from "@tanstack/react-router";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
const INTERNAL_LINK_SCHEME = "vault-note:";
const EXTERNAL_PROTOCOL = /^[a-z][a-z0-9+.-]*:/i;
const escapeHtml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const SANITIZE_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img",
    "input",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td"
  ]),
  allowedAttributes: {
    a: ["href", "name", "target", "rel", "class", "title"],
    code: ["class"],
    img: ["src", "alt", "title"],
    input: ["type", "checked", "disabled"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
    "*": ["class"]
  },
  allowedSchemes: ["http", "https", "mailto", "obsidian"]
};
function formatNoteLabel(value) {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function stripMarkdownExtension(value) {
  return value.endsWith(".md") ? value.slice(0, -3) : value;
}
function toNoteSearchPath(value) {
  return stripMarkdownExtension(value.trim().replace(/^\/+/, ""));
}
function toApiNotePath(value) {
  const normalized = toNoteSearchPath(value);
  return normalized.endsWith(".md") ? normalized : `${normalized}.md`;
}
function toNoteHref(value) {
  return `/note?p=${encodeURIComponent(toNoteSearchPath(value))}`;
}
function getNoteSource(value) {
  const normalized = toNoteSearchPath(value);
  if (normalized.startsWith("inbox/rejected/")) return "rejected";
  if (normalized.startsWith("inbox/extracted/")) return "extracted";
  if (normalized.startsWith("inbox/")) return "inbox";
  return "canonical";
}
function getNoteCollection(value) {
  const normalized = toNoteSearchPath(value);
  const parts = normalized.split("/").filter(Boolean);
  if (parts[0] === "notes" && parts[1]) return parts[1];
  if (parts[0] === "inbox" && parts[1]) {
    if (parts[1] === "rejected" || parts[1] === "extracted") return parts[1];
    return "inbox";
  }
  return parts[0] || "notes";
}
function isTaskPath(value) {
  const normalized = toNoteSearchPath(value);
  return normalized.startsWith("tasks/") || normalized.startsWith("notes/tasks/");
}
function readStringValue(value) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
function getLifecycleContext(notePath, frontmatter) {
  const source = getNoteSource(notePath);
  const runId = readStringValue(frontmatter._run_id);
  const isTask = frontmatter.type === "task" || isTaskPath(notePath) || getNoteCollection(notePath) === "tasks";
  const noteStatus = readStringValue(frontmatter.status);
  const isStaged = (source === "extracted" || source === "rejected") && !!runId;
  return {
    source,
    isTask,
    isCanonicalTask: source === "canonical" && isTask,
    isStaged,
    canPromote: isStaged,
    canReject: source === "extracted" && !!runId,
    canComplete: source === "canonical" && isTask && noteStatus !== "completed" && noteStatus !== "archived",
    canReview: source === "canonical" && isTask,
    runId,
    targetPath: readStringValue(frontmatter._target_path),
    reviewStatus: readStringValue(frontmatter.review_status)
  };
}
function rewriteWikiLinks(markdown) {
  return markdown.replace(
    /\[\[([^\]|]+)\|([^\]]+)\]\]/g,
    (_match, target, label) => `[${label}](${INTERNAL_LINK_SCHEME}${toNoteSearchPath(target)})`
  ).replace(/\[\[([^\]]+)\]\]/g, (_match, target) => {
    const normalized = toNoteSearchPath(target);
    const label = normalized.split("/").pop() || normalized;
    return `[${label}](${INTERNAL_LINK_SCHEME}${normalized})`;
  });
}
function normalizeInternalHref(href) {
  if (!href) return null;
  if (href.startsWith(INTERNAL_LINK_SCHEME)) {
    return toNoteSearchPath(href.slice(INTERNAL_LINK_SCHEME.length));
  }
  if (href.startsWith("/note?p=")) {
    return toNoteSearchPath(decodeURIComponent(href.slice("/note?p=".length)));
  }
  if (href.startsWith("/note/")) {
    return toNoteSearchPath(href.slice("/note/".length));
  }
  if (href.startsWith("#")) return null;
  if (href.startsWith("//")) return null;
  if (EXTERNAL_PROTOCOL.test(href)) return null;
  if (href.startsWith("/")) {
    return toNoteSearchPath(href);
  }
  return toNoteSearchPath(href);
}
function buildRenderer() {
  const renderer = new marked.Renderer();
  renderer.link = ({ href = "", title, text }) => {
    const internalHref = normalizeInternalHref(href);
    if (internalHref) {
      const resolvedHref = escapeHtml(toNoteHref(internalHref));
      const resolvedTitle = title ? ` title="${escapeHtml(title)}"` : "";
      return `<a href="${resolvedHref}" class="wikilink"${resolvedTitle}>${text}</a>`;
    }
    const safeHref = escapeHtml(href || "#");
    const safeTitle = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${safeHref}" target="_blank" rel="noreferrer noopener"${safeTitle}>${text}</a>`;
  };
  return renderer;
}
function applyTaskItemClasses(html) {
  return html.replace(
    /<li>\s*<input[^>]*checked[^>]*disabled[^>]*>\s*/g,
    '<li class="task-item task-done"><input type="checkbox" checked disabled /> '
  ).replace(
    /<li>\s*<input[^>]*disabled[^>]*>\s*/g,
    '<li class="task-item"><input type="checkbox" disabled /> '
  );
}
function renderNoteMarkdown(markdown) {
  if (!markdown.trim()) return "";
  const prepared = rewriteWikiLinks(markdown);
  const rawHtml = marked.parse(prepared, {
    gfm: true,
    breaks: false,
    renderer: buildRenderer()
  });
  return applyTaskItemClasses(sanitizeHtml(rawHtml, SANITIZE_OPTIONS).trim());
}
function NoteHeader({ display, onAction, extraActions }) {
  const hasActions = display.primaryActions.length > 0 || Boolean(extraActions);
  return /* @__PURE__ */ jsxs(SoftPanel, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 text-xs text-slate-400", children: display.breadcrumbs.map((crumb, i) => /* @__PURE__ */ jsxs(React__default.Fragment, { children: [
        i > 0 && /* @__PURE__ */ jsx("span", { className: "opacity-50 mx-0.5", children: "/" }),
        /* @__PURE__ */ jsx("span", { children: crumb.label })
      ] }, crumb.path ?? crumb.label)) }),
      /* @__PURE__ */ jsx(SoftChip, { label: display.typeLabel, variant: "default" })
    ] }),
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold text-slate-900 mt-2 leading-snug", children: display.title }),
    display.statusLabel && /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(SoftChip, { label: display.statusLabel, variant: display.statusVariant }) }),
    hasActions && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mt-4", children: [
      display.primaryActions.map(
        (action) => action.variant === "primary" ? /* @__PURE__ */ jsx(
          PrimaryButton,
          {
            onClick: () => onAction?.(action.action),
            children: action.label
          },
          action.action
        ) : /* @__PURE__ */ jsx(
          SecondaryButton,
          {
            onClick: () => onAction?.(action.action),
            children: action.label
          },
          action.action
        )
      ),
      extraActions
    ] })
  ] });
}
const KNOWN_STATUSES = ["todo", "in-progress", "blocked", "done", "backlog"];
function isKnownStatus(s) {
  return KNOWN_STATUSES.includes(s);
}
function getStringValue(value) {
  return typeof value === "string" ? value : null;
}
function getNumberValue(value) {
  return typeof value === "number" ? value : null;
}
function NoteMetaRail({
  frontmatter,
  lifecycle,
  relatedNotes,
  path,
  workspaceLink = false,
  workspaceTo,
  workspaceParams,
  workspaceSearch
}) {
  const rawStatus = getStringValue(frontmatter.status);
  const priority = getNumberValue(frontmatter.priority);
  const dueDate = getStringValue(frontmatter.dueDate) ?? getStringValue(frontmatter.due_date);
  const created = getStringValue(frontmatter.created);
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags.map((t) => String(t)) : [];
  const formattedDue = dueDate ? new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
  const formattedCreated = created ? new Date(created).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx(SoftPanel, { title: "Metadata", children: /* @__PURE__ */ jsxs("dl", { className: "space-y-3", children: [
      rawStatus && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("dt", { className: "text-[10px] uppercase tracking-widest text-neutral-400 mb-1", children: "Status" }),
        /* @__PURE__ */ jsx("dd", { children: isKnownStatus(rawStatus) ? /* @__PURE__ */ jsx(StatusPill, { status: rawStatus }) : /* @__PURE__ */ jsx(SoftChip, { label: rawStatus, variant: "default" }) })
      ] }),
      priority !== null && priority >= 7 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("dt", { className: "text-[10px] uppercase tracking-widest text-neutral-400 mb-1", children: "Priority" }),
        /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx(SoftChip, { label: `P${priority} · High priority`, variant: "warning" }) })
      ] }),
      priority !== null && priority < 7 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("dt", { className: "text-[10px] uppercase tracking-widest text-neutral-400 mb-1", children: "Priority" }),
        /* @__PURE__ */ jsxs("dd", { className: "text-sm text-neutral-700", children: [
          "P",
          priority
        ] })
      ] }),
      formattedDue && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("dt", { className: "text-[10px] uppercase tracking-widest text-neutral-400 mb-1", children: "Due" }),
        /* @__PURE__ */ jsx("dd", { className: "text-sm text-neutral-700", children: formattedDue })
      ] }),
      tags.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("dt", { className: "text-[10px] uppercase tracking-widest text-neutral-400 mb-1", children: "Tags" }),
        /* @__PURE__ */ jsx("dd", { className: "flex flex-wrap gap-1.5 mt-1", children: tags.map((tag) => /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/",
            search: { q: tag, collection: "all" },
            className: "text-[11px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors",
            children: [
              "#",
              tag
            ]
          },
          tag
        )) })
      ] }),
      formattedCreated && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("dt", { className: "text-[10px] uppercase tracking-widest text-neutral-400 mb-1", children: "Created" }),
        /* @__PURE__ */ jsx("dd", { className: "text-sm text-neutral-700", children: formattedCreated })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(SoftPanel, { title: "Related", children: relatedNotes.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400", children: "No related notes found yet." }) : /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: relatedNotes.map((related) => {
      const slug = stripMarkdownExtension(related.path);
      const label = formatNoteLabel(slug.split("/").pop() ?? slug);
      const collection = slug.split("/")[0] ?? "";
      return /* @__PURE__ */ jsxs(
        Link,
        {
          to: workspaceLink ? workspaceTo ?? "/knowledge" : "/note",
          params: workspaceLink ? workspaceParams : void 0,
          search: workspaceLink ? { ...workspaceSearch ?? {}, noteId: slug } : { p: slug },
          className: "block p-2.5 rounded-xl border border-slate-100 bg-neutral-50 hover:bg-blue-50 hover:border-blue-100 transition-all group",
          children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-neutral-700 truncate group-hover:text-blue-700", children: label }),
            collection && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-400 mt-0.5", children: collection })
          ]
        },
        related.path
      );
    }) }) }),
    /* @__PURE__ */ jsxs("details", { className: "rounded-[28px] border border-neutral-200 bg-surface shadow-sm overflow-hidden", children: [
      /* @__PURE__ */ jsxs("summary", { className: "px-6 py-4 text-xs font-medium text-neutral-400 cursor-pointer hover:text-neutral-600 select-none list-none flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: "System" }),
        /* @__PURE__ */ jsx("span", { className: "opacity-50", children: "▸" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "px-6 pb-5 space-y-3", children: [
        lifecycle.source !== "canonical" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-widest text-neutral-400", children: "Source" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 break-all mt-0.5", children: lifecycle.source })
        ] }),
        lifecycle.runId && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-widest text-neutral-400", children: "Run ID" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 break-all mt-0.5", children: lifecycle.runId })
        ] }),
        lifecycle.targetPath && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-widest text-neutral-400", children: "Target" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 break-all mt-0.5", children: lifecycle.targetPath })
        ] }),
        lifecycle.reviewStatus && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-widest text-neutral-400", children: "Review" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 mt-0.5", children: lifecycle.reviewStatus })
        ] }),
        path && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-widest text-neutral-400", children: "Path" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 break-all mt-0.5", children: path })
        ] })
      ] })
    ] })
  ] });
}
function NoteBodyRenderer({ html, className = "" }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `note-content text-sm text-neutral-700 leading-relaxed ${className}`,
      dangerouslySetInnerHTML: { __html: html }
    }
  );
}
export {
  NoteHeader as N,
  NoteBodyRenderer as a,
  NoteMetaRail as b,
  toApiNotePath as c,
  getNoteCollection as d,
  toNoteHref as e,
  formatNoteLabel as f,
  getLifecycleContext as g,
  renderNoteMarkdown as r,
  stripMarkdownExtension as s,
  toNoteSearchPath as t
};
