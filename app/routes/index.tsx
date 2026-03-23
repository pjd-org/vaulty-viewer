import React, { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from '@tanstack/react-router'
import { apiFetch } from "../../src/utils/api";
import {
  classifyHomepageFailure,
  formatHomepageMetric,
  mergeHomepageApiStatus,
  type HomepageLoadState,
} from "../../src/lib/homepage-logic";

const PREFERRED_COLLECTIONS = ["notes", "tasks", "reports"];

const formatLabel = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

interface NoteItem {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  collection: string;
  path?: string;
}

interface TaskStats {
  total: number;
  todo: number;
  completed: number;
  highPriority: number;
  recurring?: TaskInfo[];
}

interface TaskInfo {
  id?: string;
  path?: string;
  title?: string;
  status?: string;
  priority?: number;
  tags?: string[];
  nextRun?: string;
}

interface TaskData {
  [path: string]: TaskInfo;
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' && search.q.length > 0 ? search.q : undefined,
    collection:
      typeof search.collection === 'string' && search.collection.length > 0
        ? search.collection
        : undefined,
  }),
  component: IndexRoute,
})


/** Simulated bar heights for Intelligence Feed (12 bars, seeded by task/note totals) */
function buildBars(seed: number): number[] {
  const heights = [40, 65, 45, 85, 30, 55, 95, 40, 70, 50, 35, 60];
  const offset = seed % heights.length;
  return [...heights.slice(offset), ...heights.slice(0, offset)];
}

/** Small Material Symbol icon */
function Icon({ name, className = "", style }: { name: string; className?: string; style?: React.CSSProperties }) {
  return <span className={`material-symbols-outlined ${className}`} style={style}>{name}</span>;
}

/** Activity item icon badge */
function ActivityBadge({ color, icon }: { color: string; icon: string }) {
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <Icon name={icon} className="text-[18px]" />
    </div>
  );
}

