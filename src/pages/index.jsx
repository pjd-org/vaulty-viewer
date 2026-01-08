import React, { useMemo, useState } from "react";
import { graphql, Link } from "gatsby";
import CODStatusPanel from "../components/CODStatusPanel";

const PREFERRED_COLLECTIONS = ["notes", "tasks", "reports"];

const formatLabel = (value) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const IndexPage = ({ data }) => {
  const [query, setQuery] = useState("");
  const [activeCollection, setActiveCollection] = useState("all");

  const items = data.allMarkdownRemark.nodes
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
    allMarkdownRemark(sort: { fields: [frontmatter___title], order: ASC }) {
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
