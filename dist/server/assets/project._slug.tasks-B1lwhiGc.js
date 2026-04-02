import { jsxs, jsx } from "react/jsx-runtime";
import React__default from "react";
import { Link } from "@tanstack/react-router";
import { a8 as Route, a2 as useAllTasks, a as SoftPanel } from "./router-Dve3S_a4.js";
import { E as EmptyState } from "./EmptyState-DhW0XD8j.js";
import { a as StatusPill, S as SoftChip } from "./Chips-CuvTXI26.js";
import "@tanstack/react-query";
import "zustand";
import "clsx";
const STATUS_ORDER = {
  backlog: 0,
  todo: 1,
  "in-progress": 2,
  blocked: 3,
  done: 4
};
function normalizeTaskStatus(status) {
  const normalized = status.toLowerCase();
  if (normalized === "in_progress") return "in-progress";
  if (normalized === "completed") return "done";
  if (normalized === "blocked") return "blocked";
  if (normalized === "backlog") return "backlog";
  if (normalized === "done") return "done";
  return "todo";
}
function sortTasks(a, b) {
  const statusDelta = STATUS_ORDER[normalizeTaskStatus(a.status)] - STATUS_ORDER[normalizeTaskStatus(b.status)];
  return b.priority - a.priority || statusDelta || a.title.localeCompare(b.title);
}
function buildTaskSearch(search, selectedId) {
  return {
    ...search,
    selectedId
  };
}
function ProjectTasksRoute() {
  const {
    slug
  } = Route.useParams();
  const search = Route.useSearch();
  const {
    data: allTasks = [],
    isLoading,
    error
  } = useAllTasks();
  const projectTasks = React__default.useMemo(() => allTasks.filter((task) => task.projectId === slug).sort(sortTasks), [allTasks, slug]);
  const selectedTask = projectTasks.find((task) => task.id === search.selectedId) ?? projectTasks[0] ?? null;
  const blockedTasks = React__default.useMemo(() => projectTasks.filter((task) => normalizeTaskStatus(task.status) === "blocked"), [projectTasks]);
  const taskSummary = React__default.useMemo(() => [{
    label: "Total",
    value: projectTasks.length
  }, {
    label: "Open",
    value: projectTasks.filter((task) => normalizeTaskStatus(task.status) !== "done").length
  }, {
    label: "Blocked",
    value: blockedTasks.length
  }, {
    label: "Selected",
    value: selectedTask ? 1 : 0
  }], [blockedTasks.length, projectTasks, selectedTask]);
  const selectedTaskTags = selectedTask?.tags ?? [];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-4", children: taskSummary.map((item) => /* @__PURE__ */ jsxs("div", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: item.label }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-2xl font-semibold text-slate-100", children: item.value })
    ] }, item.label)) }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]", children: [
      /* @__PURE__ */ jsx(SoftPanel, { variant: "elevated", title: "Task Queue", subtitle: "Choose a project task to inspect its detail and note link.", children: isLoading && !projectTasks.length ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Array.from({
        length: 3
      }).map((_, index) => /* @__PURE__ */ jsx("div", { className: "h-24 animate-pulse rounded-[18px] border border-white/8 bg-white/5" }, index)) }) : error && !projectTasks.length ? /* @__PURE__ */ jsx(EmptyState, { title: "Project tasks are temporarily unavailable.", description: "The project shell is intact. Retry once the task feed responds again." }) : projectTasks.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { title: "No tasks surfaced for this project.", description: "When scoped work lands, it will appear here with the selected task detail rail." }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: projectTasks.map((task) => {
        const active = selectedTask?.id === task.id;
        const taskStatus = normalizeTaskStatus(task.status);
        return /* @__PURE__ */ jsxs(Link, { to: "/project/$slug/tasks", params: {
          slug
        }, search: buildTaskSearch(search, task.id), className: ["block rounded-[18px] border p-4 transition", active ? "border-sky-300/40 bg-white/10 shadow-[0_18px_45px_rgba(56,189,248,0.14)]" : "border-white/8 bg-white/5 hover:border-white/12 hover:bg-white/8"].join(" "), children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-slate-100", children: task.title }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: task.estimatedTimeMin != null && task.estimatedTimeMin > 0 ? `${task.estimatedTimeMin}m estimated` : "No estimate yet" })
            ] }),
            /* @__PURE__ */ jsx(StatusPill, { status: taskStatus })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: task.tags?.slice(0, 4).map((tag) => /* @__PURE__ */ jsx(SoftChip, { label: tag }, tag)) })
        ] }, task.id);
      }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx(SoftPanel, { variant: "utility", title: "Selected Task", subtitle: "Detail, status, and the canonical task note link.", children: selectedTask ? /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold text-slate-100", children: selectedTask.title }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: selectedTask.estimatedTimeMin != null && selectedTask.estimatedTimeMin > 0 ? `${selectedTask.estimatedTimeMin}m estimate` : "No estimate yet" })
            ] }),
            /* @__PURE__ */ jsx(StatusPill, { status: normalizeTaskStatus(selectedTask.status) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Priority" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-2xl font-semibold text-slate-100", children: selectedTask.priority })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Project" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm font-medium text-slate-100", children: slug })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: selectedTaskTags.length ? selectedTaskTags.map((tag) => /* @__PURE__ */ jsx(SoftChip, { label: tag }, tag)) : /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "No tags yet." }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsx("a", { href: selectedTask.link, className: "text-sm font-semibold text-sky-100 underline decoration-sky-300/40 underline-offset-4", children: "Open task note" }),
            selectedTask.path ? /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: selectedTask.path }) : null
          ] })
        ] }) : /* @__PURE__ */ jsx(EmptyState, { title: "No task selected.", description: "Pick a task from the queue to inspect its detail rail." }) }),
        /* @__PURE__ */ jsx(SoftPanel, { variant: "utility", title: "Blockers", subtitle: "Tasks currently holding the project up.", children: blockedTasks.length ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: blockedTasks.map((task) => /* @__PURE__ */ jsx(Link, { to: "/project/$slug/tasks", params: {
          slug
        }, search: buildTaskSearch(search, task.id), className: "block rounded-[18px] border border-white/8 bg-white/5 p-4 transition hover:border-white/12 hover:bg-white/8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: task.title }),
            /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: task.estimatedTimeMin != null && task.estimatedTimeMin > 0 ? `${task.estimatedTimeMin}m estimated` : "No estimate yet" })
          ] }),
          /* @__PURE__ */ jsx(StatusPill, { status: "blocked" })
        ] }) }, task.id)) }) : /* @__PURE__ */ jsx(EmptyState, { title: "No blockers surfaced.", description: "Once a task stalls, it will appear here for faster triage." }) })
      ] })
    ] })
  ] });
}
export {
  ProjectTasksRoute as component
};