function IndexRoute() {
  const { q, collection } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const [activeCollection, setActiveCollection] = useState(collection ?? "all");
  const [apiNotes, setApiNotes] = useState<NoteItem[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({ total: 0, todo: 0, completed: 0, highPriority: 0 });
  const [goalsCount, setGoalsCount] = useState(0);
  const [taskData, setTaskData] = useState<TaskData>({});
  const [notesState, setNotesState] = useState<HomepageLoadState>("loading");
  const [tasksState, setTasksState] = useState<HomepageLoadState>("loading");
  const [activeTasks, setActiveTasks] = useState<TaskInfo[]>([]);
  const [visibleCount, setVisibleCount] = useState(48);

  useEffect(() => { setQuery(q ?? ""); }, [q]);
  useEffect(() => { setActiveCollection(collection ?? "all"); }, [collection]);

  const deriveCollection = (path: string) => {
    const folder = path.split("/")[0]?.toLowerCase();
    const known = ["tasks", "goals", "notes", "projects", "specs", "knowledge"];
    return known.includes(folder) ? folder : folder || "notes";
  };

  const shouldIgnorePath = (pathStr: string | undefined) => {
    if (!pathStr) return true;
    const parts = pathStr.split("/");
    const ignored = ["_system", "_trash", "_log", "_archive", "templates", ".obsidian", ".vault", ".git", "archive", "node_modules", ".cache", "core", "interests", "dashboards", "logs"];
    if (parts.some(p => ignored.some(i => p.toLowerCase().startsWith(i)))) return true;
    const file = parts[parts.length - 1];
    return file.startsWith("config.") || file.includes(".config.") || file.startsWith(".") || file.startsWith("_");
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await apiFetch('/api/v1/notes?pattern=' + encodeURIComponent('notes/**/*.md'));
        if (res.ok) {
          const result = await res.json();
          const paths: string[] = result.structuredContent?.notes || result.notes || [];
          const notes = paths
            .map(p => (typeof p === "string" ? p : (p as { path?: string }).path || ""))
            .filter(p => !shouldIgnorePath(p))
            .map((p, i) => ({
              id: `api-${i}`,
              title: formatLabel(p.split("/").pop()?.replace(".md", "") || "Untitled"),
              excerpt: "",
              slug: `/note?p=${encodeURIComponent(p.replace(".md", ""))}`,
              collection: deriveCollection(p),
              path: p,
            }));
          setApiNotes(notes);
          setGoalsCount(notes.filter(n => n.collection === "goals").length);
          setNotesState("ready");
        } else {
          setNotesState(classifyHomepageFailure(res.status));
        }
      } catch {
        setNotesState("offline");
      }
    };

    const fetchTasks = async () => {
      try {
        const res = await apiFetch('/api/v1/tasks?status=all');
        if (res.ok) {
          const result = await res.json();
          const tasks: TaskInfo[] = result.structuredContent?.tasks || [];
          const todo = tasks.filter(t => t.status === 'todo').length;
          const completed = tasks.filter(t => t.status === 'completed').length;
          const highPriority = tasks.filter(t => (t.priority || 0) >= 9 && t.status === 'todo').length;
          const recurring = tasks.filter(t => Array.isArray(t.tags) && t.tags.includes('recurring')).slice(0, 5);
          setTaskStats({ total: result.structuredContent?.total || tasks.length, todo, completed, highPriority, recurring });
          const active = tasks.filter(t => t.status === 'todo' || t.status === 'in-progress').slice(0, 2);
          setActiveTasks(active);
          const map: TaskData = {};
          tasks.forEach(t => { if (t.path) map[t.path] = t; });
          setTaskData(map);
          setTasksState("ready");
        } else {
          setTasksState(classifyHomepageFailure(res.status));
        }
      } catch {
        setTasksState("offline");
      }
    };

    fetchNotes();
    fetchTasks();
  }, []);

  const items = apiNotes;
  const loading = notesState === "loading" || tasksState === "loading";
  const apiStatus = mergeHomepageApiStatus([notesState, tasksState]);
  const bars = buildBars(taskStats.total + apiNotes.length);

  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.collection] = (acc[item.collection] || 0) + 1;
    acc.all += 1;
    return acc;
  }, { all: 0 });

  const collectionKeys = Object.keys(counts).filter(k => k !== "all");
  const ordered = PREFERRED_COLLECTIONS.filter(k => collectionKeys.includes(k));
  const extra = collectionKeys.filter(k => !PREFERRED_COLLECTIONS.includes(k)).sort();
  const collections = [
    { key: "all", label: "All" },
    ...ordered.map(k => ({ key: k, label: formatLabel(k) })),
    ...extra.map(k => ({ key: k, label: formatLabel(k) })),
  ];

  const filtered = useMemo(() => {
    setVisibleCount(48);
    const needle = query.trim().toLowerCase();
    return items.filter(item => {
      if (activeCollection !== "all" && item.collection !== activeCollection) return false;
      if (!needle) return true;
      return item.title.toLowerCase().includes(needle) || item.slug.toLowerCase().includes(needle);
    });
  }, [items, activeCollection, query]);

  const notesReady = notesState === "ready";
  const activeTasksDisplay = formatHomepageMetric(taskStats.todo, tasksState);
  const highPriorityDisplay = formatHomepageMetric(taskStats.highPriority, tasksState);

  // Activity feed: derive from recent notes
  const recentActivity = items.slice(0, 4).map(n => ({
    icon: n.collection === "tasks" ? "task_alt" : n.collection === "goals" ? "flag" : "description",
    color: n.collection === "tasks" ? "bg-primary/10 text-primary" : n.collection === "goals" ? "bg-secondary/10 text-secondary" : "bg-surface-container-high text-on-surface-variant",
    title: n.title,
    meta: n.collection,
    href: n.slug,
  }));

  const statusLabel = apiStatus === "online" ? "Operational" : apiStatus === "offline" ? "Offline" : "Loading";
  const statusColor = apiStatus === "online" ? "text-secondary" : apiStatus === "offline" ? "text-error" : "text-on-surface-variant";

  return (
    <main className="px-6 pb-12 pt-6 max-w-[1400px] mx-auto">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-manrope uppercase tracking-[0.15em] text-on-surface-variant mb-2">
            Vaulty · Operational Command Center
          </p>
          <h1 className="font-space-grotesk text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight max-w-2xl">
            Your vault,{" "}
            <span className="text-primary italic">fully operational.</span>
          </h1>
          <p className="font-manrope text-on-surface-variant mt-3 text-base max-w-xl">
            Notes, tasks, and knowledge — unified in one command surface.
          </p>
        </div>
        <div className="flex items-center gap-6 bg-surface-container rounded-xl px-6 py-4 shrink-0">
          <div className="flex flex-col">
            <span className="font-manrope text-[10px] uppercase tracking-widest text-on-surface-variant">Active Tasks</span>
            <span className={`font-space-grotesk text-2xl font-bold ${loading ? "text-on-surface-variant" : "text-primary"}`}>
              {activeTasksDisplay}
            </span>
          </div>
          <div className="w-px h-8 bg-outline-variant" />
          <div className="flex flex-col">
            <span className="font-manrope text-[10px] uppercase tracking-widest text-on-surface-variant">High Priority</span>
            <span className={`font-space-grotesk text-2xl font-bold ${loading ? "text-on-surface-variant" : "text-error"}`}>
              {highPriorityDisplay}
            </span>
          </div>
          <div className="w-px h-8 bg-outline-variant" />
          <div className="flex flex-col">
            <span className="font-manrope text-[10px] uppercase tracking-widest text-on-surface-variant">System</span>
            <span className={`font-space-grotesk text-2xl font-bold ${statusColor}`}>{statusLabel}</span>
          </div>
        </div>
      </section>

      {/* ── Bento Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-5 mb-10">

        {/* Intelligence Feed — 8 cols */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container rounded-xl p-6 transition-all duration-[var(--vault-duration-snappy)] hover:shadow-vault-lg">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="font-space-grotesk text-xl font-bold text-on-surface tracking-tight">Intelligence Feed</h2>
              <p className="font-manrope text-[11px] uppercase tracking-widest text-on-surface-variant mt-1">
                Vault Activity · {items.length} items indexed
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Link to="/knowledge" className="px-3 py-1 bg-surface-container-high text-[10px] font-manrope rounded-full text-on-surface-variant border border-outline-variant/20 uppercase tracking-widest hover:bg-surface-container-highest transition-colors">
                Explore
              </Link>
            </div>
          </div>
          {/* Bar chart */}
          <div className="h-48 flex items-end gap-1.5 px-1">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/15 hover:bg-primary transition-colors duration-[var(--vault-duration-snappy)] rounded-t-sm cursor-pointer"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-4 mt-6 pt-6 border-t border-outline-variant/20 gap-4">
            {[
              { label: "Notes", value: formatHomepageMetric(counts.notes || 0, notesState) },
              { label: "Tasks", value: formatHomepageMetric(counts.tasks || 0, notesState) },
              { label: "Goals", value: formatHomepageMetric(goalsCount, notesState) },
              { label: "Total", value: formatHomepageMetric(counts.all || 0, notesState) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="font-manrope text-[10px] text-on-surface-variant uppercase tracking-widest">{label}</p>
                <p className="font-space-grotesk text-xl font-bold text-on-surface mt-1">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vault Status — 4 cols */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-[var(--vault-duration-snappy)] hover:shadow-vault">
          <div className="absolute top-4 left-4">
            <Icon name="verified_user" className="text-secondary text-2xl" />
          </div>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-4 border-surface-container"
              style={{ borderTopColor: "var(--vault-secondary)", animation: "spin 10s linear infinite" }}
            />
            <div className="text-center">
              <Icon name="lock" className="text-secondary text-5xl" style={{ fontVariationSettings: "'FILL' 1" } as React.CSSProperties} />
              <p className="font-manrope text-[10px] uppercase tracking-widest text-on-surface-variant mt-2">
                {apiStatus === "online" ? "Vault Secure" : apiStatus === "offline" ? "Vault Offline" : "Connecting…"}
              </p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <h3 className="font-space-grotesk text-lg font-bold text-on-surface">
              {apiStatus === "online" ? "All Systems Go" : "Connection Issue"}
            </h3>
            <p className="font-manrope text-sm text-on-surface-variant mt-1">
              {tasksState === "ready" ? `${taskStats.total} tasks tracked` : "Checking status…"}
            </p>
            <Link
              to="/cod-status"
              className="mt-5 inline-flex items-center gap-1 px-5 py-1.5 rounded-full border border-secondary/30 text-secondary font-manrope text-xs font-bold uppercase tracking-widest hover:bg-secondary/10 transition-colors"
            >
              <Icon name="monitoring" className="text-sm" /> COD Status
            </Link>
          </div>
        </div>

        {/* Recent Activity — 4 cols */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-xl p-6 flex flex-col transition-all duration-[var(--vault-duration-snappy)] hover:shadow-vault">
          <h2 className="font-space-grotesk text-xl font-bold text-on-surface mb-6 tracking-tight">Recent Activity</h2>
          <div className="space-y-5 overflow-y-auto flex-1">
            {recentActivity.length > 0 ? recentActivity.map((item, i) => (
              <a key={i} href={item.href} className="flex gap-4 hover:opacity-80 transition-opacity">
                <ActivityBadge color={item.color} icon={item.icon} />
                <div className="min-w-0">
                  <p className="font-manrope text-sm font-medium text-on-surface truncate">{item.title}</p>
                  <p className="font-manrope text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">{item.meta}</p>
                </div>
              </a>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant py-8">
                <Icon name="folder_open" className="text-3xl mb-2 opacity-40" />
                <p className="font-manrope text-sm">{loading ? "Loading…" : "No recent items"}</p>
              </div>
            )}
          </div>
          <Link to="/knowledge" className="mt-6 font-manrope text-[11px] uppercase tracking-widest text-primary font-bold hover:opacity-80 transition-opacity">
            Browse all notes →
          </Link>
        </div>

        {/* Active Operations — 8 cols */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container rounded-xl p-6 transition-all duration-[var(--vault-duration-snappy)] hover:shadow-vault">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-space-grotesk text-xl font-bold text-on-surface tracking-tight">Active Operations</h2>
            <Link to="/kanban" className="font-manrope text-[11px] uppercase tracking-widest text-primary font-bold hover:opacity-80 transition-opacity">
              View Board
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTasks.length > 0 ? activeTasks.map((task, i) => {
              const progress = task.status === "in-progress" ? 65 : 20;
              return (
                <a
                  key={task.path || i}
                  href={task.path ? `/note?p=${encodeURIComponent(task.path.replace(/\.md$/, ''))}` : "#"}
                  className="p-5 bg-surface-container-high rounded-xl border border-outline-variant/10 hover:border-primary/40 transition-all cursor-pointer group block"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-surface-container rounded-lg group-hover:bg-primary/10 transition-colors">
                      <Icon name={i === 0 ? "terminal" : "psychology"} className="text-primary text-lg" />
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-manrope font-bold uppercase rounded ${task.status === "in-progress" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                      {task.status === "in-progress" ? "In Progress" : "Todo"}
                    </span>
                  </div>
                  <h4 className="font-space-grotesk font-bold text-base text-on-surface">{task.title || "Untitled Task"}</h4>
                  <div className="mt-4 w-full bg-surface-container h-1 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </a>
              );
            }) : (
              <div className="col-span-2 flex flex-col items-center justify-center py-10 text-on-surface-variant">
                <Icon name="check_circle" className="text-4xl mb-3 opacity-40" />
                <p className="font-manrope text-sm">{loading ? "Loading tasks…" : "No active tasks. Nice."}</p>
              </div>
            )}
          </div>
          {/* Quick-add */}
          <div className="mt-5 flex items-center gap-3 bg-surface-container-high p-2 rounded-xl">
            <input
              className="flex-1 bg-transparent border-none text-sm font-manrope focus:ring-0 placeholder:text-on-surface-variant text-on-surface outline-none"
              placeholder="Queue new operational task…"
              type="text"
            />
            <Link
              to="/kanban"
              className="bg-gradient-to-r from-primary to-primary-container text-white p-2 rounded-lg hover:opacity-90 transition-opacity active:scale-95"
            >
              <Icon name="add" className="text-lg" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Notes Archive ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-space-grotesk text-lg font-bold text-on-surface tracking-tight">Note Archive</h2>
          <span className="font-manrope text-[11px] uppercase tracking-widest text-on-surface-variant">
            {notesReady ? `${counts.all} items` : "—"}
          </span>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <label className="flex items-center gap-2 flex-1 bg-surface-container-high rounded-xl px-4 py-2.5">
            <Icon name="search" className="text-on-surface-variant text-lg shrink-0" />
            <input
              id="vault-search"
              type="search"
              className="flex-1 bg-transparent border-none text-sm font-manrope focus:ring-0 placeholder:text-on-surface-variant text-on-surface outline-none"
              placeholder="Search notes, tasks, or paths…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </label>
          <div className="flex gap-2 flex-wrap">
            {collections.map(col => (
              <button
                key={col.key}
                type="button"
                onClick={() => setActiveCollection(col.key)}
                className={`px-3 py-1.5 font-manrope text-xs rounded-full border transition-colors ${
                  activeCollection === col.key
                    ? "bg-primary text-white border-transparent"
                    : "bg-transparent text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high"
                }`}
              >
                {col.label} ({notesReady ? counts[col.key] || 0 : "—"})
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <Icon name="search_off" className="text-4xl mb-3 opacity-40" />
            <p className="font-manrope text-sm">
              {loading ? "Loading vault…" : query ? "No matches found." : "No items in this collection."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.slice(0, visibleCount).map((item, index) => {
              const taskInfo = item.path ? taskData[item.path] : null;
              const priority = taskInfo?.priority;
              const status = taskInfo?.status;
              const iconMap: Record<string, string> = {
                tasks: "task_alt", goals: "flag", notes: "description",
                projects: "rocket_launch", specs: "architecture",
                knowledge: "local_library", reports: "bar_chart",
              };
              const icon = iconMap[item.collection] || "article";
              return (
                <Link
                  key={item.id}
                  to={item.slug}
                  className="group block p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 hover:border-primary/30 hover:shadow-vault-sm transition-all duration-[var(--vault-duration-snappy)]"
                  style={{ animationDelay: `${Math.min(index, 20) * 30}ms` } as React.CSSProperties}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon name={icon} className="text-primary text-base opacity-80" />
                      <span className="font-manrope text-[10px] uppercase tracking-widest text-on-surface-variant">{item.collection}</span>
                    </div>
                    {(priority || 0) >= 9 && (
                      <span className="font-manrope text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-error/10 text-error rounded">P{priority}</span>
                    )}
                  </div>
                  <h3 className="font-space-grotesk font-semibold text-sm text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {status && (
                    <div className="mt-2 flex items-center gap-1">
                      <Icon name={status === "completed" ? "check_circle" : status === "todo" ? "radio_button_unchecked" : "pending"} className="text-[14px] text-on-surface-variant" />
                      <span className="font-manrope text-[10px] text-on-surface-variant capitalize">{status}</span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-manrope text-[10px] uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">Open →</span>
                  </div>
                </Link>
              );
            })}
          </div>
          {visibleCount < filtered.length && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setVisibleCount(v => v + 48)}
                className="px-6 py-2 font-manrope text-xs font-bold uppercase tracking-widest rounded-full border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
          </>
        )}
      </section>
    </main>
  );
}
