import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import React__default, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { u as useHydrated, i as getApiBase, b as apiFetch, s as splitInboxNotes, j as computeInboxCounts, S as SecondaryButton, P as PrimaryButton, I as IconButton, k as useInboxSurface, l as Route, m as defaultInboxView, o as toInboxItemDisplay, p as useInboxConverterMutation } from "./router-Dve3S_a4.js";
import { S as SoftChip } from "./Chips-CuvTXI26.js";
import { E as EmptyState } from "./EmptyState-DhW0XD8j.js";
import { P as PageFrame } from "./PageFrame-Cq4YOB6Y.js";
import "zustand";
import "clsx";
function SegmentedControl({ options, value, onChange, className = "" }) {
  return /* @__PURE__ */ jsx("div", { className: `genie-surface genie-surface--utility flex items-center rounded-xl p-1 gap-1 ${className}`, children: options.map((opt) => {
    const isActive = opt.value === value;
    return /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => onChange(opt.value),
        className: `tab px-3 py-1.5 text-sm cursor-pointer transition-all rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${isActive ? "active font-medium" : "hover:text-slate-800"}`,
        children: opt.label
      },
      opt.value
    );
  }) });
}
function useInbox() {
  const [actionState, setActionState] = useState({});
  const [pendingConfirmations, setPendingConfirmations] = useState({});
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const base = getApiBase();
  const queryEnabled = hydrated;
  const queryKey = ["inbox", base];
  const clearPendingConfirmation = useCallback((runId) => {
    setPendingConfirmations((prev) => {
      if (!prev[runId]) return prev;
      const next = { ...prev };
      delete next[runId];
      return next;
    });
  }, []);
  const readCommitField = useCallback((body, field) => {
    if (!body || typeof body !== "object") return void 0;
    const structured = body?.structuredContent;
    if (structured && typeof structured === "object" && field in structured) {
      return structured[field];
    }
    return body[field];
  }, []);
  const inboxQuery = useQuery({
    queryKey,
    enabled: queryEnabled,
    staleTime: 1e4,
    retry: 1,
    queryFn: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12e3);
      try {
        const res = await apiFetch("/api/v1/inbox", {
          signal: controller.signal
        });
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }
        const body = await res.json().catch(() => ({}));
        const structured = body?.structuredContent;
        const notes2 = structured?.notes ?? body?.notes;
        const runs2 = structured?.runs ?? body?.runs;
        if (!Array.isArray(notes2) && !Array.isArray(runs2) && typeof body?.error === "string") {
          throw new Error(body.error);
        }
        return {
          notes: Array.isArray(notes2) ? notes2 : [],
          runs: Array.isArray(runs2) ? runs2 : []
        };
      } catch (error2) {
        if (error2 instanceof DOMException && error2.name === "AbortError") {
          throw new Error("Inbox request timed out");
        }
        throw error2;
      } finally {
        clearTimeout(timeout);
      }
    }
  });
  const commitMutation = useMutation({
    mutationFn: async ({ runId, token }) => {
      const commitToken = typeof token === "string" && token.trim().length > 0 ? token.trim() : "";
      const init = {
        method: "POST",
        ...commitToken ? {
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token: commitToken })
        } : {}
      };
      const res = await apiFetch(
        `/api/v1/inbox/${encodeURIComponent(runId)}/commit`,
        init
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `Commit failed: ${res.status}`);
      }
      const status = readCommitField(body, "status");
      const returnedToken = readCommitField(body, "token");
      if (status === "pending_confirmation" && !returnedToken) {
        throw new Error(
          readCommitField(body, "message") ?? "Promotion confirmation failed"
        );
      }
      return body;
    },
    onSuccess: async (body, variables) => {
      const runId = variables.runId;
      const status = readCommitField(body, "status");
      if (status === "pending_confirmation") {
        setActionState((prev) => {
          const next = { ...prev };
          delete next[runId];
          return next;
        });
        setPendingConfirmations((prev) => ({
          ...prev,
          [runId]: {
            token: readCommitField(body, "token"),
            expiresAt: readCommitField(body, "expiresAt"),
            message: readCommitField(body, "message")
          }
        }));
        return;
      }
      clearPendingConfirmation(runId);
      setActionState((prev) => {
        const next = { ...prev };
        delete next[runId];
        return next;
      });
      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          runs: (current.runs || []).filter((r) => r.runId !== runId)
        };
      });
      await queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
    onError: (errorObj, variables) => {
      if (variables?.token) {
        clearPendingConfirmation(variables.runId);
      }
      setActionState((prev) => ({ ...prev, [variables.runId]: "error" }));
    }
  });
  const rejectMutation = useMutation({
    mutationFn: async (runId) => {
      const res = await apiFetch(
        `/api/v1/inbox/${encodeURIComponent(runId)}`,
        {
          method: "DELETE"
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? `Reject failed: ${res.status}`);
      }
      return body;
    },
    onSuccess: async (body, runId) => {
      clearPendingConfirmation(runId);
      setActionState((prev) => {
        const next = { ...prev };
        delete next[runId];
        return next;
      });
      queryClient.setQueryData(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          runs: (current.runs || []).filter((r) => r.runId !== runId)
        };
      });
      await queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
    onError: (errorObj, runId) => {
      setActionState((prev) => ({ ...prev, [runId]: "error" }));
    }
  });
  const commitRun = useCallback(
    async (runId) => {
      const pending = pendingConfirmations[runId];
      const expiresAtMs = typeof pending?.expiresAt === "string" ? Date.parse(pending.expiresAt) : Number.NaN;
      const token = pending?.token && (!Number.isFinite(expiresAtMs) || expiresAtMs > Date.now()) ? pending.token : void 0;
      if (pending?.token && !token) {
        clearPendingConfirmation(runId);
      }
      setActionState((prev) => ({ ...prev, [runId]: "committing" }));
      return commitMutation.mutateAsync({ runId, token });
    },
    [clearPendingConfirmation, commitMutation, pendingConfirmations]
  );
  const rejectRun = useCallback(
    async (runId) => {
      clearPendingConfirmation(runId);
      setActionState((prev) => ({ ...prev, [runId]: "rejecting" }));
      return rejectMutation.mutateAsync(runId);
    },
    [clearPendingConfirmation, rejectMutation]
  );
  const notes = inboxQuery.data?.notes || [];
  const runs = inboxQuery.data?.runs || [];
  const { workbenchNotes, archiveNotes } = splitInboxNotes(notes);
  const counts = computeInboxCounts(runs, workbenchNotes, archiveNotes);
  const loading = !hydrated || (!inboxQuery.data || !Array.isArray(inboxQuery.data.notes)) && inboxQuery.isFetching;
  const error = inboxQuery.error ? inboxQuery.error instanceof Error ? inboxQuery.error.message : String(inboxQuery.error) : null;
  const apiStatus = inboxQuery.isError ? "offline" : inboxQuery.isSuccess ? "online" : "unknown";
  return {
    notes,
    runs,
    workbenchNotes,
    archiveNotes,
    counts,
    loading,
    error,
    apiStatus,
    refresh: () => inboxQuery.refetch(),
    commitRun,
    rejectRun,
    actionState,
    pendingConfirmations
  };
}
function InboxItemCard({ item, onInspect, onPromote, onReject }) {
  return /* @__PURE__ */ jsxs("div", { className: "genie-surface genie-surface--utility p-4 space-y-2 transition-transform duration-200 hover:-translate-y-0.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-800 flex-1 min-w-0 truncate", children: item.title }),
      /* @__PURE__ */ jsx(SoftChip, { label: item.originLabel, variant: "default" }),
      item.isBlocked && /* @__PURE__ */ jsx(SoftChip, { label: "Blocked", variant: "danger" }),
      item.ageLabel && /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 shrink-0", suppressHydrationWarning: true, children: item.ageLabel })
    ] }),
    item.contextSnippet && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 leading-relaxed line-clamp-2", children: item.contextSnippet }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(SecondaryButton, { onClick: onInspect, children: "Inspect" }),
      item.actions.includes("promote") && onPromote && /* @__PURE__ */ jsx(PrimaryButton, { onClick: onPromote, children: "Promote" }),
      onReject && /* @__PURE__ */ jsx(
        IconButton,
        {
          icon: /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "text-base leading-none", children: "×" }),
          label: "Reject",
          onClick: onReject,
          className: "text-slate-500 hover:text-red-500"
        }
      )
    ] })
  ] });
}
function InboxViewSwitcher({ view, onChange, counts }) {
  return /* @__PURE__ */ jsx(
    SegmentedControl,
    {
      value: view,
      onChange: (v) => onChange(v),
      options: [
        { value: "queue", label: `Queue (${counts.queue})` },
        { value: "workbench", label: `Workbench (${counts.workbench})` },
        { value: "archive", label: `Archive (${counts.archive})` }
      ]
    }
  );
}
function stripMarkdownExtension(path) {
  return path.endsWith(".md") ? path.slice(0, -3) : path;
}
function runToOriginSource(runType) {
  if (runType === "signals_infer") return "agent";
  if (runType === "conversation") return "llm";
  return runType ?? "manual";
}
function isArchiveBucket(bucket) {
  return bucket === "rejected_user" || bucket === "rejected_automated";
}
function inboxItemToDisplay(item, note, run) {
  const createdAt = note?.frontmatter?.created ?? note?.frontmatter?.createdAt ?? null;
  const source = item.rejectionType === "user" ? "manual" : note?.source === "extracted" ? "agent" : run ? runToOriginSource(run.runType) : item.inboxBucket === "deferred" || item.inboxBucket === "rejected_automated" ? "agent" : "manual";
  return toInboxItemDisplay({
    title: item.title,
    _source: source,
    _run_id: run?.runId,
    description: item.summary,
    createdAt: createdAt ?? item.surfacedAt,
    status: note?.status ?? (item.severity === "high" || item.severity === "critical" ? "blocked" : void 0)
  });
}
function ConvertPanel({
  runId,
  rawText
}) {
  const {
    mutate,
    data,
    isPending,
    error,
    reset
  } = useInboxConverterMutation();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  if (!data && !isPending && !error) {
    return /* @__PURE__ */ jsx("button", { type: "button", className: "text-xs text-slate-700 hover:text-slate-900 font-medium px-2 py-1 rounded-lg hover:bg-white/50 transition-colors", onClick: () => mutate(rawText), children: "✦ Convert to task" });
  }
  if (isPending) {
    return /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 px-2 py-1", children: "Converting…" });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("span", { className: "text-xs text-red-500 px-2 py-1", children: [
      "Failed —",
      " ",
      /* @__PURE__ */ jsx("button", { type: "button", className: "underline", onClick: () => {
        reset();
        mutate(rawText);
      }, children: "retry" })
    ] });
  }
  if (data) {
    return /* @__PURE__ */ jsxs("div", { className: "mt-2 genie-surface genie-surface--utility rounded-xl px-3 py-2 space-y-1", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-slate-800", children: data.title }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 text-xs text-slate-600", children: [
        /* @__PURE__ */ jsx("span", { children: data.duration }),
        /* @__PURE__ */ jsx("span", { children: "·" }),
        /* @__PURE__ */ jsx("span", { className: "capitalize", children: data.effort }),
        /* @__PURE__ */ jsx("span", { children: "·" }),
        /* @__PURE__ */ jsx("span", { className: "capitalize", children: data.type }),
        data.project && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("span", { children: "·" }),
          /* @__PURE__ */ jsx("span", { children: data.project })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "text-xs text-slate-500 hover:text-slate-800 mt-1", onClick: () => setDismissed(true), children: "Dismiss" })
    ] });
  }
  return null;
}
function InboxRoute() {
  const {
    runs,
    workbenchNotes,
    archiveNotes,
    apiStatus,
    refresh,
    commitRun,
    rejectRun,
    actionState
  } = useInbox();
  const {
    data: surface,
    isLoading: surfaceLoading,
    error: surfaceError
  } = useInboxSurface();
  const {
    view: viewParam,
    rejectedTab
  } = Route.useSearch();
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimerRef = useRef(null);
  const anyActionInFlight = Object.values(actionState).some((s) => s === "committing" || s === "rejecting");
  const surfaceItems = surface ?? [];
  const groupedItems = React__default.useMemo(() => {
    const queue = [];
    const workbench = [];
    const archive = [];
    surfaceItems.forEach((item) => {
      if (item.inboxBucket === "deferred") {
        workbench.push(item);
        return;
      }
      if (isArchiveBucket(item.inboxBucket)) {
        archive.push(item);
        return;
      }
      queue.push(item);
    });
    return {
      queue,
      workbench,
      archive
    };
  }, [surfaceItems]);
  const archiveItems = React__default.useMemo(() => {
    if (!rejectedTab) return groupedItems.archive;
    return groupedItems.archive.filter((item) => item.rejectionType === rejectedTab);
  }, [groupedItems.archive, rejectedTab]);
  const counts = React__default.useMemo(() => ({
    queue: groupedItems.queue.length,
    workbench: groupedItems.workbench.length,
    archive: groupedItems.archive.length
  }), [groupedItems]);
  const runById = React__default.useMemo(() => new Map(runs.map((run) => [run.runId, run])), [runs]);
  const noteByPath = React__default.useMemo(() => new Map([...workbenchNotes, ...archiveNotes].map((note) => [note.path, note])), [archiveNotes, workbenchNotes]);
  const loading = surfaceLoading && !surface;
  const error = surfaceError instanceof Error ? surfaceError.message : typeof surfaceError === "string" ? surfaceError : null;
  const activeView = viewParam ?? (loading ? "queue" : defaultInboxView(counts.queue));
  const setView = useCallback((v) => {
    navigate({
      to: "/inbox",
      search: {
        view: v
      },
      replace: true
    });
  }, [navigate]);
  const toast = useCallback((msg, isError = false) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg({
      msg,
      isError
    });
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 4e3);
  }, []);
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);
  const handleCommit = useCallback(async (runId) => {
    try {
      const result = await commitRun(runId);
      const status = result?.structuredContent?.status ?? result?.status ?? null;
      if (status === "pending_confirmation") {
        const expiresAt = result?.structuredContent?.expiresAt ?? result?.expiresAt;
        toast(expiresAt ? `Confirmation armed for ${runId}. Click Commit again before ${expiresAt}.` : `Confirmation armed for ${runId}. Click Commit again to promote.`);
        return;
      }
      const committed = result?.structuredContent?.committed ?? 0;
      const failed = result?.structuredContent?.failed ?? 0;
      const rejected = result?.structuredContent?.rejected ?? 0;
      if (failed > 0 || rejected > 0) {
        const parts = [];
        if (committed > 0) parts.push(`${committed} committed`);
        if (rejected > 0) parts.push(`${rejected} rejected`);
        if (failed > 0) parts.push(`${failed} failed`);
        toast(`Partial commit (${parts.join(", ")}) — refreshing`, committed === 0);
        refresh();
      } else {
        toast(`Committed ${committed} item${committed !== 1 ? "s" : ""} from ${runId}`);
      }
    } catch (err) {
      toast(err.message ?? "Commit failed", true);
    }
  }, [commitRun, refresh, toast]);
  const handleReject = useCallback(async (runId) => {
    try {
      const result = await rejectRun(runId);
      const rawErrors = result?.structuredContent?.errors ?? 0;
      const errorCount = Array.isArray(rawErrors) ? rawErrors.length : rawErrors;
      if (errorCount > 0) {
        toast(`Partial rejection: ${errorCount} item${errorCount !== 1 ? "s" : ""} could not be removed — refreshing`, true);
        refresh();
      } else {
        toast(`Rejected run ${runId}`);
      }
    } catch (err) {
      toast(err.message ?? "Reject failed", true);
    }
  }, [rejectRun, refresh, toast]);
  return /* @__PURE__ */ jsxs("main", { className: "inbox-page p-6 space-y-6", children: [
    toastMsg && /* @__PURE__ */ jsx("div", { className: `inbox-toast ${toastMsg.isError ? "inbox-toast--error" : "inbox-toast--ok"}`, role: "status", "aria-live": "polite", children: toastMsg.msg }),
    /* @__PURE__ */ jsxs(PageFrame, { title: "Inbox", subtitle: "Review staged proposals, triage workbench notes, or browse the rejected archive.", actions: /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("span", { className: `api-badge api-badge--${apiStatus}`, children: apiStatus === "online" ? "API online" : apiStatus === "offline" ? "API offline" : "API" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "btn-secondary rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-white/80 disabled:opacity-60", onClick: refresh, disabled: loading || anyActionInFlight, children: loading ? "Loading…" : "↻ Refresh" })
    ] }), children: [
      loading && /* @__PURE__ */ jsxs("div", { className: "inbox-state", children: [
        /* @__PURE__ */ jsx("div", { className: "inbox-spinner" }),
        /* @__PURE__ */ jsx("span", { children: "Loading inbox…" })
      ] }),
      !loading && error && /* @__PURE__ */ jsxs("div", { className: "inbox-state inbox-state--error", children: [
        /* @__PURE__ */ jsx("strong", { children: "Could not reach the API." }),
        /* @__PURE__ */ jsx("span", { children: error }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "btn btn--refresh", onClick: refresh, children: "Retry" })
      ] }),
      !loading && !error && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(InboxViewSwitcher, { view: activeView, onChange: setView, counts }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-3", children: [
          activeView === "queue" && groupedItems.queue.length === 0 && /* @__PURE__ */ jsx(EmptyState, { title: "Queue is clear", description: "No staged proposals waiting. Continue in Workbench →" }),
          activeView === "queue" && groupedItems.queue.map((item) => {
            const run = runById.get(item.sourceId);
            const inspectPath = run?.items[0]?.targetPath ?? run?.items[0]?.path;
            return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(InboxItemCard, { item: inboxItemToDisplay(item, void 0, run), onInspect: () => {
                const p = inspectPath;
                if (p) navigate({
                  to: "/note",
                  search: {
                    p: stripMarkdownExtension(p)
                  }
                });
              }, onPromote: run && run.runType !== "signals_infer" ? () => handleCommit(run.runId) : void 0, onReject: run ? () => handleReject(run.runId) : item.sourceId ? () => handleReject(item.sourceId) : void 0 }),
              run && /* @__PURE__ */ jsx(ConvertPanel, { runId: run.runId, rawText: `${run.runId}${run.action ? ` — ${run.action}` : ""}${run.templateRef ? ` (${run.templateRef})` : ""}` })
            ] }, item.id);
          }),
          activeView === "workbench" && groupedItems.workbench.length === 0 && /* @__PURE__ */ jsx(EmptyState, { title: "No draft or active inbox notes", description: "New notes will appear here when they arrive." }),
          activeView === "workbench" && groupedItems.workbench.map((item) => {
            const note = noteByPath.get(item.sourceId);
            const notePath = note?.path ?? item.sourceId;
            return /* @__PURE__ */ jsx(InboxItemCard, { item: inboxItemToDisplay(item, note), onInspect: () => navigate({
              to: "/note",
              search: {
                p: stripMarkdownExtension(notePath)
              }
            }) }, item.id);
          }),
          activeView === "archive" && archiveItems.length === 0 && /* @__PURE__ */ jsx(EmptyState, { title: rejectedTab === "user" ? "No user rejections" : rejectedTab === "automated" ? "No automated rejections" : "No rejected notes", description: "The archive is empty for the selected rejection tab." }),
          activeView === "archive" && archiveItems.map((item) => {
            const note = noteByPath.get(item.sourceId);
            const notePath = note?.path ?? item.sourceId;
            return /* @__PURE__ */ jsx(InboxItemCard, { item: inboxItemToDisplay(item, note), onInspect: () => navigate({
              to: "/note",
              search: {
                p: stripMarkdownExtension(notePath)
              }
            }) }, item.id);
          })
        ] })
      ] })
    ] })
  ] });
}
export {
  InboxRoute as component
};
