import React from 'react';
import { Link } from 'gatsby';
import CODStatusPanel from '../components/CODStatusPanel';

const MarkdownPage = ({ pageContext }) => {
  const markdownRemark = {
    html: pageContext.html,
    fields: {
      collection: pageContext.collection,
      slug: pageContext.slug,
    },
    frontmatter: {
      title: pageContext.title,
      tags: pageContext.tags,
    },
  };

  const title = markdownRemark.frontmatter?.title || 'Untitled';
  const rawTags = markdownRemark.frontmatter?.tags;
  const tags = Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : [];

  return (
    <main className="page page--detail">
      <CODStatusPanel />
      <header className="detail__header">
        <Link to="/" className="back-link">
          {'<- Back to vault'}
        </Link>
        <div className="card__meta">
          <span className="pill">{markdownRemark.fields.collection}</span>
        </div>
        <h1>{title}</h1>
        {tags.length > 0 && (
          <div className="tag-list">
            {tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>
      <article
        className="content"
        dangerouslySetInnerHTML={{ __html: markdownRemark.html }}
      />
    </main>
  );
};

export default MarkdownPage;
