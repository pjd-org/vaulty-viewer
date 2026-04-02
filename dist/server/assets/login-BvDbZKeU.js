import { jsx, jsxs } from "react/jsx-runtime";
import { c as Route } from "./router-Dve3S_a4.js";
import "@tanstack/react-router";
import "react";
import "@tanstack/react-query";
import "zustand";
import "clsx";
const normalizeReturnTo = (value) => {
  if (typeof value !== "string") return "/";
  const trimmed = value.trim();
  if (!trimmed) return "/";
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/";
  if (trimmed.includes("\\")) return "/";
  return trimmed;
};
function LoginRoute() {
  const search = Route.useSearch();
  const returnTo = normalizeReturnTo(search.return_to);
  return /* @__PURE__ */ jsx("main", { className: "min-h-dvh bg-[var(--vault-bg)] px-4 py-6 text-[var(--vault-ink)] antialiased", children: /* @__PURE__ */ jsx("section", { className: "mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "w-full rounded-[20px] border border-[var(--vault-border-subtle)] bg-[var(--vault-surface)] p-8 shadow-[var(--vault-shadow)]", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("p", { className: "mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--vault-muted)]", children: "Vault Auth" }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Sign in" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-[var(--vault-muted)]", children: "Use your Vault account to continue." })
    ] }),
    search.error ? /* @__PURE__ */ jsx("p", { className: "mb-4 rounded-[8px] border border-[color-mix(in_srgb,var(--vault-status-fail)_25%,transparent)] bg-[color-mix(in_srgb,var(--vault-status-fail)_10%,transparent)] px-3 py-2 text-sm text-[var(--vault-status-fail)]", role: "alert", children: search.error }) : null,
    /* @__PURE__ */ jsxs("form", { method: "post", action: "/auth/login", children: [
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "return_to", value: returnTo }),
      /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-col gap-1.5", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-[var(--vault-muted)]", htmlFor: "email", children: "Email" }),
        /* @__PURE__ */ jsx("input", { className: "w-full rounded-[8px] border border-[var(--vault-border-soft)] bg-[var(--vault-surface-2)] px-3 py-2.5 text-base text-[var(--vault-ink)] outline-none transition focus:border-[var(--vault-accent)] focus:ring-3 focus:ring-[var(--vault-glow)]", id: "email", type: "email", name: "email", autoComplete: "email", required: true })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-5 flex flex-col gap-1.5", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-[var(--vault-muted)]", htmlFor: "password", children: "Password" }),
        /* @__PURE__ */ jsx("input", { className: "w-full rounded-[8px] border border-[var(--vault-border-soft)] bg-[var(--vault-surface-2)] px-3 py-2.5 text-base text-[var(--vault-ink)] outline-none transition focus:border-[var(--vault-accent)] focus:ring-3 focus:ring-[var(--vault-glow)]", id: "password", type: "password", name: "password", autoComplete: "current-password", required: true })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "mt-2 inline-flex w-full items-center justify-center rounded-[8px] bg-[var(--vault-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:opacity-80", type: "submit", children: "Sign in" })
    ] })
  ] }) }) });
}
export {
  LoginRoute as component
};
