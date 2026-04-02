import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
const audienceColor = {
  human: "bg-primary/10 text-primary",
  agent: "bg-secondary/10 text-secondary",
  bubble: "bg-tertiary/10 text-tertiary"
};
const maturityColor = {
  draft: "bg-surface-container-high text-on-surface-variant",
  stable: "bg-secondary/10 text-secondary",
  deprecated: "bg-error/10 text-error"
};
function KnowledgeNoteCard({
  path,
  title,
  audience,
  domain,
  tags,
  status,
  workspaceLink = false,
  workspaceTo,
  workspaceParams,
  selected = false,
  workspaceSearch
}) {
  const to = workspaceLink ? workspaceTo ?? "/knowledge" : "/note";
  const search = workspaceLink ? { ...workspaceSearch ?? {}, noteId: path } : { p: path };
  return /* @__PURE__ */ jsxs(
    Link,
    {
      to,
      params: workspaceLink ? workspaceParams : void 0,
      search,
      "aria-current": selected ? "page" : void 0,
      className: [
        "group block p-4 rounded-xl border transition-all duration-[var(--vault-duration-snappy)]",
        selected ? "border-primary/40 bg-primary/5 shadow-vault-sm" : "bg-surface-container-lowest border-outline-variant/10 hover:border-primary/30 hover:shadow-vault-sm"
      ].join(" "),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 flex-wrap mb-3", children: [
          audience && audienceColor[audience] && /* @__PURE__ */ jsx("span", { className: `font-manrope text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${audienceColor[audience]}`, children: audience }),
          status && maturityColor[status] && /* @__PURE__ */ jsx("span", { className: `font-manrope text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${maturityColor[status]}`, children: status })
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "font-space-grotesk font-semibold text-sm text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2", children: title }),
        (domain || tags && tags.length > 0) && /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap gap-1", children: [
          domain && /* @__PURE__ */ jsx("span", { className: "font-manrope text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded", children: domain }),
          tags && tags.slice(0, 3).map((tag) => /* @__PURE__ */ jsxs("span", { className: "font-manrope text-[10px] px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant rounded", children: [
            "#",
            tag
          ] }, tag)),
          tags && tags.length > 3 && /* @__PURE__ */ jsxs("span", { className: "font-manrope text-[10px] text-on-surface-variant", children: [
            "+",
            tags.length - 3
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsx("span", { className: "font-manrope text-[10px] uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity", children: "Open →" }) })
      ]
    }
  );
}
export {
  KnowledgeNoteCard as K
};
