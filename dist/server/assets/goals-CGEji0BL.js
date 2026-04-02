import { jsxs, jsx } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { u as useHydrated, b as apiFetch, i as getApiBase, v as dispatchNavOverlay } from "./router-Dve3S_a4.js";
import "zustand";
import "clsx";
const getApiUrl = () => {
  const base = getApiBase();
  return base;
};
function calculateGoalStatus(progress, targetDate, hasBlockedTasks) {
  if (progress >= 100) return "completed";
  if (hasBlockedTasks && progress < 50) return "blocked";
  if (!targetDate) return "on-track";
  const now = /* @__PURE__ */ new Date();
  const target = new Date(targetDate);
  const daysUntilTarget = Math.ceil((target - now) / (1e3 * 60 * 60 * 24));
  const remainingProgress = 100 - progress;
  const progressPerDay = progress > 0 ? progress / 7 : 5;
  const daysToComplete = remainingProgress / progressPerDay;
  if (daysToComplete <= daysUntilTarget) return "on-track";
  if (daysToComplete <= daysUntilTarget + 7) return "at-risk";
  return "behind";
}
function useGoals() {
  const apiUrl = getApiUrl();
  const hydrated = useHydrated();
  const queryEnabled = hydrated;
  const tasksQuery = useQuery({
    queryKey: ["goals", "tasks", apiUrl],
    enabled: queryEnabled,
    staleTime: 3e4,
    retry: 1,
    queryFn: async () => {
      const tasksRes = await apiFetch("/api/v1/tasks?status=all&limit=1000");
      if (!tasksRes.ok) throw new Error("Failed to fetch tasks");
      const tasksData = await tasksRes.json();
      return tasksData.structuredContent?.tasks || tasksData.tasks || [];
    }
  });
  const tasks = tasksQuery.data || [];
  const loading = !hydrated || tasksQuery.isFetching;
  const error = tasksQuery.error ? tasksQuery.error instanceof Error ? tasksQuery.error.message : String(tasksQuery.error) : null;
  const apiStatus = tasksQuery.isError ? "offline" : tasksQuery.isSuccess ? "online" : "unknown";
  const updatedAt = tasksQuery.dataUpdatedAt > 0 ? new Date(tasksQuery.dataUpdatedAt).toISOString() : null;
  const goals = useMemo(() => {
    const activeTasks = tasks.filter((t) => {
      const p = (t.path || "").replace(/\\/g, "/");
      return !p.startsWith("archive/") && !p.startsWith("inbox/") && !p.startsWith("_archive/");
    });
    const normalizedTasks = activeTasks.map((t) => {
      const rawStatus = (t.status || "todo").toLowerCase();
      const status = rawStatus === "in_progress" ? "in-progress" : rawStatus === "done" ? "completed" : rawStatus;
      const effortScore = typeof t.effortScore === "number" && t.effortScore > 0 ? t.effortScore : typeof t.effort === "number" && t.effort > 0 ? t.effort : typeof t.estimatedTimeMin === "number" && t.estimatedTimeMin > 0 ? Math.max(1, Math.round(t.estimatedTimeMin / 15)) : 1;
      return { ...t, status, effortScore };
    });
    const sanitizeId = (raw) => String(raw).trim().replace(/^['"]/, "").replace(/['"]$/, "");
    const goalIdSet = /* @__PURE__ */ new Set();
    normalizedTasks.forEach((t) => {
      if (t.goalId) goalIdSet.add(sanitizeId(t.goalId));
      (t.tags || []).filter((tag) => String(tag).startsWith("goal:")).forEach(
        (tag) => goalIdSet.add(sanitizeId(String(tag).replace(/^goal:/, "")))
      );
    });
    const goalIds = Array.from(goalIdSet);
    return goalIds.map((goalId) => {
      const goalTasks = normalizedTasks.filter(
        (t) => t.goalId && sanitizeId(t.goalId) === goalId || (t.tags || []).some(
          (tag) => String(tag).startsWith("goal:") && sanitizeId(String(tag).replace(/^goal:/, "")) === goalId
        )
      );
      const completedTasks = goalTasks.filter(
        (t) => t.status === "completed"
      );
      const blockedTasks = goalTasks.filter((t) => t.status === "blocked");
      const inProgressTasks = goalTasks.filter(
        (t) => t.status === "in-progress"
      );
      const todoTasks = goalTasks.filter((t) => t.status === "todo");
      const totalEffort = goalTasks.reduce(
        (sum, t) => sum + (t.effortScore || 1),
        0
      );
      const completedEffort = completedTasks.reduce(
        (sum, t) => sum + (t.effortScore || 1),
        0
      );
      const progressByEffort = totalEffort > 0 ? Math.min(100, Math.round(completedEffort / totalEffort * 100)) : 0;
      const progressByCount = goalTasks.length > 0 ? Math.round(completedTasks.length / goalTasks.length * 100) : 0;
      const progress = totalEffort > 0 ? progressByEffort : Math.min(100, progressByCount);
      const title = goalId.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
      const maxPriority = Math.max(...goalTasks.map((t) => t.priority || 0));
      const dueDates = goalTasks.filter((t) => t.dueDate).map((t) => new Date(t.dueDate));
      const targetDate = dueDates.length > 0 ? new Date(Math.min(...dueDates)) : null;
      const status = calculateGoalStatus(
        progress,
        targetDate,
        blockedTasks.length > 0
      );
      const remainingEffort = totalEffort - completedEffort;
      const avgEffortPerDay = completedEffort > 0 ? completedEffort / 7 : 5;
      const daysRemaining = remainingEffort > 0 ? Math.ceil(remainingEffort / avgEffortPerDay) : 0;
      const eta = /* @__PURE__ */ new Date();
      eta.setDate(eta.getDate() + daysRemaining);
      return {
        id: goalId,
        title,
        priority: maxPriority,
        progress,
        progressByCount,
        status,
        targetDate: targetDate?.toISOString(),
        eta: progress < 100 ? eta.toISOString() : null,
        stats: {
          total: goalTasks.length,
          completed: completedTasks.length,
          inProgress: inProgressTasks.length,
          todo: todoTasks.length,
          blocked: blockedTasks.length,
          totalEffort,
          completedEffort,
          remainingEffort
        },
        tasks: goalTasks.sort((a, b) => {
          if (a.status === "completed" && b.status !== "completed") return 1;
          if (a.status !== "completed" && b.status === "completed") return -1;
          return (b.priority || 0) - (a.priority || 0);
        })
      };
    }).sort((a, b) => {
      if (a.progress >= 100 && b.progress < 100) return 1;
      if (a.progress < 100 && b.progress >= 100) return -1;
      return b.priority - a.priority;
    });
  }, [tasks]);
  return {
    goals,
    loading,
    error,
    apiStatus,
    updatedAt,
    refresh: () => tasksQuery.refetch()
  };
}
function StatusBadge({ status }) {
  const config = {
    "on-track": { emoji: "🟢", label: "On Track", className: "goal-badge--success" },
    "at-risk": { emoji: "🟡", label: "At Risk", className: "goal-badge--warning" },
    "behind": { emoji: "🔴", label: "Behind", className: "goal-badge--danger" },
    "blocked": { emoji: "⬛", label: "Blocked", className: "goal-badge--blocked" },
    "completed": { emoji: "✅", label: "Complete", className: "goal-badge--complete" }
  };
  const { emoji, label, className } = config[status] || config["on-track"];
  return /* @__PURE__ */ jsxs("span", { className: `goal-badge ${className}`, children: [
    emoji,
    " ",
    label
  ] });
}
function ProgressBar({ percent, status }) {
  const statusClass = {
    "on-track": "goal-progress__fill--success",
    "at-risk": "goal-progress__fill--warning",
    "behind": "goal-progress__fill--danger",
    "blocked": "goal-progress__fill--blocked",
    "completed": "goal-progress__fill--complete"
  };
  return /* @__PURE__ */ jsxs("div", { className: "goal-progress", children: [
    /* @__PURE__ */ jsx("div", { className: "goal-progress__track", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: `goal-progress__fill ${statusClass[status] || "goal-progress__fill--success"}`,
        style: { width: `${Math.min(percent, 100)}%` }
      }
    ) }),
    /* @__PURE__ */ jsxs("span", { className: "goal-progress__label", children: [
      percent,
      "%"
    ] })
  ] });
}
function TaskItem({ task }) {
  const statusIcon = {
    "completed": "✅",
    "in-progress": "🔄",
    "blocked": "🚫",
    "todo": "⬜"
  };
  return /* @__PURE__ */ jsxs("div", { className: `goal-task goal-task--${task.status}`, children: [
    /* @__PURE__ */ jsx("span", { className: "goal-task__icon", children: statusIcon[task.status] || "⬜" }),
    /* @__PURE__ */ jsx("span", { className: "goal-task__title", children: task.title }),
    task.effortScore && /* @__PURE__ */ jsxs("span", { className: "goal-task__effort", title: "Effort score", children: [
      task.effortScore,
      "⚡"
    ] })
  ] });
}
function formatDate(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function GoalCard({ goal }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);
  const {
    title,
    progress,
    status,
    stats,
    tasks,
    targetDate,
    eta,
    priority
  } = goal;
  const goalNotePath = `/note?p=${encodeURIComponent(`goals/${goal.id}`)}`;
  const hasTasks = Array.isArray(tasks) && tasks.length > 0;
  const firstTaskPath = hasTasks && tasks.find((t) => t.path)?.path;
  const submitReview = async (decision = "approve") => {
    if (!firstTaskPath) return;
    setReviewBusy(true);
    setReviewMsg(null);
    try {
      const body = {
        path: firstTaskPath,
        addHistoryNote: `Goal review (${decision}) for ${goal.id}`,
        frontmatterPatch: {
          review_status: decision,
          review_updated: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      const res = await apiFetch("/api/v1/tools/obsidian_update_task/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      setReviewMsg("Review sent to Tasker API");
    } catch (err) {
      setReviewMsg(`Review failed: ${err.message}`);
    } finally {
      setReviewBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: `goal-card goal-card--${status}`, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "goal-card__header",
        onClick: () => setExpanded(!expanded),
        role: "button",
        tabIndex: 0,
        onKeyDown: (e) => e.key === "Enter" && setExpanded(!expanded),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "goal-card__title-row", children: [
            /* @__PURE__ */ jsxs("h3", { className: "goal-card__title", children: [
              "🎯 ",
              title
            ] }),
            /* @__PURE__ */ jsx(StatusBadge, { status })
          ] }),
          /* @__PURE__ */ jsx(ProgressBar, { percent: progress, status }),
          /* @__PURE__ */ jsxs("div", { className: "goal-card__stats", children: [
            /* @__PURE__ */ jsxs("span", { className: "goal-card__stat", children: [
              stats.completed,
              "/",
              stats.total,
              " tasks"
            ] }),
            eta && status !== "completed" && /* @__PURE__ */ jsxs("span", { className: "goal-card__stat", children: [
              "ETA: ",
              formatDate(eta)
            ] }),
            targetDate && /* @__PURE__ */ jsxs("span", { className: "goal-card__stat", children: [
              "Target: ",
              formatDate(targetDate)
            ] }),
            priority && priority > 0 && /* @__PURE__ */ jsxs("span", { className: "goal-card__stat goal-card__stat--priority", children: [
              "P",
              priority
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "goal-card__expand", children: expanded ? "▼" : "▶" })
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsxs("div", { className: "goal-card__details", children: [
      /* @__PURE__ */ jsxs("div", { className: "goal-card__actions", children: [
        /* @__PURE__ */ jsx("a", { href: goalNotePath, className: "goal-card__link", children: "Open goal note" }),
        firstTaskPath && /* @__PURE__ */ jsx(
          "a",
          {
            href: `/note?p=${encodeURIComponent(firstTaskPath.replace(/\.md$/, ""))}`,
            className: "goal-card__link",
            children: "View task"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "goal-card__review", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "goal-card__review-btn",
              onClick: () => submitReview("approve"),
              disabled: reviewBusy || !firstTaskPath,
              children: "✅ Approve"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "goal-card__review-btn goal-card__review-btn--warn",
              onClick: () => submitReview("needs_changes"),
              disabled: reviewBusy || !firstTaskPath,
              children: "✋ Needs changes"
            }
          ),
          reviewMsg && /* @__PURE__ */ jsx("span", { className: "goal-card__review-msg", children: reviewMsg })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "goal-card__effort", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Effort: ",
          stats.completedEffort,
          "/",
          stats.totalEffort,
          " completed"
        ] }),
        stats.blocked && stats.blocked > 0 && /* @__PURE__ */ jsxs("span", { className: "goal-card__blocked", children: [
          stats.blocked,
          " blocked"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "goal-card__tasks", children: [
        /* @__PURE__ */ jsx("div", { className: "goal-card__tasks-header", children: "Tasks" }),
        tasks.map((task) => /* @__PURE__ */ jsx(TaskItem, { task }, task.id || task.path))
      ] })
    ] })
  ] });
}
const computeCounts = (goals) => ({
  all: goals.length,
  active: goals.filter((g) => g.status !== "completed").length,
  atRisk: goals.filter((g) => ["at-risk", "behind", "blocked"].includes(g.status)).length,
  completed: goals.filter((g) => g.status === "completed").length
});
const filterGoals = (goals, filter) => {
  switch (filter) {
    case "active":
      return goals.filter((g) => g.status !== "completed");
    case "at-risk":
      return goals.filter((g) => ["at-risk", "behind", "blocked"].includes(g.status));
    case "completed":
      return goals.filter((g) => g.status === "completed");
    default:
      return goals;
  }
};
const sortGoals = (goals, sortBy) => {
  const sorted = [...goals];
  switch (sortBy) {
    case "progress":
      return sorted.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    case "eta":
      return sorted.sort((a, b) => {
        if (!a.eta && !b.eta) return 0;
        if (!a.eta) return 1;
        if (!b.eta) return -1;
        return new Date(a.eta).getTime() - new Date(b.eta).getTime();
      });
    default:
      return sorted.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
};
const computeSummary = (goals) => {
  const totalTasks = goals.reduce((sum, g) => sum + (g.stats?.total || 0), 0);
  const completedTasks = goals.reduce((sum, g) => sum + (g.stats?.completed || 0), 0);
  const totalEffort = goals.reduce((sum, g) => sum + (g.stats?.totalEffort || 0), 0);
  const completedEffort = goals.reduce((sum, g) => sum + (g.stats?.completedEffort || 0), 0);
  const overallProgress = totalEffort > 0 ? Math.round(completedEffort / totalEffort * 100) : 0;
  return { totalTasks, completedTasks, totalEffort, completedEffort, overallProgress };
};
function FilterTabs({
  filter,
  setFilter,
  counts
}) {
  const tabs = [{
    key: "all",
    label: "All",
    count: counts.all
  }, {
    key: "active",
    label: "Active",
    count: counts.active
  }, {
    key: "at-risk",
    label: "At Risk",
    count: counts.atRisk
  }, {
    key: "completed",
    label: "Completed",
    count: counts.completed
  }];
  return /* @__PURE__ */ jsx("div", { className: "goals-filters", children: tabs.map((tab) => /* @__PURE__ */ jsxs("button", { className: `goals-filter ${filter === tab.key ? "goals-filter--active" : ""}`, onClick: () => setFilter(tab.key), children: [
    tab.label,
    tab.count > 0 && /* @__PURE__ */ jsx("span", { className: "goals-filter__count", children: tab.count })
  ] }, tab.key)) });
}
function GoalsSummary({
  goals
}) {
  const {
    totalTasks,
    completedTasks,
    totalEffort,
    completedEffort,
    overallProgress
  } = computeSummary(goals);
  return /* @__PURE__ */ jsxs("div", { className: "goals-summary", children: [
    /* @__PURE__ */ jsxs("div", { className: "goals-summary__stat", children: [
      /* @__PURE__ */ jsx("div", { className: "goals-summary__value", children: goals.length }),
      /* @__PURE__ */ jsx("div", { className: "goals-summary__label", children: "Goals" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "goals-summary__stat", children: [
      /* @__PURE__ */ jsxs("div", { className: "goals-summary__value", children: [
        completedTasks,
        "/",
        totalTasks
      ] }),
      /* @__PURE__ */ jsx("div", { className: "goals-summary__label", children: "Tasks Done" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "goals-summary__stat", children: [
      /* @__PURE__ */ jsxs("div", { className: "goals-summary__value", children: [
        overallProgress,
        "%"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "goals-summary__label", children: "Overall Progress" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "goals-summary__stat", children: [
      /* @__PURE__ */ jsxs("div", { className: "goals-summary__value", children: [
        completedEffort,
        "/",
        totalEffort
      ] }),
      /* @__PURE__ */ jsx("div", { className: "goals-summary__label", children: "Effort Complete" })
    ] })
  ] });
}
function GoalsRoute() {
  const {
    goals,
    loading,
    error,
    refresh,
    apiStatus,
    updatedAt
  } = useGoals();
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const counts = computeCounts(goals);
  const filteredGoals = filterGoals(goals, filter);
  const sortedGoals = sortGoals(filteredGoals, sortBy);
  return /* @__PURE__ */ jsxs("main", { className: "page goals-page", children: [
    /* @__PURE__ */ jsx("nav", { className: "breadcrumb", children: /* @__PURE__ */ jsx(Link, { to: "/", search: {}, className: "back-link", children: "← Home" }) }),
    /* @__PURE__ */ jsxs("header", { className: "page-header", children: [
      /* @__PURE__ */ jsx("h1", { children: "🎯 Goal Progress" }),
      /* @__PURE__ */ jsxs("p", { className: "lede", children: [
        "Track progress across all your goals and linked tasks. Data refreshes from Tasker API.",
        /* @__PURE__ */ jsx("span", { className: `api-badge api-badge--${apiStatus} ml-2`, children: apiStatus === "online" ? "API online" : apiStatus === "offline" ? "API offline" : "API" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "quick-links mt-3 pt-3", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/", search: {
          q: void 0,
          collection: void 0
        }, className: "quick-link quick-link--primary", title: "Open tasks filtered by goal tags", children: [
          /* @__PURE__ */ jsx("span", { className: "quick-link__icon", children: "📋" }),
          /* @__PURE__ */ jsx("span", { className: "quick-link__label", children: "Open Tasks" })
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "quick-link", title: "See avatar stats and goal impact", onClick: () => dispatchNavOverlay("avatar"), children: [
          /* @__PURE__ */ jsx("span", { className: "quick-link__icon", children: "🧙" }),
          /* @__PURE__ */ jsx("span", { className: "quick-link__label", children: "Avatar Dashboard" })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "quick-link", onClick: refresh, title: "Refresh from Tasker API", children: [
          /* @__PURE__ */ jsx("span", { className: "quick-link__icon", children: "🔄" }),
          /* @__PURE__ */ jsx("span", { className: "quick-link__label", children: loading ? "Refreshing…" : "Refresh" })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "quick-link quick-link--primary", onClick: () => setFilter("active"), title: "Focus on active goals", children: [
          /* @__PURE__ */ jsx("span", { className: "quick-link__icon", children: "🎯" }),
          /* @__PURE__ */ jsx("span", { className: "quick-link__label", children: "Show Active" })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "quick-link", onClick: () => setSortBy("progress"), title: "Sort by most progress", children: [
          /* @__PURE__ */ jsx("span", { className: "quick-link__icon", children: "📈" }),
          /* @__PURE__ */ jsx("span", { className: "quick-link__label", children: "Sort by Progress" })
        ] })
      ] })
    ] }),
    error && /* @__PURE__ */ jsxs("div", { className: "goals-error", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "⚠️ ",
        error
      ] }),
      /* @__PURE__ */ jsx("button", { className: "goals-retry", onClick: refresh, children: "Retry" })
    ] }),
    loading ? /* @__PURE__ */ jsxs("div", { className: "goals-loading", children: [
      /* @__PURE__ */ jsx("div", { className: "goals-loading__spinner" }),
      /* @__PURE__ */ jsx("span", { children: "Loading goals..." })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "goals-dashboard", children: [
      /* @__PURE__ */ jsx(GoalsSummary, { goals }),
      /* @__PURE__ */ jsxs("div", { className: "goals-toolbar", children: [
        /* @__PURE__ */ jsx(FilterTabs, { filter, setFilter, counts }),
        /* @__PURE__ */ jsxs("div", { className: "goals-sort", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "goal-sort", children: "Sort by:" }),
          /* @__PURE__ */ jsxs("select", { id: "goal-sort", value: sortBy, onChange: (e) => setSortBy(e.target.value), children: [
            /* @__PURE__ */ jsx("option", { value: "priority", children: "Priority" }),
            /* @__PURE__ */ jsx("option", { value: "progress", children: "Progress" }),
            /* @__PURE__ */ jsx("option", { value: "eta", children: "ETA" })
          ] })
        ] })
      ] }),
      sortedGoals.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "goals-empty", children: [
        /* @__PURE__ */ jsx("div", { className: "goals-empty__icon", children: "🎯" }),
        /* @__PURE__ */ jsx("h3", { className: "goals-empty__title", children: "No goals found" }),
        /* @__PURE__ */ jsx("p", { className: "goals-empty__text", children: filter !== "all" ? `No ${filter} goals match your criteria.` : "Create goals in your vault to track progress here." }),
        /* @__PURE__ */ jsxs("div", { className: "goals-empty__actions", children: [
          filter !== "all" && /* @__PURE__ */ jsx("button", { className: "goals-empty__btn", onClick: () => setFilter("all"), children: "Show all goals" }),
          /* @__PURE__ */ jsx(Link, { to: "/note", search: {
            p: "goals"
          }, className: "goals-empty__btn goals-empty__btn--primary", children: "📂 Browse Goals Folder" })
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "goals-list", children: sortedGoals.map((goal) => /* @__PURE__ */ jsx(GoalCard, { goal }, goal.id)) }),
      /* @__PURE__ */ jsxs("footer", { className: "goals-footer", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Last updated: ",
          updatedAt ? new Date(updatedAt).toLocaleTimeString() : "—"
        ] }),
        /* @__PURE__ */ jsx("button", { className: "goals-refresh", onClick: refresh, children: "🔄 Refresh" })
      ] })
    ] })
  ] });
}
export {
  GoalsRoute as component
};
