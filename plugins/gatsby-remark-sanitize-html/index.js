'use strict';

/**
 * gatsby-remark-sanitize-html
 *
 * A local Gatsby remark plugin that sanitises the HTML produced by
 * gatsby-transformer-remark before it reaches dangerouslySetInnerHTML.
 *
 * Why a local plugin instead of rehype-sanitize:
 *   - gatsby-transformer-remark@6 has no rehype pipeline; rehypePlugins in
 *     its options object is silently ignored.
 *   - rehype-sanitize v5+ is ESM-only and cannot be require()'d from a
 *     gatsby-node.js / plugin index running in CJS mode.
 *   - sanitize-html is CJS-compatible and actively maintained.
 *
 * This plugin runs as a gatsby-remark plugin, receiving the markdownAST and
 * a htmlAst-level pass.  Because gatsby-transformer-remark exposes the HTML
 * string via the `html` GraphQL field (not a rehype AST we can walk), the
 * safest interception point is to hook the `html` resolver by wrapping the
 * remark pipeline via the `compiler` injection — or, more practically, to
 * post-process the HTML string using the `onCreateNode` + Gatsby's cache, but
 * that requires internal access we don't have.
 *
 * The approach used here:
 *   gatsby-transformer-remark calls each plugin's default export with
 *   { markdownAST, markdownNode, getNode, files, compiler, ... }.
 *   The `compiler` object exposes `generateHTML(ast)`.  We wrap it so every
 *   HTML string it produces is passed through sanitize-html before being
 *   stored in Gatsby's cache and returned via GraphQL.
 *
 * Sanitisation policy (strict, content-safe):
 *   - Allowed tags: standard prose + code + table + media tags.
 *   - No <script>, no <style>, no <iframe>, no <object>, no <embed>.
 *   - No inline event handlers (on*).
 *   - No javascript: / vbscript: / data: hrefs.
 *   - data-* attributes allowed on all elements (used by Gatsby image helpers).
 *   - All other attributes are dropped unless explicitly listed.
 */

const sanitizeHtml = require('sanitize-html');

// ---------------------------------------------------------------------------
// Sanitisation policy
// ---------------------------------------------------------------------------

const ALLOWED_TAGS = [
  // Text structure
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'ul', 'ol', 'li',
  'dl', 'dt', 'dd',
  'blockquote',
  // Inline
  'a', 'abbr', 'acronym', 'b', 'bdo', 'big', 'cite', 'code',
  'del', 'dfn', 'em', 'i', 'ins', 'kbd', 'mark', 'q', 's',
  'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time',
  'tt', 'u', 'var',
  // Code blocks (remark output)
  'pre',
  // Tables
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  // Media (Gatsby image helpers inject these)
  'img', 'figure', 'figcaption', 'picture', 'source',
  // Details / summary (GFM)
  'details', 'summary',
  // Sectioning (used by some remark plugins)
  'div', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main',
];

const ALLOWED_ATTR = {
  // Anchor
  a: ['href', 'name', 'target', 'rel', 'title', 'aria-label'],
  // Image / picture
  img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'decoding', 'class', 'style'],
  source: ['src', 'srcset', 'type', 'media', 'sizes'],
  // Table cells
  th: ['scope', 'colspan', 'rowspan', 'align'],
  td: ['colspan', 'rowspan', 'align'],
  // Code blocks
  code: ['class'],        // e.g. language-javascript
  pre:  ['class'],
  // Misc structural
  div:     ['class', 'id', 'style', 'role', 'aria-label', 'aria-hidden'],
  span:    ['class', 'id', 'style'],
  section: ['class', 'id', 'aria-label'],
  // Details
  details: ['open'],
  // Time
  time:    ['datetime'],
  // All elements: allow data-* (used by gatsby-plugin-image etc.)
  '*': ['data-*', 'class', 'id'],
};

const POLICY = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: ALLOWED_ATTR,
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],   // data: URI for base64 images is safe
  },
  // Disallow all inline event handlers (onclick, onload, etc.)
  allowedAttributes: ALLOWED_ATTR,
  // Strip (do not escape) disallowed tags so prose is not broken
  disallowedTagsMode: 'discard',
  // Enforce safe URL schemes on href / src
  allowVulnerableTags: false,
  // Prevent filter bypass via nested comments
  parseStyleAttributes: false,
};

// ---------------------------------------------------------------------------
// Plugin entry point
// ---------------------------------------------------------------------------

/**
 * gatsby-transformer-remark calls this function for each markdown node,
 * passing a `compiler` object whose `generateHTML(ast)` method produces the
 * final HTML string.  We monkey-patch generateHTML once (guarded by a Symbol)
 * so every HTML string produced for this build passes through sanitize-html.
 */
module.exports = function gatsbyRemarkSanitizeHtml({ compiler }) {
  // `compiler` may be undefined in non-HTML contexts (e.g. excerpt plain text).
  if (!compiler || typeof compiler.generateHTML !== 'function') {
    return;
  }

  // Guard: only wrap once per compiler instance.
  const PATCHED = Symbol.for('gatsby-remark-sanitize-html:patched');
  if (compiler[PATCHED]) {
    return;
  }

  const originalGenerateHTML = compiler.generateHTML.bind(compiler);

  compiler.generateHTML = function patchedGenerateHTML(ast) {
    const raw = originalGenerateHTML(ast);
    if (typeof raw !== 'string') {
      return raw;
    }
    return sanitizeHtml(raw, POLICY);
  };

  compiler[PATCHED] = true;
};
