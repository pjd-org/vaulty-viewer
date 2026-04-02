import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { a6 as Route } from "./router-Dve3S_a4.js";
import "react";
import "@tanstack/react-query";
import "zustand";
import "clsx";
function OAuthConsentRoute() {
  const search = Route.useSearch();
  const scopes = (search.scope || "").split(" ").map((scope) => scope.trim()).filter(Boolean);
  if (!search.client_id || !search.redirect_uri) {
    return /* @__PURE__ */ jsx("main", { className: "min-h-dvh bg-[var(--vault-bg)] px-4 py-6 text-[var(--vault-ink)] antialiased", children: /* @__PURE__ */ jsx("section", { className: "mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-2xl items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "w-full rounded-[20px] border border-[var(--vault-border-subtle)] bg-[var(--vault-surface)] p-8 shadow-[var(--vault-shadow)]", children: [
      /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--vault-muted)]", children: "OAuth Authorization" }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Invalid request" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-[var(--vault-muted)]", children: "Missing OAuth client parameters." }),
      /* @__PURE__ */ jsx(Link, { to: "/login", className: "mt-6 inline-flex items-center justify-center rounded-[8px] bg-[var(--vault-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:opacity-80", children: "Go to sign in" })
    ] }) }) });
  }
  return /* @__PURE__ */ jsx("main", { className: "min-h-dvh bg-[var(--vault-bg)] px-4 py-6 text-[var(--vault-ink)] antialiased", children: /* @__PURE__ */ jsx("section", { className: "mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-2xl items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "w-full rounded-[20px] border border-[var(--vault-border-subtle)] bg-[var(--vault-surface)] p-8 shadow-[var(--vault-shadow)]", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--vault-muted)]", children: "OAuth Authorization" }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Authorize Vault Access" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-3 text-base leading-7 text-[var(--vault-ink)]", children: [
        "Client ",
        /* @__PURE__ */ jsx("strong", { children: search.client_id }),
        " is requesting access."
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mb-6 rounded-[8px] border border-[var(--vault-border-faint)] bg-[var(--vault-surface-2)] px-4 py-3 text-sm text-[var(--vault-muted)]", children: scopes.length > 0 ? /* @__PURE__ */ jsx("ul", { className: "flex flex-wrap gap-2", children: scopes.map((scope) => /* @__PURE__ */ jsx("li", { className: "rounded-[999px] border border-[var(--vault-border-soft)] bg-[var(--vault-surface-3)] px-2 py-0.5 text-xs", children: scope }, scope)) }) : /* @__PURE__ */ jsx("span", { children: "Scopes: (none)" }) }),
    /* @__PURE__ */ jsxs("form", { method: "post", action: "/auth/oauth/authorize", children: [
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "client_id", value: search.client_id }),
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "redirect_uri", value: search.redirect_uri }),
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "scope", value: search.scope || "" }),
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "state", value: search.state || "" }),
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "code_challenge", value: search.code_challenge || "" }),
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "code_challenge_method", value: search.code_challenge_method || "" }),
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "resource", value: search.resource || "" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-col gap-3 sm:flex-row", children: [
        /* @__PURE__ */ jsx("button", { className: "inline-flex flex-1 items-center justify-center rounded-[8px] bg-[var(--vault-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:opacity-80", type: "submit", name: "decision", value: "approve", children: "Approve" }),
        /* @__PURE__ */ jsx("button", { className: "inline-flex flex-1 items-center justify-center rounded-[8px] border border-[var(--vault-border-soft)] bg-[var(--vault-surface-3)] px-4 py-2.5 text-sm font-semibold text-[var(--vault-ink)] transition hover:opacity-90 active:opacity-80", type: "submit", name: "decision", value: "deny", children: "Deny" })
      ] })
    ] })
  ] }) }) });
}
export {
  OAuthConsentRoute as component
};
