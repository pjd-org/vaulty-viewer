const path = require('path');

exports.onCreateDevServer = ({ app }) => {
  const apiOrigin =
    process.env.GATSBY_VAULT_API_URL ||
    `http://localhost:${process.env.API_PORT || 4300}`;

  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      [
        `default-src 'self'`,
        `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `font-src 'self' data: https://fonts.gstatic.com`,
        `img-src 'self' data: blob:`,
        `connect-src 'self' ${apiOrigin} ws://localhost:* wss://localhost:*`,
      ].join('; ')
    );
    next();
  });
};

const IGNORED_DIRS = new Set([
  '_system',
  'templates',
  '.obsidian',
  '.vault',
  '.git',
]);

const normalizePath = (value) => value.split(path.sep).join('/');

const shouldIgnore = (relativePath) => {
  if (!relativePath) {
    return true;
  }

  const normalized = normalizePath(relativePath);
  const segments = normalized.split('/');
  const fileName = segments[segments.length - 1].toLowerCase();

  if (segments.length === 1) {
    return true;
  }

  if (segments.some((segment) => IGNORED_DIRS.has(segment))) {
    return true;
  }

  if (segments.some((segment) => segment.startsWith('.vault-'))) {
    return true;
  }

  if (fileName.startsWith('config.')) {
    return true;
  }

  if (fileName.includes('.config.')) {
    return true;
  }

  return false;
};

const buildSlug = (relativePath) => {
  const normalized = normalizePath(relativePath);
  const parsed = path.posix.parse(normalized);
  const segments = normalized.split('/');

  const slugParts =
    segments.length > 1
      ? segments.slice(0, -1).concat(parsed.name)
      : [parsed.name];

  if (slugParts.length === 0 || slugParts[0] === '') {
    return '/untitled/';
  }

  return `/${slugParts.join('/')}/`;
};

exports.onCreateNode = ({ node, getNode, actions }) => {
  if (node.internal.type !== 'MarkdownRemark') {
    return;
  }

  const fileNode = getNode(node.parent);
  const relativePath = fileNode?.relativePath || '';

  if (shouldIgnore(relativePath)) {
    return;
  }

  const normalized = normalizePath(relativePath);
  const segments = normalized.split('/');
  const collection = segments.length > 1 ? segments[0] : 'root';
  const slug = buildSlug(relativePath);

  actions.createNodeField({
    node,
    name: 'collection',
    value: collection,
  });
  actions.createNodeField({
    node,
    name: 'slug',
    value: slug,
  });
};

// Explicitly define schema to prevent errors when fields are missing
exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  createTypes(`
    type MarkdownRemarkFields {
      slug: String
      collection: String
    }
    type MarkdownRemarkFrontmatter {
      title: String
      tags: [String]
      status: String
      priority: Int
      estimatedTimeMin: Int
      effortScore: Int
      focusCost: Int
      goalId: String
      projectId: String
      completedAt: Date @dateformat
    }
    type MarkdownRemark implements Node {
      fields: MarkdownRemarkFields
      frontmatter: MarkdownRemarkFrontmatter
      html: String
      excerpt: String
    }
  `);
};

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;
  const template = path.resolve('./src/templates/markdown-page.jsx');

  const result = await graphql(`
    {
      allMarkdownRemark {
        nodes {
          id
          html
          fields {
            slug
            collection
          }
          frontmatter {
            title
            tags
          }
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panicOnBuild('Error loading markdown content', result.errors);
    return;
  }

  result.data.allMarkdownRemark.nodes.forEach((node) => {
    if (!node.fields?.slug) {
      return;
    }
    createPage({
      path: node.fields.slug,
      component: template,
      context: {
        id: node.id,
        html: node.html,
        slug: node.fields.slug,
        collection: node.fields.collection,
        title: node.frontmatter?.title,
        tags: node.frontmatter?.tags || [],
      },
    });
  });
};
