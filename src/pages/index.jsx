import React, { useEffect, useMemo, useState } from "react";
import { graphql, Link } from "gatsby";
import CODStatusPanel from "../components/CODStatusPanel";
import Navbar from "../components/Navbar";

const PREFERRED_COLLECTIONS = ["notes", "tasks", "reports"];

const formatLabel = (value) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getApiUrl = () => {
  if (typeof process !== "undefined" && process.env.GATSBY_TASKER_API_URL) {
    return process.env.GATSBY_TASKER_API_URL;
  }
  if (typeof window !== "undefined" && window.TASKER_API_URL) {
    return window.TASKER_API_URL;
  }
  // Default to relative path - works with proxy
  return "";
};

const IndexPage = ({ data }) => {
  const [query, setQuery] = useState("");
  const [activeCollection, setActiveCollection] = useState("all");
  const [apiNotes, setApiNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskStats, setTaskStats] = useState({ total: 0, todo: 0, completed: 0, highPriority: 0 });
  const [goalsCount, setGoalsCount] = useState(0);
  const [taskData, setTaskData] = useState({}); // Map of path -> task frontmatter
  const [apiStatus, setApiStatus] = useState("unknown"); // online | offline | unknown

  // Derive collection from path
  const deriveCollection = (path) => {
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
  const shouldIgnorePath = (pathStr) => {
    if (!pathStr) return true;
    
    const lowerPath = pathStr.toLowerCase();
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
      const apiUrl = getApiUrl();
      
      try {
        const response = await fetch(`${apiUrl}/api/v1/notes`);
        if (response.ok) {
          const result = await response.json();
          // API returns { structuredContent: { notes: ["path1.md", "path2.md", ...] } }
          const notePaths = result.structuredContent?.notes || result.notes || [];
          if (notePaths.length > 0) {
            const processedNotes = notePaths
              .map((path) => (typeof path === "string" ? path : (path.path || "")))
              .filter((pathStr) => !shouldIgnorePath(pathStr))
              .map((pathStr, idx) => {
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
            const goalNotes = processedNotes.filter(n => n.collection === 'goals');
            setGoalsCount(goalNotes.length);
            setApiStatus("online");
          }
        }
      } catch (err) {
        console.error("[viewer] Failed to fetch notes from API:", err);
        setApiStatus("offline");
      } finally {
        setLoading(false);
      }
    };

    const fetchTasks = async () => {
      const apiUrl = getApiUrl();
      try {
        const response = await fetch(`${apiUrl}/api/v1/tasks`);
        if (response.ok) {
          const result = await response.json();
          const tasks = result.structuredContent?.tasks || [];
          const total = result.structuredContent?.total || tasks.length;
          const todo = tasks.filter(t => t.status === 'todo').length;
          const completed = tasks.filter(t => t.status === 'completed').length;
          const highPriority = tasks.filter(t => t.priority >= 9 && t.status === 'todo').length;
          setTaskStats({ total, todo, completed, highPriority });
          
          // Build task data map for card enhancement
          const taskMap = {};
          tasks.forEach(task => {
            if (task.path) {
              taskMap[task.path] = task;
            }
          });
          setTaskData(taskMap);
          setApiStatus("online");
        }
      } catch (err) {
        console.error("[viewer] Failed to fetch tasks from API:", err);
        setApiStatus("offline");
      }
    };
    
    fetchNotes();
    fetchTasks();
  }, []);

  // Combine Gatsby static data with API data
  const gatsbyItems = (data?.allMarkdownRemark?.nodes || [])
    .filter((node) => node.fields?.slug && node.fields?.collection !== "root")
    .map((node) => {
      const slug = node.fields?.slug || "";
      const titleFallback = slug.split("/").filter(Boolean).slice(-1)[0];
      // Convert static slug to query string format for dynamic note page
      const notePath = slug.replace(/^\//, '').replace(/\/$/, '');
      return {
        id: node.id,
        title: node.frontmatter?.title || titleFallback || "Untitled",
        excerpt: node.excerpt || "",
        slug: `/note?p=${encodeURIComponent(notePath)}`,
        collection: node.fields?.collection || "notes",
      };
    });

  // Use API data if Gatsby has no items, otherwise merge
  const items = gatsbyItems.length > 0 ? gatsbyItems : apiNotes;

  const counts = items.reduce(
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

  const rootCount = counts.root || 0;

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

  return (
    <main className="page">
      <Navbar apiStatus={apiStatus} />
      <CODStatusPanel />
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
                <div className="stat__value">{taskStats.todo}</div>
                <div className="stat__label">Active Tasks</div>
              </div>
            </div>
            <div className="stat" data-type="priority">
              <div className="stat__icon">🔥</div>
              <div className="stat__content">
                <div className="stat__value">{taskStats.highPriority}</div>
                <div className="stat__label">High Priority</div>
              </div>
            </div>
            <div className="stat" data-type="goals">
              <div className="stat__icon">🎯</div>
              <div className="stat__content">
                <div className="stat__value">{goalsCount}</div>
                <div className="stat__label">Goals</div>
              </div>
            </div>
          </div>
          <div className="stats-secondary">
            <div className="stat-mini">
              <span className="stat-mini__value">{taskStats.completed}</span>
              <span className="stat-mini__label">completed</span>
            </div>
            <div className="stat-mini">
              <span className="stat-mini__value">{counts.all}</span>
              <span className="stat-mini__label">notes</span>
            </div>
            <div className="stat-mini">
              <span className="stat-mini__value">{collectionKeys.length}</span>
              <span className="stat-mini__label">collections</span>
            </div>
          </div>
          <div className="quick-links">
            <Link to="/" className="quick-link quick-link--primary" title={apiStatus === "online" ? "Powered by Tasker API" : "Falling back to static content"}>
              <span className="quick-link__icon">📋</span>
              <span className="quick-link__label">
                View Tasks ({taskStats.todo || 0} active{taskStats.highPriority ? `, ${taskStats.highPriority} high` : ""})
              </span>
              <span className={`api-badge api-badge--${apiStatus}`}>
                {apiStatus === "online" ? "API online" : apiStatus === "offline" ? "API offline" : "API"}
              </span>
            </Link>
            <Link to="/goals" className="quick-link" title="Goals via Tasker API">
              <span className="quick-link__icon">🎯</span>
              <span className="quick-link__label">
                Goals ({goalsCount || 0})
              </span>
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
              {collection.label} ({counts[collection.key] || 0})
            </button>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="empty">
          No matches yet. Try a different query or change the collection filter.
        </div>
      ) : (
        <section className="grid">
          {filtered.map((item, index) => {
            // Get collection icon
            const collectionIcons = {
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
            const estimatedTime = taskInfo?.estimatedTimeMin;
            const goalId = taskInfo?.goalId;
            
            return (
              <Link
                key={item.id}
                to={item.slug}
                className="card"
                data-collection={item.collection}
                data-status={status}
                data-priority={priority >= 9 ? 'high' : priority >= 7 ? 'medium' : 'normal'}
                style={{ "--delay": `${Math.min(index, 20) * 0.03}s` }}
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
};

export const query = graphql`
  {
    allMarkdownRemark(sort: { frontmatter: { title: ASC } }) {
      nodes {
        id
        excerpt(pruneLength: 140)
        fields {
          slug
          collection
        }
        frontmatter {
          title
        }
      }
    }
  }
`;

export default IndexPage;
