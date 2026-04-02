import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useReducer, useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import sanitizeHtml from "sanitize-html";
import { R as Route, P as PrimaryButton, S as SecondaryButton, t as toNoteHeaderDisplay, a as SoftPanel, b as apiFetch } from "./router-Dve3S_a4.js";
import { t as toNoteSearchPath, N as NoteHeader, s as stripMarkdownExtension, f as formatNoteLabel, a as NoteBodyRenderer, b as NoteMetaRail, c as toApiNotePath, g as getLifecycleContext, r as renderNoteMarkdown, d as getNoteCollection, e as toNoteHref } from "./NoteBodyRenderer-C6h_gm3u.js";
import "@tanstack/react-query";
import "zustand";
import "clsx";
import "./Chips-CuvTXI26.js";
import "marked";
const getStringValue = (value) => typeof value === "string" ? value : null;
const getNumberValue = (value) => typeof value === "number" ? value : null;
const getBooleanValue = (value) => typeof value === "boolean" ? value : false;
function noteReducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return {
        ...state,
        loading: true,
        error: null
      };
    case "LOAD_ERROR":
      return {
        ...state,
        loading: false,
        error: action.error
      };
    case "LOAD_DONE":
      return {
        loading: false,
        error: null,
        note: action.note,
        taskData: action.taskData,
        relatedNotes: action.relatedNotes
      };
    case "NOTE_UPDATED":
      return {
        ...state,
        note: action.note
      };
  }
}
function lifecycleReducer(state, action) {
  switch (action.type) {
    case "RESET":
      return {
        pendingPromotionToken: "",
        pendingPromotionExpiry: null,
        busy: null,
        message: null,
        isError: false
      };
    case "BUSY":
      return {
        ...state,
        busy: action.op,
        message: null,
        isError: false
      };
    case "MESSAGE":
      return {
        ...state,
        message: action.message,
        isError: action.isError ?? false
      };
    case "DONE":
      return {
        ...state,
        busy: null
      };
    case "ERROR":
      return {
        ...state,
        busy: null,
        isError: true,
        message: action.message
      };
    case "PROMOTION_PENDING":
      return {
        ...state,
        pendingPromotionToken: action.token,
        pendingPromotionExpiry: action.expiresAt,
        message: action.message,
        isError: false
      };
    case "PROMOTION_CLEAR":
      return {
        ...state,
        pendingPromotionToken: "",
        pendingPromotionExpiry: null
      };
    case "PROMOTION_EXPIRED":
      return {
        ...state,
        pendingPromotionToken: "",
        pendingPromotionExpiry: null,
        message: "Promote confirmation expired. Click Promote again to re-arm it.",
        isError: false
      };
  }
}
function reviewReducer(state, action) {
  switch (action.type) {
    case "SET_DECISION":
      return {
        ...state,
        decision: action.decision
      };
    case "SET_COMMENT":
      return {
        ...state,
        comment: action.comment
      };
    case "SUBMIT_START":
      return {
        ...state,
        submitting: true,
        message: null
      };
    case "SUBMIT_DONE":
      return {
        ...state,
        submitting: false,
        comment: "",
        message: action.message
      };
    case "SUBMIT_FAIL":
      return {
        ...state,
        submitting: false,
        message: action.message
      };
  }
}
function NoteRoute() {
  const {
    p
  } = Route.useSearch();
  const navigate = useNavigate();
  const [{
    note,
    relatedNotes,
    loading,
    error,
    taskData
  }, dispatchNote] = useReducer(noteReducer, {
    note: null,
    relatedNotes: [],
    loading: true,
    error: null,
    taskData: null
  });
  const [lc, dispatchLc] = useReducer(lifecycleReducer, {
    pendingPromotionToken: "",
    pendingPromotionExpiry: null,
    busy: null,
    message: null,
    isError: false
  });
  const [review, dispatchReview] = useReducer(reviewReducer, {
    decision: "approve",
    comment: "",
    submitting: false,
    message: null
  });
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!lc.pendingPromotionExpiry) return void 0;
    const expiresAtMs = Date.parse(lc.pendingPromotionExpiry);
    if (!Number.isFinite(expiresAtMs)) return void 0;
    const delayMs = Math.max(expiresAtMs - Date.now(), 0);
    const timer = window.setTimeout(() => {
      dispatchLc({
        type: "PROMOTION_EXPIRED"
      });
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [lc.pendingPromotionExpiry]);
  useEffect(() => {
    const requestedPath = toNoteSearchPath(p);
    const fetchNote = async () => {
      if (!requestedPath) {
        dispatchNote({
          type: "LOAD_ERROR",
          error: "No note path specified. Use ?p=folder/note-name"
        });
        return;
      }
      dispatchNote({
        type: "LOAD_START"
      });
      dispatchLc({
        type: "RESET"
      });
      const apiPath = toApiNotePath(requestedPath);
      const encodedPath = encodeURIComponent(apiPath);
      try {
        const response = await apiFetch(`/api/v1/notes/${encodedPath}`);
        if (!response.ok) {
          throw new Error(`Note not found: ${requestedPath}`);
        }
        const result = await response.json();
        const structured = result.structuredContent || {};
        const frontmatter = structured.frontmatter || {};
        const resolvedPath = getStringValue(structured.path) || apiPath;
        const rawContent = getStringValue(structured.content) || "";
        const lifecycle = getLifecycleContext(resolvedPath, frontmatter);
        const loadedNote = {
          path: resolvedPath,
          searchPath: stripMarkdownExtension(resolvedPath),
          title: getStringValue(frontmatter.title) || formatNoteLabel(stripMarkdownExtension(resolvedPath).split("/").pop() || ""),
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map((tag) => String(tag)) : [],
          collection: getNoteCollection(resolvedPath),
          content: rawContent,
          html: renderNoteMarkdown(rawContent),
          frontmatter,
          lifecycle
        };
        let loadedTaskData = null;
        if (lifecycle.isTask) {
          try {
            const taskResponse = await apiFetch(`/api/v1/tasks/${encodedPath}`);
            if (taskResponse.ok) {
              const taskResult = await taskResponse.json();
              loadedTaskData = taskResult.structuredContent || taskResult;
            }
          } catch {
            loadedTaskData = null;
          }
        }
        let loadedRelated = [];
        try {
          const relatedResponse = await apiFetch(`/api/v1/graph/related/${encodedPath}?limit=8`);
          if (relatedResponse.ok) {
            const relatedResult = await relatedResponse.json();
            loadedRelated = relatedResult?.structuredContent?.related ?? relatedResult?.related ?? [];
          }
        } catch {
          loadedRelated = [];
        }
        dispatchNote({
          type: "LOAD_DONE",
          note: loadedNote,
          taskData: loadedTaskData,
          relatedNotes: loadedRelated
        });
      } catch (err) {
        dispatchNote({
          type: "LOAD_ERROR",
          error: err.message
        });
      }
    };
    void fetchNote();
  }, [p]);
  const handleCopyPath = () => {
    if (!note) return;
    navigator.clipboard.writeText(note.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const handleOpenInObsidian = () => {
    if (!note) return;
    const vaultName = "vault";
    const obsidianUrl = `obsidian://open?vault=${vaultName}&file=${encodeURIComponent(note.searchPath)}.md`;
    window.open(obsidianUrl, "_blank");
  };
  const handleShare = async () => {
    if (!note) return;
    const shareUrl = `${window.location.origin}${toNoteHref(note.searchPath)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          url: shareUrl
        });
        return;
      } catch {
      }
    }
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const handleReviewSubmit = async () => {
    if (!note) return;
    dispatchReview({
      type: "SUBMIT_START"
    });
    try {
      const body = {
        path: note.path,
        addHistoryNote: `Review (${review.decision}): ${review.comment || "No comment provided."}`,
        frontmatterPatch: {
          review_status: review.decision,
          review_updated: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      const res = await apiFetch("/api/v1/tools/obsidian_update_task/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      const nextFrontmatter = {
        ...note.frontmatter,
        review_status: review.decision,
        review_updated: (/* @__PURE__ */ new Date()).toISOString()
      };
      dispatchNote({
        type: "NOTE_UPDATED",
        note: {
          ...note,
          frontmatter: nextFrontmatter,
          lifecycle: getLifecycleContext(note.path, nextFrontmatter)
        }
      });
      dispatchReview({
        type: "SUBMIT_DONE",
        message: "Review recorded via Tasker API."
      });
    } catch (err) {
      dispatchReview({
        type: "SUBMIT_FAIL",
        message: `Failed to record review: ${err.message}`
      });
    }
  };
  const handlePromote = async () => {
    if (!note) return;
    if (!note.lifecycle.runId) {
      dispatchLc({
        type: "MESSAGE",
        message: "Missing run id for this staged note.",
        isError: true
      });
      return;
    }
    dispatchLc({
      type: "BUSY",
      op: "promote"
    });
    try {
      const res = await apiFetch(`/api/v1/inbox/${encodeURIComponent(note.lifecycle.runId)}/commit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: lc.pendingPromotionToken || void 0
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }
      const status = body?.structuredContent?.status ?? body?.status;
      if (status === "pending_confirmation") {
        dispatchLc({
          type: "PROMOTION_PENDING",
          token: body?.structuredContent?.token ?? body?.token ?? "",
          expiresAt: body?.structuredContent?.expiresAt ?? body?.expiresAt ?? null,
          message: body?.structuredContent?.message ?? body?.message ?? "Confirmation armed. Click Promote again to confirm."
        });
        return;
      }
      dispatchLc({
        type: "PROMOTION_CLEAR"
      });
      dispatchLc({
        type: "MESSAGE",
        message: "Promotion complete. Opening the canonical note."
      });
      const targetPath = note.lifecycle.targetPath;
      if (targetPath) {
        navigate({
          to: "/note",
          search: {
            p: stripMarkdownExtension(targetPath)
          }
        });
      }
    } catch (err) {
      dispatchLc({
        type: "ERROR",
        message: err.message
      });
    } finally {
      dispatchLc({
        type: "DONE"
      });
    }
  };
  const handleReject = async () => {
    if (!note) return;
    if (!note.lifecycle.runId) {
      dispatchLc({
        type: "MESSAGE",
        message: "Missing run id for this staged note.",
        isError: true
      });
      return;
    }
    dispatchLc({
      type: "BUSY",
      op: "reject"
    });
    try {
      const res = await apiFetch(`/api/v1/inbox/${encodeURIComponent(note.lifecycle.runId)}`, {
        method: "DELETE"
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }
      const quarantinedPath = body?.structuredContent?.quarantinedPath ?? body?.quarantinedPath ?? null;
      dispatchLc({
        type: "MESSAGE",
        message: "Moved to rejected queue."
      });
      if (typeof quarantinedPath === "string" && quarantinedPath.length > 0) {
        navigate({
          to: "/note",
          search: {
            p: stripMarkdownExtension(quarantinedPath)
          }
        });
      }
    } catch (err) {
      dispatchLc({
        type: "ERROR",
        message: err.message
      });
    } finally {
      dispatchLc({
        type: "DONE"
      });
    }
  };
  const handleCompleteTask = async () => {
    if (!note) return;
    dispatchLc({
      type: "BUSY",
      op: "complete"
    });
    try {
      const res = await apiFetch(`/api/v1/tasks/${encodeURIComponent(note.path)}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "completed"
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }
      const updatedPath = getStringValue(body?.structuredContent?.path) || getStringValue(body?.path) || null;
      const nextPath = updatedPath || note.path;
      const nextFrontmatter = {
        ...note.frontmatter,
        status: "completed"
      };
      dispatchNote({
        type: "NOTE_UPDATED",
        note: {
          ...note,
          frontmatter: nextFrontmatter,
          path: nextPath,
          searchPath: stripMarkdownExtension(nextPath),
          lifecycle: getLifecycleContext(nextPath, nextFrontmatter)
        }
      });
      if (updatedPath && updatedPath !== note.path) {
        dispatchLc({
          type: "MESSAGE",
          message: "Task completed and archived. Opening the updated note location."
        });
        navigate({
          to: "/note",
          search: {
            p: stripMarkdownExtension(updatedPath)
          }
        });
        return;
      }
      dispatchLc({
        type: "MESSAGE",
        message: "Task completed. Handler-side archive rules will move it out of notes/tasks when the completion flow finishes."
      });
    } catch (err) {
      dispatchLc({
        type: "ERROR",
        message: err.message
      });
    } finally {
      dispatchLc({
        type: "DONE"
      });
    }
  };
  const noteSpecPath = note ? getStringValue(note.frontmatter.spec_path) : null;
  const noteStatus = note ? getStringValue(note.frontmatter.status) : null;
  const noteEstimatedTimeMin = note ? getNumberValue(note.frontmatter.estimatedTimeMin) : null;
  const noteEffortScore = note ? getNumberValue(note.frontmatter.effortScore) : null;
  const noteGoalId = note ? getStringValue(note.frontmatter.goalId) : null;
  const isDelegatable = note ? getBooleanValue(note.frontmatter.delegatable) : false;
  const sanitizeOptions = {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "code", "pre", "kbd", "mark", "details", "summary", "table", "thead", "tbody", "tr", "th", "td"],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      code: ["class"],
      pre: ["class"],
      "*": ["class", "id"]
    }
  };
  return /* @__PURE__ */ jsxs("main", { className: "px-4 sm:px-6 pb-12 pt-6 max-w-[1440px] mx-auto space-y-6", children: [
    /* @__PURE__ */ jsx("nav", { children: /* @__PURE__ */ jsx(Link, { to: "/", search: {
      q: void 0,
      collection: void 0
    }, className: "inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 transition-colors", children: "← Back to vault" }) }),
    note && /* @__PURE__ */ jsx(NoteHeader, { display: toNoteHeaderDisplay({
      title: note.title,
      type: getStringValue(note.frontmatter.type),
      status: noteStatus,
      path: note.path
    }), extraActions: /* @__PURE__ */ jsxs(Fragment, { children: [
      note.lifecycle.canPromote && /* @__PURE__ */ jsx(PrimaryButton, { onClick: handlePromote, disabled: lc.busy !== null, children: lc.pendingPromotionToken ? "Confirm Promote" : "Promote" }),
      note.lifecycle.canReject && /* @__PURE__ */ jsx(SecondaryButton, { onClick: handleReject, disabled: lc.busy !== null, className: "text-danger hover:bg-red-50", children: "Reject" }),
      note.lifecycle.canComplete && /* @__PURE__ */ jsx(SecondaryButton, { onClick: handleCompleteTask, disabled: lc.busy !== null, children: "Complete & Archive" }),
      /* @__PURE__ */ jsx(SecondaryButton, { onClick: handleCopyPath, children: copied ? "Copied!" : "Copy Path" }),
      /* @__PURE__ */ jsx(SecondaryButton, { onClick: () => void handleShare(), children: "Share" }),
      /* @__PURE__ */ jsx(SecondaryButton, { onClick: handleOpenInObsidian, children: "Open in Obsidian" }),
      noteSpecPath && /* @__PURE__ */ jsx(SecondaryButton, { onClick: () => navigate({
        to: "/note",
        search: {
          p: stripMarkdownExtension(noteSpecPath)
        }
      }), children: "Open Spec" })
    ] }) }),
    lc.message && /* @__PURE__ */ jsx("p", { className: `text-sm px-1 ${lc.isError ? "text-red-500" : "text-neutral-500"}`, children: lc.message }),
    lc.pendingPromotionExpiry && /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-400 px-1", children: [
      "Promotion window expires at ",
      lc.pendingPromotionExpiry,
      "."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-6", children: [
      /* @__PURE__ */ jsx("div", { className: "col-span-12 lg:col-span-8", children: /* @__PURE__ */ jsxs(SoftPanel, { children: [
        loading && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16", children: [
          /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-full border-2 border-neutral-200 border-t-blue-500 animate-spin mb-3" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-400", children: "Loading note…" })
        ] }),
        !loading && error && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16", children: [
          /* @__PURE__ */ jsx("span", { className: "text-3xl mb-3", children: "📄" }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-neutral-900 mb-1", children: "Note not found" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-500 mb-4", children: error }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx(PrimaryButton, { onClick: () => navigate({
              to: "/",
              search: {
                q: void 0,
                collection: void 0
              }
            }), children: "Return to Vault" }),
            /* @__PURE__ */ jsx(SecondaryButton, { onClick: () => window.location.reload(), children: "Try Again" })
          ] })
        ] }),
        !loading && !error && note && /* @__PURE__ */ jsxs(Fragment, { children: [
          note.lifecycle.isTask && taskData?.metrics && /* @__PURE__ */ jsxs("div", { className: "mb-6 p-4 rounded-xl bg-neutral-50 border border-neutral-200", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-neutral-700", children: "Task Progress" }),
              taskData.metrics.currentMilestone !== void 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs text-blue-600 font-medium", children: [
                taskData.metrics.currentMilestone,
                "% complete"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-full bg-slate-200 rounded-full h-1.5 mb-3", children: /* @__PURE__ */ jsx("div", { className: "bg-blue-500 h-full rounded-full transition-all", style: {
              width: `${taskData.metrics.currentMilestone ?? 0}%`
            } }) }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 text-center", children: [
              taskData.metrics.effortRemaining !== void 0 && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-neutral-900", children: taskData.metrics.effortRemaining }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-wide text-neutral-400", children: "Effort Left" })
              ] }),
              taskData.metrics.estimatedCompletionMin !== void 0 && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("p", { className: "text-base font-bold text-neutral-900", children: [
                  taskData.metrics.estimatedCompletionMin,
                  "m"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-wide text-neutral-400", children: "Est. Time" })
              ] }),
              taskData.metrics.rewardPotential !== void 0 && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("p", { className: "text-base font-bold text-neutral-900", children: [
                  (taskData.metrics.rewardPotential * 100).toFixed(0),
                  "%"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-wide text-neutral-400", children: "Reward" })
              ] })
            ] })
          ] }),
          (noteEstimatedTimeMin !== null || noteEffortScore !== null || noteGoalId || isDelegatable) && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 mb-4 text-xs text-neutral-500", children: [
            noteEstimatedTimeMin !== null && /* @__PURE__ */ jsxs("span", { children: [
              "~",
              noteEstimatedTimeMin,
              " min"
            ] }),
            noteEffortScore !== null && /* @__PURE__ */ jsxs("span", { children: [
              "Effort ",
              noteEffortScore,
              "/10"
            ] }),
            noteGoalId && /* @__PURE__ */ jsxs(Link, { to: "/note", search: {
              p: noteGoalId
            }, className: "text-blue-500 hover:opacity-80 transition-opacity", children: [
              "Goal → ",
              formatNoteLabel(noteGoalId)
            ] }),
            isDelegatable && /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-500", children: "delegatable" })
          ] }),
          /* @__PURE__ */ jsx(NoteBodyRenderer, { html: sanitizeHtml(note.html, sanitizeOptions) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "col-span-12 lg:col-span-4 space-y-4", children: note && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(NoteMetaRail, { frontmatter: note.frontmatter, lifecycle: note.lifecycle, relatedNotes, path: note.path }),
        note.lifecycle.canReview && /* @__PURE__ */ jsxs(SoftPanel, { title: "Task Review", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-neutral-400 mb-3", children: note.lifecycle.reviewStatus ? `Current: ${note.lifecycle.reviewStatus}` : "No review yet" }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-3 mb-3 flex-wrap", children: ["approve", "needs_changes"].map((val) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer text-xs text-neutral-700", children: [
            /* @__PURE__ */ jsx("input", { type: "radio", name: "review-decision", value: val, checked: review.decision === val, onChange: () => dispatchReview({
              type: "SET_DECISION",
              decision: val
            }), className: "accent-blue-500" }),
            val === "approve" ? "Approve" : "Needs changes"
          ] }, val)) }),
          /* @__PURE__ */ jsx("textarea", { className: "w-full bg-neutral-50 text-neutral-700 text-xs rounded-xl p-2.5 border border-neutral-200 focus:outline-none focus:border-blue-300 resize-none", placeholder: "Add a short review comment", rows: 3, value: review.comment, onChange: (e) => dispatchReview({
            type: "SET_COMMENT",
            comment: e.target.value
          }) }),
          /* @__PURE__ */ jsx(PrimaryButton, { onClick: () => void handleReviewSubmit(), disabled: review.submitting || lc.busy !== null, className: "mt-2 w-full", children: review.submitting ? "Submitting…" : "Submit review" }),
          review.message && /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 mt-2", children: review.message })
        ] }),
        note.lifecycle.isTask && !note.lifecycle.canComplete && noteStatus === "completed" && /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 px-1", children: "Completed tasks archive through the existing handler flow." }),
        !note.lifecycle.isTask && note.lifecycle.source === "canonical" && /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 px-1", children: "Archive actions for canonical notes are not yet supported." })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("footer", { className: "pt-6 border-t border-neutral-100 flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", search: {
        q: void 0,
        collection: void 0
      }, className: "text-xs text-neutral-400 hover:text-neutral-600 transition-colors", children: "← Back to Vault" }),
      note?.collection === "tasks" && /* @__PURE__ */ jsx(Link, { to: "/goals", className: "text-xs text-neutral-400 hover:text-neutral-600 transition-colors", children: "View Goals →" })
    ] }) })
  ] });
}
export {
  NoteRoute as component
};
