import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export type NoteSource = 'canonical' | 'inbox' | 'extracted' | 'rejected';

export type NoteLifecycle = {
  source: NoteSource;
  isTask: boolean;
  isCanonicalTask: boolean;
  isStaged: boolean;
  canPromote: boolean;
  canReject: boolean;
  canComplete: boolean;
  canReview: boolean;
  runId: string | null;
  targetPath: string | null;
  reviewStatus: string | null;
};

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

export function formatNoteLabel(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function stripMarkdownExtension(value: string) {
  return value.endsWith('.md') ? value.slice(0, -3) : value;
}

export function toNoteSearchPath(value: string) {
  return stripMarkdownExtension(value.trim().replace(/^\/+/, ''));
}

export function toApiNotePath(value: string) {
  const normalized = toNoteSearchPath(value);
  return normalized.endsWith('.md') ? normalized : `${normalized}.md`;
}

export function toNoteHref(value: string) {
  return `/note?p=${encodeURIComponent(toNoteSearchPath(value))}`;
}

export function getNoteSource(value: string): NoteSource {
  const normalized = toNoteSearchPath(value);
  if (normalized.startsWith('inbox/rejected/')) return 'rejected';
  if (normalized.startsWith('inbox/extracted/')) return 'extracted';
  if (normalized.startsWith('inbox/')) return 'inbox';
  return 'canonical';
}

export function getNoteCollection(value: string) {
  const normalized = toNoteSearchPath(value);
  const parts = normalized.split('/').filter(Boolean);
  if (parts[0] === 'notes' && parts[1]) return parts[1];
  if (parts[0] === 'inbox' && parts[1]) {
    if (parts[1] === 'rejected' || parts[1] === 'extracted') return parts[1];
    return 'inbox';
  }
  return parts[0] || 'notes';
}

function isTaskPath(value: string) {
  const normalized = toNoteSearchPath(value);
  return (
    normalized.startsWith('tasks/') || normalized.startsWith('notes/tasks/')
  );
}

function readStringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export function getLifecycleContext(
  notePath: string,
  frontmatter: Record<string, unknown>
): NoteLifecycle {
  const source = getNoteSource(notePath);
  const isTask =
    frontmatter.type === 'task' ||
    isTaskPath(notePath) ||
    getNoteCollection(notePath) === 'tasks';
  const noteStatus = readStringValue(frontmatter.status);

  return {
    source,
    isTask,
    isCanonicalTask: source === 'canonical' && isTask,
    isStaged: source === 'extracted' || source === 'rejected',
    canPromote: source === 'extracted' || source === 'rejected',
    canReject: source === 'extracted',
    canComplete:
      source === 'canonical' &&
      isTask &&
      noteStatus !== 'completed' &&
      noteStatus !== 'archived',
    canReview: source === 'canonical' && isTask,
    runId: readStringValue(frontmatter._run_id),
    targetPath: readStringValue(frontmatter._target_path),
    reviewStatus: readStringValue(frontmatter.review_status),
  };
}

function rewriteWikiLinks(markdown: string) {
  return markdown
    .replace(
      /\[\[([^\]|]+)\|([^\]]+)\]\]/g,
      (_match, target: string, label: string) =>
        `[${label}](${INTERNAL_LINK_SCHEME}${target})`
    )
    .replace(/\[\[([^\]]+)\]\]/g, (_match, target: string) => {
      const normalized = toNoteSearchPath(target);
      const label = normalized.split('/').pop() || normalized;
      return `[${label}](${INTERNAL_LINK_SCHEME}${target})`;
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
  if (href.startsWith('#') || href.startsWith('/')) return null;
  if (EXTERNAL_PROTOCOL.test(href)) return null;
  return toNoteSearchPath(href);
}

function buildRenderer() {
  const renderer = new marked.Renderer();
  renderer.link = ({ href = '', title, text }) => {
    const internalHref = normalizeInternalHref(href);
    if (internalHref) {
      const resolvedHref = escapeHtml(toNoteHref(internalHref));
      const resolvedTitle = title
        ? ` title="${escapeHtml(title)}"`
        : '';
      return `<a href="${resolvedHref}" class="wikilink"${resolvedTitle}>${text}</a>`;
    }

    const safeHref = escapeHtml(href || '#');
    const safeTitle = title
      ? ` title="${escapeHtml(title)}"`
      : '';
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

  return applyTaskItemClasses(
    sanitizeHtml(rawHtml, SANITIZE_OPTIONS).trim()
  );
}
