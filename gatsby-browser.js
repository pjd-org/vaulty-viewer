'use strict';

require('./src/styles.css');

/**
 * Mermaid client-side rendering.
 *
 * gatsby-transformer-remark renders fenced ```mermaid blocks as:
 *   <pre><code class="language-mermaid">...</code></pre>
 *
 * Mermaid expects either:
 *   <pre class="mermaid">...</pre>
 *   OR a call to mermaid.run({ nodes }) with the target elements.
 *
 * Strategy:
 *   1. Find all <code class="language-mermaid"> elements.
 *   2. Replace the wrapping <pre> with <div class="mermaid"> containing
 *      the decoded text content (remark HTML-encodes < > & inside code blocks).
 *   3. Call mermaid.run() on the new nodes.
 *
 * Runs on every route change (onRouteUpdate) so diagrams render on
 * both initial page load and client-side navigation.
 *
 * Mermaid is loaded lazily (dynamic import) so it does not bloat the
 * initial JS bundle for pages that have no diagrams.
 */

const MERMAID_THEME = 'neutral';

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function renderMermaid() {
  const codeBlocks = document.querySelectorAll('code.language-mermaid');
  if (codeBlocks.length === 0) {
    return;
  }

  const mermaid = (await import('mermaid')).default;

  mermaid.initialize({
    startOnLoad: false,
    theme: MERMAID_THEME,
    securityLevel: 'strict',
    fontFamily: 'inherit',
  });

  const targets = [];

  codeBlocks.forEach((code) => {
    const pre = code.parentElement;
    if (!pre) return;

    const source = decodeHtmlEntities(code.textContent || '');

    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = source;

    pre.replaceWith(div);
    targets.push(div);
  });

  if (targets.length > 0) {
    await mermaid.run({ nodes: targets });
  }
}

exports.onRouteUpdate = function () {
  // Defer to next tick so Gatsby has finished injecting the page HTML.
  setTimeout(renderMermaid, 0);
};
