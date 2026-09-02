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

export function formatNoteLabel(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function stripMarkdownExtension(value: string) {
  if (value.endsWith('.mdx')) return value.slice(0, -4);
  if (value.endsWith('.md')) return value.slice(0, -3);
  return value;
}

export function toNoteSearchPath(value: string) {
  const normalized = value.trim().replace(/^\/+/, '');
  return normalized.endsWith('.md') ? normalized.slice(0, -3) : normalized;
}

export function toApiNotePath(value: string) {
  const normalized = toNoteSearchPath(value);
  if (normalized.endsWith('.md') || normalized.endsWith('.mdx')) {
    return normalized;
  }
  return `${normalized}.md`;
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
    normalized.startsWith('tasks/') ||
    normalized.startsWith('notes/tasks/') ||
    /^notes\/projects\/[^/]+\/tasks\//.test(normalized)
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
  const runId = readStringValue(frontmatter._run_id);
  const isTask =
    frontmatter.type === 'task' ||
    isTaskPath(notePath) ||
    getNoteCollection(notePath) === 'tasks';
  const noteStatus = readStringValue(frontmatter.status);
  const isStaged = (source === 'extracted' || source === 'rejected') && !!runId;

  return {
    source,
    isTask,
    isCanonicalTask: source === 'canonical' && isTask,
    isStaged,
    canPromote: isStaged,
    canReject: source === 'extracted' && !!runId,
    canComplete:
      source === 'canonical' &&
      isTask &&
      noteStatus !== 'completed' &&
      noteStatus !== 'archived',
    canReview: source === 'canonical' && isTask,
    runId,
    targetPath: readStringValue(frontmatter._target_path),
    reviewStatus: readStringValue(frontmatter.review_status),
  };
}
