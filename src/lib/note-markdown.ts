import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

import { toNoteHref, toNoteSearchPath } from './note-path';

const INTERNAL_LINK_SCHEME = 'vault-note:';
const EXTERNAL_PROTOCOL = /^[a-z][a-z0-9+.-]*:/i;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const SANITIZE_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img',
    'input',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ]),
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'class', 'title'],
    code: ['class'],
    img: ['src', 'alt', 'title'],
    input: ['type', 'checked', 'disabled'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'obsidian'],
};

function rewriteWikiLinks(markdown: string) {
  return markdown
    .replace(
      /\[\[([^\]|]+)\|([^\]]+)\]\]/g,
      (_match, target: string, label: string) =>
        `[${label}](${INTERNAL_LINK_SCHEME}${toNoteSearchPath(target)})`
    )
    .replace(/\[\[([^\]]+)\]\]/g, (_match, target: string) => {
      const normalized = toNoteSearchPath(target);
      const label = normalized.split('/').pop() || normalized;
      return `[${label}](${INTERNAL_LINK_SCHEME}${normalized})`;
    });
}

function normalizeInternalHref(href: string) {
  if (!href) return null;
  if (href.startsWith(INTERNAL_LINK_SCHEME)) {
    return toNoteSearchPath(href.slice(INTERNAL_LINK_SCHEME.length));
  }
  if (href.startsWith('/note?p=')) {
    return toNoteSearchPath(decodeURIComponent(href.slice('/note?p='.length)));
  }
  if (href.startsWith('/note/')) {
    return toNoteSearchPath(href.slice('/note/'.length));
  }
  if (href.startsWith('#')) return null;
  if (href.startsWith('//')) return null;
  if (EXTERNAL_PROTOCOL.test(href)) return null;
  if (href.startsWith('/')) {
    return toNoteSearchPath(href);
  }
  return toNoteSearchPath(href);
}

function buildRenderer() {
  const renderer = new marked.Renderer();
  renderer.link = ({ href = '', title, text }) => {
    const internalHref = normalizeInternalHref(href);
    if (internalHref) {
      const resolvedHref = escapeHtml(toNoteHref(internalHref));
      const resolvedTitle = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${resolvedHref}" class="wikilink"${resolvedTitle}>${text}</a>`;
    }

    const safeHref = escapeHtml(href || '#');
    const safeTitle = title ? ` title="${escapeHtml(title)}"` : '';
    return `<a href="${safeHref}" target="_blank" rel="noreferrer noopener"${safeTitle}>${text}</a>`;
  };
  return renderer;
}

function applyTaskItemClasses(html: string) {
  return html
    .replace(
      /<li>\s*<input[^>]*checked[^>]*disabled[^>]*>\s*/g,
      '<li class="task-item task-done"><input type="checkbox" checked disabled /> '
    )
    .replace(
      /<li>\s*<input[^>]*disabled[^>]*>\s*/g,
      '<li class="task-item"><input type="checkbox" disabled /> '
    );
}

export function renderNoteMarkdown(markdown: string) {
  if (!markdown.trim()) return '';

  const prepared = rewriteWikiLinks(markdown);
  const rawHtml = marked.parse(prepared, {
    gfm: true,
    breaks: false,
    renderer: buildRenderer(),
  }) as string;

  return applyTaskItemClasses(sanitizeHtml(rawHtml, SANITIZE_OPTIONS).trim());
}
