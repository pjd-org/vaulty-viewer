import React, { useEffect, useMemo, useState } from "react";
import { graphql, Link } from "gatsby";
import CODStatusPanel from "../components/CODStatusPanel";

const PREFERRED_COLLECTIONS = ["notes", "tasks", "reports"];

const formatLabel = (value) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getApiUrl = () => {
  if (typeof window !== "undefined" && window.TASKER_API_URL) {
    return window.TASKER_API_URL;
  }
  return "";
};

const IndexPage = ({ data }) => {
  const [query, setQuery] = useState("");
  const [activeCollection, setActiveCollection] = useState("all");
  const [apiNotes, setApiNotes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch notes from API at runtime
  useEffect(() => {
    const fetchNotes = async () => {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${apiUrl}/api/v1/notes`);
        if (response.ok) {
          const result = await response.json();
          // API returns { structuredContent: { notes: ["path1.md", "path2.md", ...] } }
          const notePaths = result.structuredContent?.notes || result.notes || [];
          if (notePaths.length > 0) {
            setApiNotes(notePaths.map((path, idx) => {
              const pathStr = typeof path === "string" ? path : (path.path || "");
              const title = pathStr.split("/").pop()?.replace(".md", "") || "Untitled";
              return {
                id: `api-${idx}`,
                title: formatLabel(title),
                excerpt: "",
                slug: `/${pathStr.replace(".md", "")}`,
                collection: deriveCollection(pathStr),
              };
            }));
          }
        }
      } catch (err) {
        console.error("[viewer] Failed to fetch notes from API:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, []);

  // Combine Gatsby static data with API data
  const gatsbyItems = (data?.allMarkdownRemark?.nodes || [])
    .filter((node) => node.fields?.slug && node.fields?.collection !== "root")
    .map((node) => {
      const slug = node.fields?.slug || "";
      const titleFallback = slug.split("/").filter(Boolean).slice(-1)[0];
      return {
        id: node.id,
        title: node.frontmatter?.title || titleFallback || "Untitled",
        excerpt: node.excerpt || "",
        slug,
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
      <CODStatusPanel />
      <header className="hero">
        <div className="hero__content">
          <p className="eyebrow">Vaulty Viewer</p>
          <h1>Vault notes, stories, and tasks in one pulse.</h1>
          <p className="lede">
            A lightweight Gatsby reader wired to your vault volume, plus a
            Decap CMS editor for quick markdown updates.
          </p>
        </div>
        <div className="hero__panel">
          <div className="stats">
            <div className="stat">
              <div className="stat__label">Total items</div>
              <div className="stat__value">{counts.all}</div>
            </div>
            <div className="stat">
              <div className="stat__label">Collections</div>
              <div className="stat__value">{collectionKeys.length}</div>
            </div>
            <div className="stat">
              <div className="stat__label">Root files</div>
              <div className="stat__value">{rootCount}</div>
            </div>
          </div>
          <div className="quick-links">
            <Link to="/avatar" className="quick-link">
              🧙 Avatar Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="toolbar">
        <label className="search" htmlFor="vault-search">
          <span>Search</span>
          <input
            id="vault-search"
            type="search"
            placeholder="Filter by title, excerpt, or path"
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
          {filtered.map((item, index) => (
            <Link
              key={item.id}
              to={item.slug}
              className="card"
              data-collection={item.collection}
              style={{ "--delay": `${index * 0.04}s` }}
            >
              <div className="card__meta">
                <span className="pill">{item.collection}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
            </Link>
          ))}
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
