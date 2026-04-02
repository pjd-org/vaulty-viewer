import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { X as Route, b as apiFetch, U as elapsedMinutes, Y as formatDuration } from "./router-Dve3S_a4.js";
import "@tanstack/react-query";
import "zustand";
import "clsx";
function SessionRoute() {
  const {
    id
  } = Route.useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [mutatingId, setMutatingId] = useState(null);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/sessions/${encodeURIComponent(id)}`);
      if (res.ok) {
        const body = await res.json();
        setSession(body.structuredContent?.session ?? body.session ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    reload();
  }, [reload]);
  const updateTaskStatus = async (task, status) => {
    if (!task.path) return;
    setMutatingId(task.id);
    try {
      await apiFetch(`/api/v1/tasks/${encodeURIComponent(task.path)}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status
        })
      });
      reload();
    } finally {
      setMutatingId(null);
    }
  };
  const endSession = async (status) => {
    if (!session) return;
    setEnding(true);
    try {
      await apiFetch("/cod/session/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId: session.id,
          status
        })
      });
      await navigate({
        to: "/",
        search: {}
      });
    } finally {
      setEnding(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("main", { className: "page focus-page", children: /* @__PURE__ */ jsx("div", { className: "focus-loading", children: "Loading session…" }) });
  }
  if (!session) {
    return /* @__PURE__ */ jsx("main", { className: "page focus-page", children: /* @__PURE__ */ jsxs("div", { className: "focus-empty", children: [
      /* @__PURE__ */ jsx("p", { children: "Session not found." }),
      /* @__PURE__ */ jsx(Link, { to: "/", search: {}, className: "pill pill--soft", children: "← Back to Focus" })
    ] }) });
  }
  const pending = session.tasks?.filter((t) => t.status === "pending") ?? [];
  const inProgress = session.tasks?.filter((t) => t.status === "in_progress") ?? [];
  const done = session.tasks?.filter((t) => t.status === "done") ?? [];
  const skipped = session.tasks?.filter((t) => t.status === "skipped") ?? [];
  const elapsed = session.startedAt ? elapsedMinutes(session.startedAt) : null;
  return /* @__PURE__ */ jsxs("main", { className: "page focus-page", children: [
    /* @__PURE__ */ jsxs("header", { className: "focus-header", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "eyebrow", children: "Session" }),
        /* @__PURE__ */ jsx("h1", { children: session.title ?? `Session ${id.slice(0, 8)}` })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "focus-header__nav", children: /* @__PURE__ */ jsx(Link, { to: "/", search: {}, className: "pill pill--ghost", children: "← Focus" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "session-meta", children: [
      elapsed !== null && /* @__PURE__ */ jsxs("span", { className: "chip", children: [
        elapsed,
        "m elapsed"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "chip", children: [
        formatDuration(session.budgetMin),
        " budget"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "chip", children: [
        done.length,
        "/",
        session.tasks?.length ?? 0,
        " done"
      ] })
    ] }),
    inProgress.length > 0 && /* @__PURE__ */ jsxs("section", { className: "focus-hero", children: [
      /* @__PURE__ */ jsx("p", { className: "focus-section-label", children: "In progress" }),
      inProgress.map((t) => /* @__PURE__ */ jsx(SessionTaskCard, { task: t, onDone: () => updateTaskStatus(t, "completed"), onSkip: () => updateTaskStatus(t, "skipped"), mutating: mutatingId === t.id, hero: true }, t.id))
    ] }),
    pending.length > 0 && /* @__PURE__ */ jsxs("section", { className: "focus-queue", children: [
      /* @__PURE__ */ jsx("p", { className: "focus-section-label", children: "Queued" }),
      /* @__PURE__ */ jsx("div", { className: "focus-queue__list", children: pending.map((t) => /* @__PURE__ */ jsx(SessionTaskCard, { task: t, onDone: () => updateTaskStatus(t, "completed"), onSkip: () => updateTaskStatus(t, "skipped"), mutating: mutatingId === t.id }, t.id)) })
    ] }),
    (done.length > 0 || skipped.length > 0) && /* @__PURE__ */ jsxs("details", { className: "focus-backlog", children: [
      /* @__PURE__ */ jsxs("summary", { className: "focus-backlog__summary", children: [
        "Done (",
        done.length,
        ") · Skipped (",
        skipped.length,
        ")"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "focus-backlog__list", children: [...done, ...skipped].map((t) => /* @__PURE__ */ jsxs("div", { className: "focus-backlog__item", children: [
        /* @__PURE__ */ jsx("span", { className: "focus-backlog__title", children: t.title }),
        /* @__PURE__ */ jsx("span", { className: `chip chip--${t.status === "done" ? "score" : "tag"}`, children: t.status })
      ] }, t.id)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "session-footer", children: [
      /* @__PURE__ */ jsx("button", { className: "na-card__btn na-card__btn--done", onClick: () => endSession("completed"), disabled: ending, children: "End Session" }),
      /* @__PURE__ */ jsx("button", { className: "na-card__btn na-card__btn--skip", onClick: () => endSession("aborted"), disabled: ending, children: "Abort" })
    ] })
  ] });
}
function SessionTaskCard({
  task,
  onDone,
  onSkip,
  mutating,
  hero = false
}) {
  return /* @__PURE__ */ jsxs("article", { className: `na-card${hero ? " na-card--hero" : ""}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "na-card__main", children: [
      /* @__PURE__ */ jsx("span", { className: `na-card__title${hero ? " na-card__title--hero" : ""}`, children: task.title }),
      task.effortScore !== void 0 && task.effortScore > 0 && /* @__PURE__ */ jsx("div", { className: "na-card__chips", children: /* @__PURE__ */ jsxs("span", { className: "chip chip--effort", children: [
        "effort ",
        task.effortScore
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "na-card__actions", children: [
      /* @__PURE__ */ jsx("button", { className: "na-card__btn na-card__btn--done", onClick: onDone, disabled: mutating, children: "✓ Done" }),
      /* @__PURE__ */ jsx("button", { className: "na-card__btn na-card__btn--skip", onClick: onSkip, disabled: mutating, children: "Skip" })
    ] })
  ] });
}
export {
  SessionRoute as component
};
