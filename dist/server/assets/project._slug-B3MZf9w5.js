import { jsx, jsxs } from "react/jsx-runtime";
import { useRouterState, Link, Outlet } from "@tanstack/react-router";
import React__default, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Z as projectSearchParams, _ as PROJECT_ROUTE_TABS, $ as getProjectTabPath, a0 as ProjectRouteShellProvider, a1 as getProjectQueryOptions, a2 as useAllTasks, a3 as useProjectSurface, a4 as toProjectSummaryDisplay, a as SoftPanel, q as SectionHeader, a5 as Route } from "./router-Dve3S_a4.js";
import { E as EmptyState } from "./EmptyState-DhW0XD8j.js";
import { S as SoftChip } from "./Chips-CuvTXI26.js";
import "./KnowledgeWorkspacePane-C4GxktGV.js";
import { P as PageContainer, S as SummaryRow } from "./SummaryRow-3HynMwwn.js";
import { P as PageFrame } from "./PageFrame-Cq4YOB6Y.js";
import "zustand";
import "clsx";
import "sanitize-html";
import "./NoteBodyRenderer-C6h_gm3u.js";
import "marked";
function ProjectRouteShell({
  slug,
  summaryItems = [],
  projectSurface = null,
  children
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const projectSearch = useRouterState({
    select: (state) => projectSearchParams(state.location.search)
  });
  const projectPath = `/project/${encodeURIComponent(slug)}`;
  const shellContext = React__default.useMemo(
    () => ({
      projectId: slug,
      projectPath,
      summaryItems,
      projectSurface
    }),
    [projectPath, projectSurface, slug, summaryItems]
  );
  return /* @__PURE__ */ jsx(PageContainer, { children: /* @__PURE__ */ jsxs(
    PageFrame,
    {
      title: `Project: ${slug}`,
      subtitle: "Scoped command center",
      actions: /* @__PURE__ */ jsx(
        Link,
        {
          to: "/work",
          search: { tab: void 0, status: void 0, selectedId: void 0 },
          className: "btn-secondary rounded-full px-4 py-2 text-sm font-medium text-slate-100",
          children: "Back to Work"
        }
      ),
      children: [
        /* @__PURE__ */ jsx("div", { className: "genie-surface genie-surface--utility rounded-[24px] p-2", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: PROJECT_ROUTE_TABS.map((tab) => {
          const to = getProjectTabPath(slug, tab.to);
          const active = pathname === to || to !== `/project/${slug}` && pathname.startsWith(`${to}/`);
          return /* @__PURE__ */ jsx(
            Link,
            {
              to: tab.to,
              params: { slug },
              search: projectSearch,
              className: [
                "tab rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active ? "active text-slate-100" : "text-slate-300"
              ].join(" "),
              children: tab.label
            },
            tab.label
          );
        }) }) }),
        /* @__PURE__ */ jsx(SummaryRow, { items: summaryItems }),
        /* @__PURE__ */ jsx(ProjectRouteShellProvider, { value: shellContext, children })
      ]
    }
  ) });
}
const SkeletonCard = ({ className = "" }) => {
  return /* @__PURE__ */ jsxs("div", { role: "status", "aria-busy": "true", "aria-label": "Loading content", className: `rounded-2xl bg-neutral-100 animate-pulse p-4 ${className}`, children: [
    /* @__PURE__ */ jsx("div", { className: "h-6 bg-neutral-200 rounded w-3/5 mb-3" }),
    /* @__PURE__ */ jsx("div", { className: "h-4 bg-neutral-200 rounded w-full mb-2" }),
    /* @__PURE__ */ jsx("div", { className: "h-4 bg-neutral-200 rounded w-4/5" })
  ] });
};
function toTitleCase(id) {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function computeStatus(counts, tasks) {
  if (counts.total > 0 && counts.done === counts.total) return "completed";
  if (counts.blocked > 0) return "blocked";
  if (counts.total > 0 && counts.done / counts.total > 0.7) return "active";
  if (tasks.some((t) => t.status === "at-risk")) return "at-risk";
  return "active";
}
function computeProgress(counts) {
  if (counts.total === 0) return 0;
  return Math.round(counts.done / counts.total * 100);
}
function deriveProjects(tasks) {
  const map = /* @__PURE__ */ new Map();
  for (const task of tasks) {
    const raw = task;
    const key = task.projectId || task.goalId || raw.project_id || raw.goal_id || raw.domain;
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(task);
  }
  const projects = [];
  for (const [id, group] of map.entries()) {
    const counts = {
      total: group.length,
      done: group.filter((t) => t.status === "completed").length,
      inProgress: group.filter((t) => t.status === "in-progress").length,
      blocked: group.filter((t) => t.status === "blocked").length,
      todo: group.filter((t) => t.status === "todo" || t.status === "backlog").length
    };
    const maxPriority = Math.max(...group.map((t) => t.priority || 0), 0);
    projects.push({
      id,
      title: toTitleCase(id),
      status: computeStatus(counts, group),
      progress: computeProgress(counts),
      priority: maxPriority,
      taskCounts: counts
    });
  }
  return projects;
}
function getProjectTasks(tasks, projectId) {
  return tasks.filter(
    (t) => t.projectId === projectId || t.goalId === projectId
  );
}
const EMPTY_EXECUTION_SNAPSHOT = {
  activeTasks: [],
  activePipelines: [],
  activeRunners: [],
  hueyJobs: [],
  scheduleItems: []
};
function ProjectDetailScene({ projectId }) {
  const { data: projectDisplay, isLoading: projectLoading } = useQuery({
    ...getProjectQueryOptions(projectId),
    enabled: !!projectId
  });
  const { data: allTasks = [], isLoading: tasksLoading } = useAllTasks();
  const projectTasks = useMemo(
    () => getProjectTasks(allTasks, projectId),
    [allTasks, projectId]
  );
  const projects = useMemo(() => deriveProjects(allTasks), [allTasks]);
  const derivedProject = projects.find((project2) => project2.id === projectId);
  const project = useMemo(() => {
    if (projectDisplay) {
      return {
        id: projectDisplay.id,
        title: projectDisplay.title,
        status: projectDisplay.statusVariant === "success" ? "completed" : "active",
        progress: (projectDisplay.progressPercent ?? 0) / 100,
        priority: derivedProject?.priority ?? 0,
        taskCounts: derivedProject?.taskCounts ?? {
          total: projectTasks.length,
          done: projectTasks.filter((task) => task.status === "done").length,
          inProgress: projectTasks.filter((task) => task.status === "in-progress").length,
          blocked: projectTasks.filter((task) => task.status === "blocked").length,
          todo: projectTasks.filter(
            (task) => !["done", "in-progress", "blocked"].includes(task.status)
          ).length
        }
      };
    }
    return derivedProject;
  }, [derivedProject, projectDisplay, projectTasks]);
  const { data: displaySurface } = useProjectSurface(projectId);
  const pressureSignals = displaySurface?.pressureBand ?? [];
  const decisionQueue = displaySurface?.decisionQueue ?? [];
  const immediateActions = displaySurface?.immediateActions ?? [];
  const verificationRail = displaySurface?.verificationRail ?? [];
  const executionSnapshot = displaySurface?.executionSnapshot ?? EMPTY_EXECUTION_SNAPSHOT;
  const contextPanel = displaySurface?.contextPanel ?? [];
  const projectHeader = useMemo(() => {
    if (!project) return null;
    const fallbackDisplay = toProjectSummaryDisplay({
      id: project.id,
      title: project.title,
      status: project.status,
      taskCount: project.taskCounts.total,
      completedTaskCount: project.taskCounts.done,
      dueDate: project.eta ?? void 0,
      nextAction: decisionQueue[0] ? { title: decisionQueue[0].title } : null
    });
    return {
      ...projectDisplay ?? fallbackDisplay,
      bestMoveTitle: projectDisplay?.bestMoveTitle ?? fallbackDisplay.bestMoveTitle ?? decisionQueue[0]?.title ?? null
    };
  }, [decisionQueue, project, projectDisplay]);
  const blockedTasks = useMemo(
    () => projectTasks.filter((task) => task.status === "blocked"),
    [projectTasks]
  );
  const anyLoading = tasksLoading || projectLoading;
  if (anyLoading && !project && !displaySurface) {
    return /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsx(SkeletonCard, {}),
        /* @__PURE__ */ jsx(SkeletonCard, {})
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx(SkeletonCard, {}),
        /* @__PURE__ */ jsx(SoftPanel, { variant: "utility", children: /* @__PURE__ */ jsx(EmptyState, { title: "Related notes coming soon" }) })
      ] })
    ] });
  }
  if (!project) {
    return /* @__PURE__ */ jsx(EmptyState, { title: `Project "${projectId}" not found.` });
  }
  return /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      projectHeader ? /* @__PURE__ */ jsx(ProjectDetailHeader, { projectId, project: projectHeader }) : /* @__PURE__ */ jsx(SkeletonCard, {}),
      tasksLoading ? /* @__PURE__ */ jsx(SkeletonCard, {}) : /* @__PURE__ */ jsx(ProjectBoardSection, { tasks: projectTasks, projectId })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      !tasksLoading && /* @__PURE__ */ jsx(BlockersRail, { blockedTasks }),
      /* @__PURE__ */ jsx(
        SoftPanel,
        {
          variant: "utility",
          title: "Pressure Signals",
          subtitle: "Scoped project pressure from the adapter layer.",
          children: pressureSignals.length ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: pressureSignals.slice(0, 3).map((signal) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-[18px] border border-white/8 bg-white/5 p-4",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: signal.title }),
                    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: signal.summary })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-amber-100", children: signal.severity })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-slate-400", children: signal.whySurfaced })
              ]
            },
            signal.id
          )) }) : /* @__PURE__ */ jsx(
            EmptyState,
            {
              title: "No project pressure is surfaced.",
              description: "Project-scoped pressure signals will appear here once the adapter returns them."
            }
          )
        }
      ),
      /* @__PURE__ */ jsx(
        SoftPanel,
        {
          variant: "utility",
          title: "Decision Queue",
          subtitle: "Top project-scoped actions from the adapter layer.",
          children: decisionQueue.length ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: decisionQueue.slice(0, 3).map((item) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-[18px] border border-white/8 bg-white/5 p-4",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: item.title }),
                    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: item.whyNow })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sky-100", children: item.score.toFixed(1) })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-slate-400", children: item.expectedEffect })
              ]
            },
            item.id
          )) }) : /* @__PURE__ */ jsx(
            EmptyState,
            {
              title: "No project actions are surfaced.",
              description: "Once scoped work is available, this rail will explain the next move."
            }
          )
        }
      ),
      /* @__PURE__ */ jsx(
        SoftPanel,
        {
          variant: "utility",
          title: "Immediate Actions",
          subtitle: "Low-friction next moves from the adapter layer.",
          children: immediateActions.length ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: immediateActions.slice(0, 3).map((item) => /* @__PURE__ */ jsxs(
            "article",
            {
              className: "rounded-[18px] border border-white/8 bg-white/5 p-4",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: item.title }),
                    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: item.summary })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sky-100", children: item.reversibility })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-slate-400", children: item.whyNow }),
                /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [
                  /* @__PURE__ */ jsx(
                    Link,
                    {
                      to: "/actions",
                      search: {
                        sort: void 0,
                        simulatableOnly: void 0,
                        selectedId: item.id
                      },
                      className: "text-xs font-semibold text-sky-100 underline decoration-sky-300/40 underline-offset-4",
                      children: "Inspect in Actions"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: item.expectedEffect })
                ] })
              ]
            },
            item.id
          )) }) : /* @__PURE__ */ jsx(
            EmptyState,
            {
              title: "No immediate actions are surfaced.",
              description: "The adapter will surface low-friction actions once they are available."
            }
          )
        }
      ),
      /* @__PURE__ */ jsx(
        SoftPanel,
        {
          variant: "utility",
          title: "Verification Rail",
          subtitle: "Project verification outcomes from the adapter layer.",
          children: verificationRail.length ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: verificationRail.slice(0, 3).map((item) => /* @__PURE__ */ jsx(
            "div",
            {
              className: "rounded-[18px] border border-white/8 bg-white/5 p-4",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: item.summary }),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: item.status })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-100", children: item.status })
              ] })
            },
            item.id
          )) }) : /* @__PURE__ */ jsx(
            EmptyState,
            {
              title: "No verification outcomes are surfaced.",
              description: "When project actions resolve, their verification history will appear here."
            }
          )
        }
      ),
      /* @__PURE__ */ jsx(
        SoftPanel,
        {
          variant: "utility",
          title: "Execution Snapshot",
          subtitle: "Active tasks, pipelines, runners, Huey jobs, and schedules.",
          children: /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: [
            { label: "Active Tasks", items: executionSnapshot.activeTasks },
            { label: "Pipelines", items: executionSnapshot.activePipelines },
            { label: "Runners", items: executionSnapshot.activeRunners },
            { label: "Huey Jobs", items: executionSnapshot.hueyJobs },
            { label: "Schedules", items: executionSnapshot.scheduleItems }
          ].map((group) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-[18px] border border-white/8 bg-white/5 p-4",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: group.label }),
                  /* @__PURE__ */ jsx("span", { className: "rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-200", children: group.items.length })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-300", children: group.items.length ? group.items.slice(0, 2).map((item) => item.title ?? item.id).join(" · ") : "No items surfaced" })
              ]
            },
            group.label
          )) })
        }
      ),
      /* @__PURE__ */ jsx(
        SoftPanel,
        {
          variant: "utility",
          title: "Context Panel",
          subtitle: "COD-selected project context.",
          children: contextPanel.length ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: contextPanel.map((item) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "rounded-[18px] border border-white/8 bg-white/5 p-4",
              children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: item.title }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: item.summary }),
                /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-slate-400", children: item.reasonSelected })
              ]
            },
            item.id
          )) }) : /* @__PURE__ */ jsx(
            EmptyState,
            {
              title: "Related notes coming soon",
              description: "The context rail is ready for project-linked notes and memories."
            }
          )
        }
      )
    ] })
  ] });
}
function ProjectDetailHeader({ projectId, project }) {
  const progressWidth = Math.max(0, Math.min(100, project.progressPercent));
  const projectLaneSearch = {
    tab: void 0,
    selectedId: void 0,
    noteId: void 0,
    mode: void 0,
    templateId: void 0,
    memoryTab: void 0
  };
  const automationLaneSearch = {
    tab: void 0,
    subtab: void 0,
    selectedId: void 0,
    autoRefresh: void 0
  };
  return /* @__PURE__ */ jsx("div", { className: "genie-surface genie-surface--hero rounded-[28px] p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between", children: [
    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Project command center" }),
          /* @__PURE__ */ jsx("h1", { className: "mt-2 text-3xl font-semibold tracking-tight text-slate-100", children: project.title })
        ] }),
        /* @__PURE__ */ jsx(SoftChip, { label: project.statusLabel, variant: project.statusVariant })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Progress" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-lg font-semibold text-slate-100", children: project.progressText }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 h-2 overflow-hidden rounded-full bg-white/10", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "h-full rounded-full bg-gradient-to-r from-sky-300 to-cyan-300",
              style: { width: `${progressWidth}%` }
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "ETA" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-lg font-semibold text-slate-100", children: project.etaLabel ?? "No ETA surfaced" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-400", children: "Live project timing from the summary feed." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-[18px] border border-white/8 bg-white/5 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Best move" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-lg font-semibold text-slate-100", children: project.bestMoveTitle ?? "No best move surfaced" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-slate-400", children: "COD-ranked next step from the current project summary." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "w-full max-w-[360px] space-y-3", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Jump to lane" }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/project/$slug/tasks",
            params: { slug: projectId },
            search: projectLaneSearch,
            className: "group rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-sky-300/40 hover:bg-white/10",
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: "Tasks" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Open the project board and execution queue." })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sky-100", children: "Open" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/project/$slug/knowledge",
            params: { slug: projectId },
            search: projectLaneSearch,
            className: "group rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-sky-300/40 hover:bg-white/10",
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: "Knowledge" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Jump to the project workspace and notes." })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sky-100", children: "Open" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/project/$slug/automation",
            params: { slug: projectId },
            search: automationLaneSearch,
            className: "group rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-sky-300/40 hover:bg-white/10",
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-100", children: "Automation" }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Inspect pipelines, runners, and schedules." })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sky-100", children: "Open" })
            ] })
          }
        )
      ] })
    ] })
  ] }) });
}
function BlockersRail({ blockedTasks }) {
  if (blockedTasks.length === 0) return null;
  return /* @__PURE__ */ jsx(SoftPanel, { title: "Blockers", variant: "utility", children: /* @__PURE__ */ jsx("div", { className: "space-y-2", children: blockedTasks.map((task) => /* @__PURE__ */ jsxs(
    "div",
    {
      className: "rounded-xl border border-red-300/30 bg-red-950/20 px-4 py-3",
      children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-red-200", children: task.title }),
        task.tags && task.tags.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: task.tags.map((tag) => /* @__PURE__ */ jsx(
          "span",
          {
            className: "inline-flex items-center rounded-full bg-red-300/20 px-2 py-0.5 text-[11px] font-medium text-red-100",
            children: tag
          },
          tag
        )) })
      ]
    },
    task.id
  )) }) });
}
function TaskCard({ task, accent }) {
  const borderAccent = accent ? "border-l-2 border-l-primary" : "";
  return /* @__PURE__ */ jsxs("div", { className: `genie-surface genie-surface--utility rounded-xl px-4 py-3 mb-2 ${borderAccent}`, children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-100 leading-snug", children: task.title }),
    task.estimatedTimeMin != null && task.estimatedTimeMin > 0 && /* @__PURE__ */ jsxs("span", { className: "mt-1.5 inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-300", children: [
      "⏱ ",
      task.estimatedTimeMin,
      "m"
    ] })
  ] });
}
function ProjectBoardSection({ tasks }) {
  const columns = [
    {
      key: "todo",
      label: "To do",
      tasks: tasks.filter((t) => t.status === "todo" || t.status === "backlog")
    },
    {
      key: "in-progress",
      label: "In progress",
      tasks: tasks.filter((t) => t.status === "in-progress"),
      accent: true
    },
    {
      key: "done",
      label: "Done",
      tasks: tasks.filter((t) => t.status === "completed" || t.status === "done")
    }
  ];
  return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: columns.map((col) => /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      SectionHeader,
      {
        title: col.label,
        subtitle: `${col.tasks.length} task${col.tasks.length !== 1 ? "s" : ""}`
      }
    ),
    col.tasks.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 py-2", children: "—" }) : col.tasks.map((task) => /* @__PURE__ */ jsx(TaskCard, { task, accent: col.accent }, task.id))
  ] }, col.key)) });
}
function ProjectRoute() {
  const {
    slug
  } = Route.useParams();
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });
  const canonicalPath = `/project/${encodeURIComponent(slug)}`;
  const isOverview = pathname === canonicalPath;
  const {
    data: summarySurface,
    isLoading
  } = useProjectSurface(slug);
  const summaryItems = [{
    label: "Scope",
    value: slug,
    detail: "Project-scoped command center"
  }, {
    label: "Pressure",
    value: isLoading && !summarySurface ? "Loading" : String(summarySurface?.pressureBand.length ?? 0),
    detail: "Scoped signals currently surfaced"
  }, {
    label: "Queue",
    value: isLoading && !summarySurface ? "Loading" : String(summarySurface?.decisionQueue.length ?? 0),
    detail: "COD-ranked next moves"
  }, {
    label: "Verification",
    value: isLoading && !summarySurface ? "Loading" : summarySurface?.verificationRail.length ? "Active" : "Ready",
    detail: "Project feedback loop"
  }];
  return /* @__PURE__ */ jsx(ProjectRouteShell, { slug, summaryItems, projectSurface: summarySurface ?? null, children: isOverview ? /* @__PURE__ */ jsx(ProjectDetailScene, { projectId: slug }) : /* @__PURE__ */ jsx(Outlet, {}) });
}
export {
  ProjectRoute as component
};
