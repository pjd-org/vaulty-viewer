import React from "react";
import { graphql, Link } from "gatsby";

const MarkdownPage = ({ data }) => {
  const { markdownRemark } = data;
  const title = markdownRemark.frontmatter?.title || "Untitled";
  const rawTags = markdownRemark.frontmatter?.tags;
  const tags = Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : [];

  return (
    <main className="page page--detail">
      <header className="detail__header">
        <Link to="/" className="back-link">
          {"<- Back to vault"}
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

export const query = graphql`
  query MarkdownPage($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      fields {
        collection
        slug
      }
      frontmatter {
        title
        tags
      }
    }
  }
`;

export default MarkdownPage;
