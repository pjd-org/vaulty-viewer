import { jsxs, jsx } from "react/jsx-runtime";
import { useReducer, useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { e as buildColumns, g as filterBacklog, h as STATUS_COLUMNS, b as apiFetch, n as normalizeTask } from "./router-Dve3S_a4.js";
import "@tanstack/react-query";
import "zustand";
import "clsx";
function kanbanReducer(state, action) {
  switch (action.type) {
    case "TASKS_LOADED":
      return {
        ...state,
        apiTasks: action.tasks,
        apiStatus: "online"
      };
    case "API_OFFLINE":
      return {
        ...state,
        apiStatus: "offline"
      };
    case "MUTATE_START":
      return {
        ...state,
        mutatingTaskId: action.taskId
      };
    case "MUTATE_DONE":
      return {
        ...state,
        apiStatus: "online",
        mutatingTaskId: null,
        draggingTaskId: null,
        apiTasks: state.apiTasks.map((t) => t.path === action.path || t.id === action.id ? {
          ...t,
          status: action.status,
          path: action.updatedPath
        } : t)
      };
    case "MUTATE_FAIL":
      return {
        ...state,
        apiStatus: "offline",
        mutatingTaskId: null,
        draggingTaskId: null
      };
    case "DRAG_START":
      return {
        ...state,
        draggingTaskId: action.taskId
      };
    case "DRAG_END":
      return {
        ...state,
        draggingTaskId: null
      };
  }
}
function KanbanRoute() {
  const [{
    apiStatus,
    apiTasks,
    mutatingTaskId,
    draggingTaskId
  }, dispatch] = useReducer(kanbanReducer, {
    apiStatus: "unknown",
    apiTasks: [],
    mutatingTaskId: null,
    draggingTaskId: null
  });
  const [filterTag, setFilterTag] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [expandCompletedColumn, setExpandCompletedColumn] = useState(false);
  const tasks = apiTasks;
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await apiFetch("/api/v1/tasks");
        if (res.ok) {
          const body = await res.json();
          const tasks2 = (body.structuredContent?.tasks || body.tasks || []).map((t) => normalizeTask(t));
          dispatch({
            type: "TASKS_LOADED",
            tasks: tasks2
          });
        } else {
          dispatch({
            type: "API_OFFLINE"
          });
        }
      } catch (err) {
        console.warn("[kanban] API unavailable, using static data", err);
        dispatch({
          type: "API_OFFLINE"
        });
      }
    };
    loadTasks();
  }, []);
  const tags = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    tasks.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [tasks]);
  const projects = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    tasks.forEach((t) => t.projectId && set.add(t.projectId));
    return Array.from(set).sort();
  }, [tasks]);
  const columns = useMemo(() => buildColumns(
    tasks,
    filterTag || "",
    filterProject || "",
    showCompleted,
    true
    // exclude recurring from board
  ), [tasks, filterTag, filterProject, showCompleted]);
  const backlogTasks = useMemo(() => filterBacklog(
    tasks,
    filterTag || "",
    filterProject || "",
    true
    // exclude recurring from backlog view
  ), [tasks, filterTag, filterProject]);
  const totalByStatus = useMemo(() => {
    return tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {
      todo: 0,
      "in-progress": 0,
      blocked: 0,
      completed: 0
    });
  }, [tasks]);
  const isReadOnly = apiStatus !== "online";
  const updateStatus = async (task, status) => {
    if (!task.path) return;
    if (task.status === status) return;
    dispatch({
      type: "MUTATE_START",
      taskId: task.id
    });
    try {
      const res = await apiFetch(`/api/v1/tasks/${encodeURIComponent(task.path)}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status
        })
      });
      if (!res.ok) {
        dispatch({
          type: "MUTATE_FAIL"
        });
        return;
      }
      const body = await res.json();
      dispatch({
        type: "MUTATE_DONE",
        path: task.path,
        id: task.id,
        status: body?.structuredContent?.frontmatter?.status || status,
        updatedPath: body?.structuredContent?.path || task.path
      });
    } catch (err) {
      console.warn("[kanban] status update failed", err);
      dispatch({
        type: "MUTATE_FAIL"
      });
    }
  };
  const handleDragStart = (task) => {
    if (isReadOnly) return;
    dispatch({
      type: "DRAG_START",
      taskId: task.id
    });
  };
  const handleDragEnd = () => {
    dispatch({
      type: "DRAG_END"
    });
  };
  const handleDrop = (status) => {
    if (isReadOnly || !draggingTaskId) return;
    const task = apiTasks.find((t) => t.id === draggingTaskId);
    if (task) {
      updateStatus(task, status);
    } else {
      dispatch({
        type: "DRAG_END"
      });
    }
  };
  const allowDrop = (e) => {
    if (isReadOnly) return;
    e.preventDefault();
  };
  return /* @__PURE__ */ jsxs("main", { className: "page", children: [
    /* @__PURE__ */ jsxs("header", { className: "page-header", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "eyebrow", children: "Tasker Kanban" }),
        /* @__PURE__ */ jsx("h1", { children: "Visualize task flow" }),
        /* @__PURE__ */ jsxs("p", { className: "lede", children: [
          "Four simple columns to track work. ",
          isReadOnly ? "API offline — read-only view." : "Drag-drop ready when API supports status updates.",
          " Recurring tasks are hidden from the board; backlog tasks are listed below."
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "board-stats", children: STATUS_COLUMNS.map((col) => /* @__PURE__ */ jsxs("div", { className: "board-stat", children: [
        /* @__PURE__ */ jsx("span", { className: "board-stat__label", children: col.label }),
        /* @__PURE__ */ jsx("span", { className: "board-stat__value", children: totalByStatus[col.key] || 0 })
      ] }, col.key)) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "kanban-controls", children: [
      /* @__PURE__ */ jsxs("div", { className: "select-group", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "kanban-filter-tag", children: "Filter by tag" }),
        /* @__PURE__ */ jsxs("select", { id: "kanban-filter-tag", value: filterTag, onChange: (e) => setFilterTag(e.target.value), "aria-label": "Filter by tag", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "All tags" }),
          tags.map((tag) => /* @__PURE__ */ jsx("option", { value: tag, children: tag }, tag))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "select-group", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "kanban-filter-project", children: "Filter by project" }),
        /* @__PURE__ */ jsxs("select", { id: "kanban-filter-project", value: filterProject, onChange: (e) => setFilterProject(e.target.value), "aria-label": "Filter by project", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "All projects" }),
          projects.map((proj) => /* @__PURE__ */ jsx("option", { value: proj, children: proj }, proj))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "kanban-legend", children: [
        /* @__PURE__ */ jsx("span", { className: "pill pill--ghost", children: "P9+" }),
        /* @__PURE__ */ jsx("span", { className: "muted", children: "High priority" }),
        /* @__PURE__ */ jsx("span", { className: "pill pill--ghost", children: "⏱" }),
        /* @__PURE__ */ jsx("span", { className: "muted", children: "Estimate" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "toggle-group", children: /* @__PURE__ */ jsxs("label", { children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: showCompleted, onChange: (e) => setShowCompleted(e.target.checked) }),
        "Show completed"
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "kanban", children: columns.map((col) => (() => {
      const isCompletedColumn = col.key === "completed";
      const totalItems = col.items.length;
      const visibleItems = isCompletedColumn && !expandCompletedColumn ? col.items.slice(0, 5) : col.items;
      return /* @__PURE__ */ jsxs("div", { className: `kanban__column ${draggingTaskId ? "kanban__column--droppable" : ""}`, "data-status": col.key, onDragOver: allowDrop, onDrop: () => handleDrop(col.key), children: [
        /* @__PURE__ */ jsxs("header", { className: "kanban__column-header", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "muted", children: col.label }),
            /* @__PURE__ */ jsxs("h3", { children: [
              totalItems,
              " task",
              totalItems === 1 ? "" : "s"
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "pill", children: col.key })
        ] }),
        totalItems === 0 ? /* @__PURE__ */ jsxs("div", { className: "kanban__empty", children: [
          /* @__PURE__ */ jsx("div", { className: "kanban__empty-icon", children: col.key === "todo" ? "📝" : col.key === "in-progress" ? "🚀" : col.key === "blocked" ? "🚧" : "🎉" }),
          /* @__PURE__ */ jsx("div", { className: "kanban__empty-text", children: col.key === "todo" ? "No tasks to do" : col.key === "in-progress" ? "Nothing in progress" : col.key === "blocked" ? "No blockers — great!" : "Complete some tasks!" }),
          /* @__PURE__ */ jsx("div", { className: "kanban__empty-hint", children: col.key === "todo" ? "Create a task in your vault to get started" : col.key === "completed" ? "Finished tasks will appear here" : "Drag tasks here or update status in vault" })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "kanban__cards", children: [
          visibleItems.map((task) => /* @__PURE__ */ jsxs("article", { className: `kanban-card ${draggingTaskId === task.id ? "kanban-card--dragging" : ""}`, "aria-label": task.title, draggable: !isReadOnly, onDragStart: () => handleDragStart(task), onDragEnd: handleDragEnd, children: [
            /* @__PURE__ */ jsxs("div", { className: "kanban-card__header", children: [
              /* @__PURE__ */ jsx("span", { className: "kanban-card__title", children: task.title }),
              task.priority > 0 && /* @__PURE__ */ jsxs("span", { className: `kanban-card__priority ${task.priority >= 8 ? "kanban-card__priority--high" : task.priority >= 5 ? "kanban-card__priority--mid" : ""}`, title: `Priority ${task.priority}`, children: [
                "P",
                task.priority
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "kanban-card__meta", children: [
              task.estimatedTimeMin ? /* @__PURE__ */ jsxs("span", { className: "chip", children: [
                "⏱ ",
                task.estimatedTimeMin >= 60 ? `${Math.round(task.estimatedTimeMin / 60)}h` : `${task.estimatedTimeMin}m`
              ] }) : null,
              task.goalId && /* @__PURE__ */ jsxs("span", { className: "chip", children: [
                "🎯 ",
                task.goalId.replace(/-/g, " ")
              ] }),
              task.projectId && /* @__PURE__ */ jsxs("span", { className: "chip", children: [
                "🚀 ",
                task.projectId
              ] })
            ] }),
            task.tags?.length ? /* @__PURE__ */ jsx("div", { className: "kanban-card__tags", children: task.tags.filter((tag) => !tag.startsWith("goal:") && tag !== "task").slice(0, 3).map((tag) => /* @__PURE__ */ jsxs("span", { className: "tag", children: [
              "#",
              tag
            ] }, tag)) }) : null,
            task.status === "blocked" && /* @__PURE__ */ jsx("div", { className: "kanban-card__blocked", children: /* @__PURE__ */ jsx("span", { children: "🚫 Blocked" }) }),
            /* @__PURE__ */ jsxs("div", { className: "kanban-card__footer", children: [
              /* @__PURE__ */ jsx(Link, { to: task.link, className: "pill pill--soft", children: "Open →" }),
              !isReadOnly && task.path ? /* @__PURE__ */ jsx("div", { className: "kanban-card__actions", children: task.status !== "completed" ? /* @__PURE__ */ jsx("button", { className: "pill pill--ghost", onClick: () => updateStatus(task, "completed"), disabled: mutatingTaskId === task.id, title: "Mark completed", children: "✓ Complete" }) : /* @__PURE__ */ jsx("button", { className: "pill pill--ghost", onClick: () => updateStatus(task, "todo"), disabled: mutatingTaskId === task.id, title: "Reopen task", children: "↺ Reopen" }) }) : /* @__PURE__ */ jsx("span", { className: "pill pill--ghost", children: "read-only" })
            ] })
          ] }, task.id)),
          isCompletedColumn && totalItems > 5 ? /* @__PURE__ */ jsx("button", { type: "button", className: "kanban__more", onClick: () => setExpandCompletedColumn((prev) => !prev), children: expandCompletedColumn ? "Show fewer completed" : `Show ${totalItems - 5} more completed` }) : null
        ] })
      ] }, col.key);
    })()) }),
    /* @__PURE__ */ jsxs("section", { className: "kanban backlog-section", children: [
      /* @__PURE__ */ jsx("header", { className: "kanban__column-header", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "muted", children: "Backlog (non-recurring)" }),
        /* @__PURE__ */ jsxs("h3", { children: [
          backlogTasks.length,
          " task",
          backlogTasks.length === 1 ? "" : "s"
        ] })
      ] }) }),
      backlogTasks.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "kanban__empty", children: [
        /* @__PURE__ */ jsx("div", { className: "kanban__empty-icon", children: "📥" }),
        /* @__PURE__ */ jsx("div", { className: "kanban__empty-text", children: "No backlog tasks" }),
        /* @__PURE__ */ jsx("div", { className: "kanban__empty-hint", children: "Backlog items will appear here" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "kanban__cards backlog-cards", children: backlogTasks.map((task) => /* @__PURE__ */ jsxs("article", { className: "kanban-card", "aria-label": task.title, children: [
        /* @__PURE__ */ jsxs("div", { className: "kanban-card__header", children: [
          /* @__PURE__ */ jsx("span", { className: "kanban-card__title", children: task.title }),
          task.priority > 0 && /* @__PURE__ */ jsxs("span", { className: `kanban-card__priority ${task.priority >= 8 ? "kanban-card__priority--high" : task.priority >= 5 ? "kanban-card__priority--mid" : ""}`, title: `Priority ${task.priority}`, children: [
            "P",
            task.priority
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "kanban-card__meta", children: [
          task.estimatedTimeMin ? /* @__PURE__ */ jsxs("span", { className: "chip", children: [
            "⏱ ",
            task.estimatedTimeMin >= 60 ? `${Math.round(task.estimatedTimeMin / 60)}h` : `${task.estimatedTimeMin}m`
          ] }) : null,
          task.projectId && /* @__PURE__ */ jsxs("span", { className: "chip", children: [
            "🚀 ",
            task.projectId
          ] }),
          task.goalId && /* @__PURE__ */ jsxs("span", { className: "chip", children: [
            "🎯 ",
            task.goalId.replace(/-/g, " ")
          ] })
        ] }),
        task.tags?.length ? /* @__PURE__ */ jsx("div", { className: "kanban-card__tags", children: task.tags.filter((tag) => !tag.startsWith("goal:") && tag !== "task").slice(0, 3).map((tag) => /* @__PURE__ */ jsxs("span", { className: "tag", children: [
          "#",
          tag
        ] }, tag)) }) : null,
        /* @__PURE__ */ jsx("div", { className: "kanban-card__footer", children: /* @__PURE__ */ jsx(Link, { to: task.link, className: "pill pill--soft", children: "Open →" }) })
      ] }, task.id)) })
    ] })
  ] });
}
export {
  KanbanRoute as component
};
