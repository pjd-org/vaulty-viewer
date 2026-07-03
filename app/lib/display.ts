import { formatDuration } from '../../src/lib/focus-logic';
import type {
  TaskDisplayMeta,
  ProjectSummaryDisplay,
  CodDisplayState,
  InboxItemDisplay,
  NoteHeaderDisplay,
} from '../types/display';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatRelativeAge(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const ms = Date.now() - Date.parse(dateStr);
  if (isNaN(ms) || ms < 0) return '';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export function toTaskDisplayMeta(task: {
  estimatedTimeMin?: number | null;
  focusCost?: number | null;
  effortScore?: number | null;
  score?: number | null;
  status?: string | null;
}): TaskDisplayMeta {
  const min = task.estimatedTimeMin ?? 0;
  const durationLabel =
    !min || min <= 0 ? 'Unknown duration' : formatDuration(min);

  const fc = task.focusCost ?? null;
  const focusLabel =
    fc === null
      ? 'Unknown focus'
      : fc <= 2
        ? 'Low focus'
        : fc <= 4
          ? 'Medium focus'
          : 'Deep focus';
  const focusVariant: TaskDisplayMeta['focusVariant'] =
    fc === null ? 'low' : fc <= 2 ? 'low' : fc <= 4 ? 'medium' : 'deep';

  const score = task.score ?? null;
  const scoreLabel: string | null =
    score === null
      ? null
      : score >= 1.5
        ? 'Best fit'
        : score >= 1
          ? 'Good fit'
          : 'Lower fit';
  const scoreVariant: TaskDisplayMeta['scoreVariant'] =
    score === null
      ? null
      : score >= 1.5
        ? 'best'
        : score >= 1
          ? 'good'
          : 'lower';

  const effort = task.effortScore ?? 0;
  const effortLabel =
    !effort || effort <= 0 ? 'Light' : effort <= 4 ? 'Moderate' : 'Heavy';

  const statusMap: Record<string, string> = {
    todo: 'To do',
    'in-progress': 'In progress',
    blocked: 'Blocked',
    done: 'Done',
    backlog: 'Backlog',
  };
  const rawStatus = task.status ?? '';
  const statusLabel =
    statusMap[rawStatus] ?? (capitalize(rawStatus) || 'Unknown');

  return {
    durationLabel,
    focusLabel,
    focusVariant,
    scoreLabel,
    scoreVariant,
    effortLabel,
    statusLabel,
  };
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export function toProjectSummaryDisplay(project: {
  id?: string | null;
  title?: string;
  status?: string | null;
  taskCount?: number | null;
  completedTaskCount?: number | null;
  dueDate?: string | null;
  nextAction?: { title?: string } | null;
}): ProjectSummaryDisplay {
  const title = project.title ?? 'Untitled project';

  const statusMap: Record<
    string,
    { label: string; variant: ProjectSummaryDisplay['statusVariant'] }
  > = {
    active: { label: 'On track', variant: 'success' },
    blocked: { label: 'Blocked', variant: 'danger' },
    'at-risk': { label: 'At risk', variant: 'warning' },
    completed: { label: 'Completed', variant: 'default' },
  };
  const mapped = statusMap[project.status ?? ''] ?? {
    label: 'Active',
    variant: 'success' as const,
  };
  const statusLabel = mapped.label;
  const statusVariant = mapped.variant;

  const total = project.taskCount ?? 0;
  const done = project.completedTaskCount ?? 0;
  const progressText = `${done} / ${total} tasks`;
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  let etaLabel: string | null = null;
  if (project.dueDate) {
    const due = Date.parse(project.dueDate);
    if (!isNaN(due)) {
      etaLabel =
        due < Date.now() ? 'Overdue' : formatShortDate(project.dueDate);
    }
  }

  const bestMoveTitle = project.nextAction?.title ?? null;

  return {
    id: project.id ?? '',
    title,
    statusLabel,
    statusVariant,
    progressText,
    progressPercent,
    etaLabel,
    bestMoveTitle,
  };
}

// ---------------------------------------------------------------------------
// COD
// ---------------------------------------------------------------------------

type SeverityVariant = CodDisplayState['severityVariant'];

function resolveSeverity(
  status: string | null | undefined,
  level: number | null | undefined
): SeverityVariant {
  if (status === 'UNKNOWN' || status == null) return 'unknown';
  if (status === 'FAIL' || level === 0) return 'stop';
  if (status === 'WARN') {
    if (level != null && level <= 2) return 'rest';
    return 'warn';
  }
  return 'clear';
}

const SEVERITY_LABELS: Record<SeverityVariant, string> = {
  clear: 'All clear',
  warn: 'Light sprint only',
  rest: 'Rest mode',
  stop: 'Emergency stop',
  unknown: 'No data',
};

const SEVERITY_HEADLINES: Record<SeverityVariant, string> = {
  clear: 'You are ready for full focus work.',
  warn: 'Capacity is limited — keep sessions short.',
  rest: 'Low energy detected. Light tasks only.',
  stop: 'Do not start new work sessions right now.',
  unknown: 'Check in to calibrate your state.',
};

const SEVERITY_ACTIONS: Record<SeverityVariant, string[]> = {
  clear: ['Start full session', 'Plan 90m'],
  warn: ['Start 25m sprint', 'Check in', 'Browse safe tasks'],
  rest: ['Check in', 'Browse safe tasks'],
  stop: ['Check in'],
  unknown: ['Check in'],
};

export function toCodDisplayState(cod: {
  status?: string | null;
  level?: number | null;
  constraints?: Record<string, unknown> | null;
  signals?: Record<string, unknown> | null;
  reason?: string | null;
}): CodDisplayState {
  const severityVariant = resolveSeverity(cod.status, cod.level);
  const severityLabel = SEVERITY_LABELS[severityVariant];
  const headline = SEVERITY_HEADLINES[severityVariant];
  const actionLabels = SEVERITY_ACTIONS[severityVariant];

  const constraintItems: CodDisplayState['constraintItems'] = Object.entries(
    cod.constraints ?? {}
  ).map(([k, v]) => ({
    label: capitalize(k.replace(/_/g, ' ')),
    value: String(v ?? ''),
  }));

  const signalItems: CodDisplayState['signalItems'] = Object.entries(
    cod.signals ?? {}
  ).map(([k, v]) => {
    const num = typeof v === 'number' ? v : null;
    const variant: CodDisplayState['signalItems'][number]['variant'] =
      num === null ? undefined : num >= 70 ? 'ok' : num >= 40 ? 'warn' : 'bad';
    return {
      label: capitalize(k.replace(/_/g, ' ')),
      value: String(v ?? ''),
      variant,
    };
  });

  const reasonText = cod.reason ?? '';

  return {
    severityLabel,
    severityVariant,
    headline,
    actionLabels,
    constraintItems,
    signalItems,
    reasonText,
  };
}

// ---------------------------------------------------------------------------
// Inbox item
// ---------------------------------------------------------------------------

const ORIGIN_MAP: Record<string, string> = {
  llm: 'From LLM',
  agent: 'From agent',
  seed: 'Seed',
  manual: 'Manual',
};

export function toInboxItemDisplay(item: {
  title?: string;
  _source?: string;
  _run_id?: string | null;
  description?: string | null;
  createdAt?: string | null;
  status?: string | null;
}): InboxItemDisplay {
  const title = item.title ?? 'Untitled';
  const originLabel = ORIGIN_MAP[item._source ?? ''] ?? 'Unknown';

  const desc = item.description ?? '';
  const contextSnippet = desc.length > 120 ? desc.slice(0, 120) + '...' : desc;

  const ageLabel = formatRelativeAge(item.createdAt);

  const isBlocked = item.status === 'blocked';
  const actions: InboxItemDisplay['actions'] = ['inspect'];
  if (!isBlocked) actions.push('promote');
  actions.push('reject');

  const runId = item._run_id ?? null;

  return {
    title,
    originLabel,
    contextSnippet,
    ageLabel,
    actions,
    isBlocked,
    runId,
  };
}

// ---------------------------------------------------------------------------
// Note header
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  task: 'Task',
  spec: 'Spec',
  decision: 'Decision',
  config: 'Config',
  'skill-definition': 'Skill',
};

function statusToVariant(
  status: string | null | undefined
): NoteHeaderDisplay['statusVariant'] {
  switch (status) {
    case 'done':
    case 'completed':
      return 'success';
    case 'blocked':
      return 'danger';
    case 'in-progress':
      return 'warning';
    default:
      return 'default';
  }
}

function pathToBreadcrumbs(
  path: string | undefined
): NoteHeaderDisplay['breadcrumbs'] {
  if (!path) return [];
  const segments = path.replace(/\.md$/, '').split('/').filter(Boolean);
  return segments.map((seg, i) => ({
    label: capitalize(seg.replace(/-/g, ' ')),
    path: '/' + segments.slice(0, i + 1).join('/'),
  }));
}

export function toNoteHeaderDisplay(note: {
  title?: string;
  type?: string | null;
  status?: string | null;
  path?: string;
}): NoteHeaderDisplay {
  const title = note.title ?? 'Untitled';
  const typeLabel =
    TYPE_LABELS[note.type ?? ''] ?? (capitalize(note.type ?? '') || 'Note');
  const statusLabel = note.status
    ? ({
        todo: 'To do',
        'in-progress': 'In progress',
        blocked: 'Blocked',
        done: 'Done',
        backlog: 'Backlog',
        completed: 'Completed',
      }[note.status] ?? capitalize(note.status))
    : null;

  const statusVariant = statusToVariant(note.status);
  const breadcrumbs = pathToBreadcrumbs(note.path);

  const primaryActions: NoteHeaderDisplay['primaryActions'] =
    note.type === 'task'
      ? [
          { label: 'Start', variant: 'primary', action: 'start' },
          { label: 'Open details', variant: 'secondary', action: 'open' },
        ]
      : [{ label: 'Open', variant: 'primary', action: 'open' }];

  return {
    title,
    typeLabel,
    statusLabel,
    statusVariant,
    breadcrumbs,
    primaryActions,
  };
}
