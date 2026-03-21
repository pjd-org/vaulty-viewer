import React, { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import CODStatusWidget from "../../src/components/CODStatusWidget";
import { apiFetch } from "../../src/utils/api";
import {
  classifyHomepageFailure,
  formatHomepageMetric,
  homepageApiBadgeText,
  homepageEmptyMessage,
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

function IndexRoute() {
  const { q, collection } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const [activeCollection, setActiveCollection] = useState(collection ?? "all");
  const [apiNotes, setApiNotes] = useState<NoteItem[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({ total: 0, todo: 0, completed: 0, highPriority: 0 });
  const [goalsCount, setGoalsCount] = useState(0);
  const [taskData, setTaskData] = useState<TaskData>({}); // Map of path -> task frontmatter
  const [notesState, setNotesState] = useState<HomepageLoadState>("loading");
  const [tasksState, setTasksState] = useState<HomepageLoadState>("loading");
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(q ?? "");
  }, [q]);

  useEffect(() => {
    setActiveCollection(collection ?? "all");
  }, [collection]);

  // Derive collection from path
  const deriveCollection = (path: string) => {
    const parts = path.split("/");
    if (parts.length > 1) {
      const folder = parts[0].toLowerCase();
      if (folder === "tasks") return "tasks";
      if (folder === "goals") return "goals";
      if (folder === "notes") return "notes";
      if (folder === "projects") return "projects";
      if (folder === "specs") return "specs";
      if (folder === "knowledge") return "knowledge";
      return folder;
    }
    return "notes";
  };

  // Check if a path should be ignored (system files/folders)
  const shouldIgnorePath = (pathStr: string | undefined) => {
    if (!pathStr) return true;
    
    const parts = pathStr.split("/");
    const fileName = parts[parts.length - 1];
    
    // Ignore system folders
    const ignoredFolders = [
      "_system", "_trash", "_log", "_archive",
      "templates", ".obsidian", ".vault", ".git",
      "archive", ".vault-", "node_modules", ".cache",
      "core", "interests", "dashboards", "logs"
    ];
    
    if (parts.some(part => 
      ignoredFolders.some(ignored => part.toLowerCase().startsWith(ignored))
    )) {
      return true;
    }
    
    // Ignore config files
    if (fileName.startsWith("config.") || fileName.includes(".config.")) {
      return true;
    }
    
    // Ignore hidden files
    if (fileName.startsWith(".")) {
      return true;
    }
    
    // Ignore system prefixed files
    if (fileName.startsWith("_")) {
      return true;
    }
    
    return false;
  };

  // Fetch notes from API at runtime
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await apiFetch('/api/v1/notes');
        if (response.ok) {
          const result = await response.json();
          // API returns { structuredContent: { notes: ["path1.md", "path2.md", ...] } }
          const notePaths = result.structuredContent?.notes || result.notes || [];
          if (notePaths.length > 0) {
            const processedNotes = notePaths
              .map((path: string | { path?: string }) => (typeof path === "string" ? path : (path.path || "")))
              .filter((pathStr: string) => !shouldIgnorePath(pathStr))
              .map((pathStr: string, idx: number) => {
                const title = pathStr.split("/").pop()?.replace(".md", "") || "Untitled";
                return {
                  id: `api-${idx}`,
                  title: formatLabel(title),
                  excerpt: "",
                  slug: `/note?p=${encodeURIComponent(pathStr.replace(".md", ""))}`,
                  collection: deriveCollection(pathStr),
                  path: pathStr,
                };
              });
            setApiNotes(processedNotes);
            // Count goals from notes
            const goalNotes = processedNotes.filter((n: NoteItem) => n.collection === 'goals');
            setGoalsCount(goalNotes.length);
          }
          setNotesState("ready");
        } else {
          setApiNotes([]);
          setGoalsCount(0);
          setNotesState(classifyHomepageFailure(response.status));
        }
      } catch (err) {
        console.error("[viewer] Failed to fetch notes from API:", err);
        setApiNotes([]);
        setGoalsCount(0);
        setNotesState("offline");
      }
    };

    const fetchTasks = async () => {
      try {
        const response = await apiFetch('/api/v1/tasks?status=all');
        if (response.ok) {
          const result = await response.json();
          const tasks = result.structuredContent?.tasks || [];
          const total = result.structuredContent?.total || tasks.length;
          const todo = tasks.filter((t: TaskInfo) => t.status === 'todo').length;
          const completed = tasks.filter((t: TaskInfo) => t.status === 'completed').length;
          const highPriority = tasks.filter((t: TaskInfo) => (t.priority || 0) >= 9 && t.status === 'todo').length;
          const recurring = tasks.filter(
            (t: TaskInfo) => Array.isArray(t.tags) && t.tags.includes('recurring')
          ).slice(0, 5);
          setTaskStats({ total, todo, completed, highPriority, recurring });
          
          // Build task data map for card enhancement
          const taskMap: TaskData = {};
          tasks.forEach((task: TaskInfo) => {
            if (task.path) {
              taskMap[task.path] = task;
            }
          });
          setTaskData(taskMap);
          setTasksState("ready");
        } else {
          setTaskStats({ total: 0, todo: 0, completed: 0, highPriority: 0 });
          setTaskData({});
          setTasksState(classifyHomepageFailure(response.status));
        }
      } catch (err) {
        console.error("[viewer] Failed to fetch tasks from API:", err);
        setTaskStats({ total: 0, todo: 0, completed: 0, highPriority: 0 });
        setTaskData({});
        setTasksState("offline");
      }
    };
    
    fetchNotes();
    fetchTasks();
  }, []);

  // Use API data
  const items = apiNotes;
  const loading = notesState === "loading" || tasksState === "loading";
  const apiStatus = mergeHomepageApiStatus([notesState, tasksState]);

  const counts = items.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.collection] = (acc[item.collection] || 0) + 1;
      acc.all += 1;
      return acc;
    },
    { all: 0 }
  );

  const collectionKeys = Object.keys(counts).filter((key) => key !== "all");
  const ordered = PREFERRED_COLLECTIONS.filter((key) =>
    collectionKeys.includes(key)
  );
  const extra = collectionKeys
    .filter((key) => !PREFERRED_COLLECTIONS.includes(key))
    .sort();
  const collections = [
    { key: "all", label: "All" },
    ...ordered.map((key) => ({ key, label: formatLabel(key) })),
    ...extra.map((key) => ({ key, label: formatLabel(key) })),
  ];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCollection !== "all" && item.collection !== activeCollection) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return (
        item.title.toLowerCase().includes(needle) ||
        item.excerpt.toLowerCase().includes(needle) ||
        item.slug.toLowerCase().includes(needle)
      );
    });
  }, [items, activeCollection, query]);

  const tasksReady = tasksState === "ready";
  const notesReady = notesState === "ready";
  const activeTasksDisplay = formatHomepageMetric(taskStats.todo, tasksState);
  const highPriorityDisplay = formatHomepageMetric(taskStats.highPriority, tasksState);
  const goalsDisplay = formatHomepageMetric(goalsCount, notesState);
  const completedTasksDisplay = formatHomepageMetric(taskStats.completed, tasksState);
  const notesDisplay = formatHomepageMetric(counts.all, notesState);
  const collectionsDisplay = formatHomepageMetric(collectionKeys.length, notesState);
  const taskLinkLabel = tasksReady
    ? `View Tasks (${taskStats.todo} active${taskStats.highPriority ? `, ${taskStats.highPriority} high` : ""})`
    : tasksState === "unauthorized"
      ? "View Tasks (auth required)"
      : loading
        ? "View Tasks (loading…)"
        : "View Tasks (unavailable)";
  const goalsLinkLabel = notesReady
    ? `Goals (${goalsCount})`
    : notesState === "unauthorized"
      ? "Goals (auth required)"
      : loading
        ? "Goals (loading…)"
        : "Goals (unavailable)";
  const emptyMessage = homepageEmptyMessage(apiStatus, loading);

  return (
    <main className="page">
      <CODStatusWidget />
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Vaulty Viewer</p>
          <h1>Your vault, beautifully organized.</h1>
          <p className="lede">
            Browse notes, track tasks, and explore your knowledge graph — all in one unified interface.
          </p>
        </div>
        <div className="hero__panel">
          <div className="stats">
            <div className="stat" data-type="tasks">
              <div className="stat__icon">📋</div>
              <div className="stat__content">
                <div className="stat__value">{activeTasksDisplay}</div>
                <div className="stat__label">Active Tasks</div>
              </div>
            </div>
            <div className="stat" data-type="priority">
              <div className="stat__icon">🔥</div>
              <div className="stat__content">
                <div className="stat__value">{highPriorityDisplay}</div>
                <div className="stat__label">High Priority</div>
              </div>
            </div>
            <div className="stat" data-type="goals">
              <div className="stat__icon">🎯</div>
              <div className="stat__content">
                <div className="stat__value">{goalsDisplay}</div>
                <div className="stat__label">Goals</div>
              </div>
            </div>
          </div>
          {taskStats.recurring && taskStats.recurring.length > 0 && (
            <div className="hero-recurring">
              <div className="hero-recurring__header">
                <span className="hero-recurring__title">🔁 Recurring tasks</span>
                <span className="hero-recurring__subtitle">
                  Drag to plan in COD or open to edit schedule
                </span>
              </div>
              <div className="hero-recurring__list">
                {taskStats.recurring.map((t) => (
                  <a
                    key={t.path || t.id}
                    className="hero-recurring__item"
                    href={`/note?p=${encodeURIComponent((t.path || '').replace(/\.md$/, ''))}`}
                    title={t.title}
                  >
                    <span className="hero-recurring__name">{t.title || t.path}</span>
                    {t.nextRun && (
                      <span className="hero-recurring__meta">next: {new Date(t.nextRun).toLocaleDateString()}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="stats-secondary">
            <div className="stat-mini">
              <span className="stat-mini__value">{completedTasksDisplay}</span>
              <span className="stat-mini__label">completed</span>
            </div>
            <div className="stat-mini">
              <span className="stat-mini__value">{notesDisplay}</span>
              <span className="stat-mini__label">notes</span>
            </div>
            <div className="stat-mini">
              <span className="stat-mini__value">{collectionsDisplay}</span>
              <span className="stat-mini__label">collections</span>
            </div>
          </div>
          <div className="quick-links">
            <Link
              to="/"
              search={{ q: undefined, collection: undefined }}
              className="quick-link quick-link--primary"
              title={
                apiStatus === "online"
                  ? "Powered by Tasker API"
                  : apiStatus === "unauthorized"
                    ? "Homepage API authentication failed"
                    : apiStatus === "offline"
                      ? "Homepage API unavailable"
                      : "Loading homepage data"
              }
            >
              <span className="quick-link__icon">📋</span>
              <span className="quick-link__label">{taskLinkLabel}</span>
              <span className={`api-badge api-badge--${apiStatus}`}>
                {homepageApiBadgeText(apiStatus)}
              </span>
            </Link>
            <Link to="/goals" className="quick-link" title="Goals via Tasker API">
              <span className="quick-link__icon">🎯</span>
              <span className="quick-link__label">{goalsLinkLabel}</span>
            </Link>
            <Link to="/avatar" className="quick-link" title="Avatar dashboard and vitals">
              <span className="quick-link__icon">🧙</span>
              <span className="quick-link__label">Avatar Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="toolbar">
        <label className="search" htmlFor="vault-search">
          <span>🔍</span>
          <input
            id="vault-search"
            type="search"
            placeholder="Search notes, tasks, or paths..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="filters">
          {collections.map((collection) => (
            <button
              key={collection.key}
              type="button"
              className="filter-button"
              data-active={activeCollection === collection.key}
              onClick={() => setActiveCollection(collection.key)}
            >
              {collection.label} ({notesReady ? counts[collection.key] || 0 : "—"})
            </button>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="empty">
          {emptyMessage}
        </div>
      ) : (
        <section className="grid">
          {filtered.map((item, index) => {
            // Get collection icon
            const collectionIcons: Record<string, string> = {
              tasks: '📋',
              goals: '🎯',
              notes: '📝',
              projects: '🚀',
              specs: '📐',
              knowledge: '📚',
              reports: '📊',
              ideas: '💡',
              ops: '⚙️',
              reminders: '🔔',
            };
            const icon = collectionIcons[item.collection] || '📄';
            
            // Extract path for display (remove .md and show folder structure)
            const pathParts = item.slug.replace('/note?p=', '').split('%2F');
            const displayPath = pathParts.length > 1 
              ? decodeURIComponent(pathParts.slice(0, -1).join(' / '))
              : null;
            
            // Get task frontmatter data if available
            const taskInfo = item.path ? taskData[item.path] : null;
            const priority = taskInfo?.priority;
            const status = taskInfo?.status;
            const tags = taskInfo?.tags?.slice(0, 3) || [];
            const estimatedTime = (taskInfo as Record<string, unknown>)?.estimatedTimeMin as number | undefined;
            const goalId = (taskInfo as Record<string, unknown>)?.goalId as string | undefined;
            
            return (
              <Link
                key={item.id}
                to={item.slug}
                className="card"
                data-collection={item.collection}
                data-status={status}
                data-priority={(priority || 0) >= 9 ? 'high' : (priority || 0) >= 7 ? 'medium' : 'normal'}
                style={{ "--delay": `${Math.min(index, 20) * 0.03}s` } as React.CSSProperties}
              >
                <div className="card__header">
                  <span className="card__icon">{icon}</span>
                  {status && (
                    <span className="card__status" data-status={status}>
                      {status === 'completed' ? '✓' : status === 'todo' ? '○' : '◐'}
                    </span>
                  )}
                  {priority && priority >= 9 && (
                    <span className="card__priority" data-level="high">P{priority}</span>
                  )}
                  <span className="pill" data-collection={item.collection}>{item.collection}</span>
                </div>
                <h3 className="card__title">{item.title}</h3>
                {item.excerpt && <p className="card__excerpt">{item.excerpt}</p>}
                {tags.length > 0 && (
                  <div className="card__tags">
                    {tags.filter(t => !t.startsWith('goal:') && t !== 'task').slice(0, 3).map((tag, i) => (
                      <span key={i} className="card__tag">#{tag}</span>
                    ))}
                  </div>
                )}
                <div className="card__meta-row">
                  {estimatedTime && (
                    <span className="card__time">
                      <span className="card__time-icon">⏱</span>
                      {estimatedTime >= 60 ? `${Math.round(estimatedTime/60)}h` : `${estimatedTime}m`}
                    </span>
                  )}
                  {goalId && (
                    <span className="card__goal">
                      🎯 {formatLabel(goalId.replace(/-/g, ' '))}
                    </span>
                  )}
                </div>
                {displayPath && !taskInfo && (
                  <div className="card__path">
                    <span className="card__path-icon">📁</span>
                    <span>{displayPath}</span>
                  </div>
                )}
                <div className="card__footer">
                  <span className="card__action">Open →</span>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}
