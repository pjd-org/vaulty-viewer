import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useReducer, useCallback } from "react";
import { a as SoftPanel, P as PrimaryButton, q as SectionHeader, u as useHydrated, r as useStepExtractorQuery, b as apiFetch } from "./router-Dve3S_a4.js";
import { S as SoftChip } from "./Chips-CuvTXI26.js";
import { Link } from "@tanstack/react-router";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import "@tanstack/react-query";
import "zustand";
import "clsx";
const INTENT_TEMPLATES = [
  {
    id: "plan_next_step",
    label: "Plan next step",
    description: "Get ordered next actions for a goal or area.",
    fields: [
      {
        key: "goal",
        label: "Goal or area",
        placeholder: "e.g. finish viewer redesign, unblock promotion pipeline",
        required: true
      },
      {
        key: "constraints",
        label: "Constraints",
        placeholder: "e.g. max 2h, no breaking changes, only frontend",
        required: false
      }
    ],
    buildPrompt: (v) => [
      "[Intent: plan_next_step]",
      `Goal: ${v.goal ?? ""}`,
      v.constraints ? `Constraints: ${v.constraints}` : "",
      "Respond with: numbered next actions, brief reasoning per step, dependencies, estimated effort."
    ].filter(Boolean).join("\n")
  },
  {
    id: "review_spec",
    label: "Review spec / task",
    description: "Spot issues, gaps, and improvements in a spec or task.",
    fields: [
      {
        key: "spec",
        label: "Spec path or description",
        placeholder: "e.g. specs/viewer-redesign.md or paste the spec here",
        required: true,
        multiline: true
      }
    ],
    buildPrompt: (v) => [
      "[Intent: review_spec]",
      `Spec: ${v.spec ?? ""}`,
      "Respond with: issues found, gaps, improvements needed."
    ].join("\n")
  },
  {
    id: "debug_blocker",
    label: "Debug blocker",
    description: "Diagnose what is blocked and get exact next steps.",
    fields: [
      {
        key: "blocked",
        label: "What is blocked",
        placeholder: "e.g. session start always returns 404, API offline, test failing",
        required: true,
        multiline: true
      },
      {
        key: "tried",
        label: "What you have tried",
        placeholder: "e.g. checked logs, restarted service, verified env vars",
        required: false,
        multiline: true
      }
    ],
    buildPrompt: (v) => [
      "[Intent: debug_blocker]",
      `Blocked: ${v.blocked ?? ""}`,
      v.tried ? `Tried: ${v.tried}` : "",
      "Respond with: root cause hypothesis, missing pieces, exact next steps."
    ].filter(Boolean).join("\n")
  },
  {
    id: "generate_code",
    label: "Generate code",
    description: "Get implementation-ready code for a task.",
    fields: [
      {
        key: "task",
        label: "What to implement",
        placeholder: "e.g. add PATCH /tasks/:path/priority endpoint to API",
        required: true,
        multiline: true
      },
      {
        key: "context",
        label: "Context or constraints",
        placeholder: "e.g. TypeScript, Fastify, must not break existing tests",
        required: false
      }
    ],
    buildPrompt: (v) => [
      "[Intent: generate_code]",
      `Task: ${v.task ?? ""}`,
      v.context ? `Context: ${v.context}` : "",
      "Respond with: implementation-ready code first, then minimal explanation."
    ].filter(Boolean).join("\n")
  },
  {
    id: "summarize_state",
    label: "Summarize state",
    description: "Get current state, blockers, and recommended moves.",
    fields: [
      {
        key: "scope",
        label: "Scope or area",
        placeholder: "e.g. viewer, API, promotion pipeline, all (default)",
        required: false
      }
    ],
    buildPrompt: (v) => [
      "[Intent: summarize_state]",
      `Scope: ${v.scope?.trim() || "repo"}`,
      "Respond with: current state summary, key blockers, recommended next moves."
    ].join("\n")
  },
  {
    id: "freeform",
    label: "Free input",
    description: "Ask anything directly.",
    fields: [
      {
        key: "message",
        label: "Message",
        placeholder: "Ask Huey to plan, inspect, explain, or act...",
        required: true,
        multiline: true
      }
    ],
    buildPrompt: (v) => v.message ?? ""
  }
];
function getTemplate(id) {
  return INTENT_TEMPLATES.find((t) => t.id === id) ?? INTENT_TEMPLATES[INTENT_TEMPLATES.length - 1];
}
function buildHueyAgentServerRunPath(threadId) {
  return `/tensura/v1/agent-server/threads/${encodeURIComponent(threadId)}/runs`;
}
function parseHueyAgentServerRunResponse(payload, fallbackThreadId) {
  const threadId = payload?.thread?.id || payload?.threadId || payload?.thread_id || fallbackThreadId;
  const output = payload?.run?.output;
  const assistantText = output?.result?.trim() || payload?.result?.trim() || "Huey responded without text.";
  const nextAction = output?.next_action ?? payload?.next_action;
  const toolResultsDegraded = output?.tool_results_degraded ?? payload?.tool_results_degraded;
  const metaParts = [`Thread ${threadId}`];
  if (nextAction) metaParts.push(`Next: ${nextAction}`);
  if (toolResultsDegraded) metaParts.push("⚠ Degraded tools");
  return {
    threadId,
    assistantText,
    meta: metaParts.join(" · ")
  };
}
function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 6e4) return "just now";
  if (diff < 36e5) return `${Math.floor(diff / 6e4)}m ago`;
  if (diff < 864e5) return `${Math.floor(diff / 36e5)}h ago`;
  return `${Math.floor(diff / 864e5)}d ago`;
}
function groupByDate(threads) {
  const now = Date.now();
  const DAY = 864e5;
  const today = [];
  const yesterday = [];
  const older = [];
  for (const t of threads) {
    const age = now - t.timestamp;
    if (age < DAY) today.push(t);
    else if (age < 2 * DAY) yesterday.push(t);
    else older.push(t);
  }
  const groups = [];
  if (today.length) groups.push({ label: "Today", items: today });
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday });
  if (older.length) groups.push({ label: "Earlier", items: older });
  return groups;
}
function HueyContextRail({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  intentTemplates,
  activeIntent,
  onSelectIntent
}) {
  const groups = groupByDate(threads);
  return /* @__PURE__ */ jsxs(SoftPanel, { variant: "utility", className: "h-full flex flex-col gap-4 !p-5", children: [
    /* @__PURE__ */ jsx(PrimaryButton, { onClick: onNewThread, className: "w-full justify-center rounded-full", children: "New thread" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(SectionHeader, { title: "Intent", className: "mb-2" }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: intentTemplates.map((t) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => onSelectIntent(t.id),
          className: "appearance-none border-0 bg-transparent p-0 rounded-full",
          title: t.description,
          children: /* @__PURE__ */ jsx(
            SoftChip,
            {
              label: t.label,
              variant: activeIntent === t.id ? "primary" : "default",
              className: "cursor-pointer"
            }
          )
        },
        t.id
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 overflow-y-auto", children: [
      /* @__PURE__ */ jsx(SectionHeader, { title: "Recent", className: "mb-2" }),
      groups.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "No history yet." }),
      groups.map((group) => /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 uppercase tracking-wide mb-1", children: group.label }),
        group.items.map((thread) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => onSelectThread(thread.id),
            className: [
              "huey-thread-item w-full text-left text-sm truncate rounded-xl px-3 py-2.5 block transition-colors",
              thread.id === activeThreadId ? "huey-thread-item--active" : "huey-thread-item--idle"
            ].join(" "),
            title: `${thread.title} · ${formatRelativeTime(thread.timestamp)}`,
            children: [
              /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "mr-1", children: thread.emoji }),
              thread.title
            ]
          },
          thread.id
        ))
      ] }, group.label))
    ] })
  ] });
}
function renderMarkdown(content) {
  const raw = marked.parse(content, { async: false });
  return sanitizeHtml(raw, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "code", "pre", "kbd", "mark"],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      code: ["class"],
      pre: ["class"]
    }
  });
}
function PostResponseActions() {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 mt-3", children: [
    /* @__PURE__ */ jsx(Link, { to: "/", search: {}, className: "text-xs text-primary hover:underline", children: "View next actions →" }),
    /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        search: {},
        className: "text-xs text-primary hover:underline",
        onClick: () => {
          sessionStorage.setItem("huey-open-session", "1");
        },
        children: "Start session →"
      }
    ),
    /* @__PURE__ */ jsx(Link, { to: "/kanban", className: "text-xs text-primary hover:underline", children: "Open board →" })
  ] });
}
function HueyWorkspace({
  messages,
  loading,
  onSend,
  intentTemplate
}) {
  const [inputText, setInputText] = useState("");
  const listRef = useRef(null);
  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "assistant") return i;
    }
    return -1;
  })();
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);
  const handleSend = () => {
    const text = inputText.trim();
    if (!text || loading) return;
    setInputText("");
    onSend(text);
  };
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };
  return /* @__PURE__ */ jsxs(SoftPanel, { variant: "elevated", className: "h-full flex flex-col !p-5", children: [
    intentTemplate && /* @__PURE__ */ jsx("div", { className: "genie-surface genie-surface--utility rounded-2xl p-3 text-sm text-slate-700 mb-4 shrink-0", children: intentTemplate.description }),
    /* @__PURE__ */ jsxs("div", { ref: listRef, className: "flex-1 min-h-0 overflow-y-auto space-y-4 mb-4", children: [
      messages.length === 0 && !loading && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full gap-2 text-slate-600 py-12", children: [
        /* @__PURE__ */ jsx("span", { className: "text-4xl font-semibold text-slate-800", children: "H" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-700", children: "Hi! How can I help?" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Select an intent in the sidebar or just type below." })
      ] }),
      messages.map((msg, idx) => {
        if (msg.role === "system") {
          return /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 text-center py-2", children: msg.content }, msg.id);
        }
        if (msg.role === "user") {
          return /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx("div", { className: "genie-surface genie-surface--elevated genie-pill genie-layer-panel text-sm ml-auto max-w-[80%] text-right text-slate-800", children: msg.content }) }, msg.id);
        }
        const isHero = idx === lastAssistantIndex;
        return /* @__PURE__ */ jsxs("div", { className: "max-w-[85%]", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: [
                "genie-surface genie-card text-sm",
                isHero ? "genie-surface--hero genie-card--hero genie-layer-hero genie-halo" : "genie-surface--elevated genie-layer-panel"
              ].join(" "),
              children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "genie-content prose prose-sm max-w-none text-slate-800",
                  dangerouslySetInnerHTML: { __html: renderMarkdown(msg.content) }
                }
              )
            }
          ),
          msg.meta && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1 ml-2", children: msg.meta }),
          /* @__PURE__ */ jsx(PostResponseActions, {})
        ] }, msg.id);
      }),
      loading && /* @__PURE__ */ jsx("div", { className: "max-w-[85%]", children: /* @__PURE__ */ jsx("div", { className: "genie-surface genie-surface--elevated genie-card text-sm text-slate-600", children: "Thinking…" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "genie-surface genie-surface--overlay genie-layer-overlay genie-composer flex items-center gap-3 shrink-0", children: [
      /* @__PURE__ */ jsx(
        "textarea",
        {
          className: "flex-1 resize-none text-sm outline-none border-none shadow-none ring-0 bg-transparent text-slate-800 placeholder:text-slate-500",
          rows: 2,
          placeholder: "Ask me anything…",
          value: inputText,
          onChange: (e) => setInputText(e.target.value),
          onKeyDown: handleKeyDown,
          disabled: loading
        }
      ),
      /* @__PURE__ */ jsx(
        PrimaryButton,
        {
          onClick: handleSend,
          disabled: loading || !inputText.trim(),
          children: "Send"
        }
      )
    ] })
  ] });
}
const THREADS_STORAGE_KEY = "huey-threads";
const MAX_HISTORY = 40;
const INITIAL_THREAD_ID = "huey-thread-initial";
const INTENT_EMOJIS = {
  plan_next_step: "🧭",
  review_spec: "📋",
  debug_blocker: "🐛",
  generate_code: "⚡",
  summarize_state: "📊",
  freeform: "💬"
};
function loadThreads() {
  try {
    const raw = localStorage.getItem(THREADS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveThread(record) {
  try {
    const threads = loadThreads().filter((t) => t.id !== record.id);
    const updated = [record, ...threads].slice(0, MAX_HISTORY);
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
  }
}
function createThreadId() {
  return `huey-thread-${Date.now()}`;
}
function hueyReducer(state, action) {
  switch (action.type) {
    case "THREADS_REFRESHED":
      return {
        ...state,
        threads: action.threads
      };
    case "NEW_THREAD":
      return {
        ...state,
        threadId: action.threadId,
        messages: [],
        activeIntent: null
      };
    case "SWITCH_THREAD":
      return {
        ...state,
        threadId: action.threadId,
        messages: [],
        activeIntent: null
      };
    case "SEND_START":
      return {
        ...state,
        sending: true,
        threadId: action.threadId,
        threads: action.threads,
        messages: [...state.messages, action.userMsg]
      };
    case "SEND_DONE":
      return {
        ...state,
        sending: false,
        threadId: action.threadId,
        messages: [...state.messages, action.assistantMsg]
      };
    case "SEND_FAIL":
      return {
        ...state,
        sending: false,
        messages: [...state.messages, action.errorMsg]
      };
    case "SET_INTENT":
      return {
        ...state,
        activeIntent: action.intent
      };
  }
}
function createMessage(role, content, meta) {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    meta
  };
}
function HueyRoute() {
  const hydrated = useHydrated();
  const [{
    threads,
    messages,
    threadId,
    sending,
    activeIntent
  }, dispatch] = useReducer(hueyReducer, {
    threads: [],
    messages: [],
    threadId: INITIAL_THREAD_ID,
    sending: false,
    activeIntent: null
  });
  useEffect(() => {
    if (!hydrated) return;
    dispatch({
      type: "THREADS_REFRESHED",
      threads: loadThreads()
    });
    dispatch({
      type: "NEW_THREAD",
      threadId: createThreadId()
    });
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    const refresh = () => dispatch({
      type: "THREADS_REFRESHED",
      threads: loadThreads()
    });
    window.addEventListener("storage", refresh);
    window.addEventListener("huey-threads-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("huey-threads-updated", refresh);
    };
  }, [hydrated]);
  const newThread = useCallback(() => {
    dispatch({
      type: "NEW_THREAD",
      threadId: createThreadId()
    });
  }, []);
  const switchThread = useCallback((id) => {
    dispatch({
      type: "SWITCH_THREAD",
      threadId: id
    });
  }, []);
  const handleSend = async (text) => {
    if (!text.trim() || sending) return;
    const effectiveIntent = activeIntent ?? "freeform";
    const template = getTemplate(effectiveIntent);
    let prompt;
    let displayText;
    if (effectiveIntent === "freeform") {
      prompt = text;
      displayText = text;
    } else {
      const mainField = template.fields[0]?.key ?? "message";
      prompt = template.buildPrompt({
        [mainField]: text
      });
      displayText = `[${template.label}] ${text}`;
    }
    const effectiveThreadId = threadId === INITIAL_THREAD_ID ? createThreadId() : threadId;
    let nextThreadId = effectiveThreadId;
    let updatedThreads = threads;
    if (messages.length === 0) {
      const record = {
        id: effectiveThreadId,
        title: displayText.slice(0, 60),
        intent: activeIntent,
        emoji: INTENT_EMOJIS[effectiveIntent] ?? "💬",
        timestamp: Date.now()
      };
      saveThread(record);
      updatedThreads = loadThreads();
      window.dispatchEvent(new Event("huey-threads-updated"));
    }
    dispatch({
      type: "SEND_START",
      userMsg: createMessage("user", displayText),
      threadId: effectiveThreadId,
      threads: updatedThreads
    });
    try {
      const requestBody = {
        thread_id: effectiveThreadId,
        mode: "repo+spec",
        messages: [{
          role: "user",
          content: prompt
        }]
      };
      const response = await apiFetch(buildHueyAgentServerRunPath(effectiveThreadId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      let payload = await response.json().catch(() => null);
      if (!response.ok && (response.status === 429 || response.status >= 500)) {
        try {
          const fallbackBody = JSON.stringify({
            ...requestBody,
            mode: "repo+spec",
            model: "gpt-5-mini"
          });
          const fallbackResp = await apiFetch(buildHueyAgentServerRunPath(effectiveThreadId), {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: fallbackBody
          });
          payload = await fallbackResp.json().catch(() => null);
          if (fallbackResp.ok) {
            payload = {
              ...payload || {},
              threadId: payload?.threadId || payload?.thread_id || payload?.thread?.id || effectiveThreadId
            };
          }
        } catch {
        }
      }
      if (!response.ok && !payload) {
        throw new Error(`Huey request failed (${response.status})`);
      }
      const parsed = parseHueyAgentServerRunResponse(payload, effectiveThreadId);
      nextThreadId = parsed.threadId;
      dispatch({
        type: "SEND_DONE",
        assistantMsg: createMessage("assistant", parsed.assistantText, parsed.meta),
        threadId: nextThreadId
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Huey request failed";
      dispatch({
        type: "SEND_FAIL",
        errorMsg: createMessage("system", `Request failed: ${msg}`)
      });
    }
  };
  const lastAssistantText = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const {
    data: extractedSteps
  } = useStepExtractorQuery(lastAssistantText, {
    enabled: !sending && lastAssistantText.length > 80
  });
  return /* @__PURE__ */ jsxs("main", { className: "mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 pb-6 flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-7rem)] lg:h-[calc(100vh-7rem)]", children: [
    /* @__PURE__ */ jsx("div", { className: "w-full lg:w-[250px] shrink-0", children: /* @__PURE__ */ jsx(HueyContextRail, { threads, activeThreadId: threadId, onSelectThread: switchThread, onNewThread: newThread, intentTemplates: INTENT_TEMPLATES, activeIntent, onSelectIntent: (t) => dispatch({
      type: "SET_INTENT",
      intent: activeIntent === t ? null : t
    }) }) }),
    /* @__PURE__ */ jsx("div", { className: "w-full flex-1 min-w-0", children: /* @__PURE__ */ jsx(HueyWorkspace, { messages, loading: sending, onSend: handleSend, activeIntent, intentTemplate: activeIntent ? getTemplate(activeIntent) : null }) }),
    extractedSteps && extractedSteps.steps.length > 0 && /* @__PURE__ */ jsx("div", { className: "w-full lg:w-[300px] shrink-0 overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "genie-surface genie-surface--utility rounded-[28px] p-4 space-y-3", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-slate-500 uppercase tracking-wide", children: "Extracted steps" }),
      /* @__PURE__ */ jsx("ol", { className: "space-y-2", children: extractedSteps.steps.map((step, i) => /* @__PURE__ */ jsxs("li", { className: "text-sm space-y-0.5", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-slate-800", children: step.title }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-600", children: step.action }),
        step.expected_result && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500", children: [
          "→ ",
          step.expected_result
        ] })
      ] }, i)) })
    ] }) })
  ] });
}
export {
  HueyRoute as component
};
