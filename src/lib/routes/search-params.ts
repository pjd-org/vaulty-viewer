// ─── Primitive readers ────────────────────────────────────────────────────────

export function readStringSearchParam(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function readBooleanSearchParam(value: unknown): boolean | undefined {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

export function readEnumSearchParam<const T extends readonly string[]>(
  value: unknown,
  allowed: T
): T[number] | undefined {
  if (typeof value !== 'string') return undefined;
  return allowed.includes(value as T[number])
    ? (value as T[number])
    : undefined;
}

// ─── Per-route search-param schemas ──────────────────────────────────────────
// These are the canonical validateSearch shapes used by each top-level route.
// Routes import and spread these into their createFileRoute({ validateSearch }).

type S = Record<string, unknown>;

/** `/` — Home */
export function homeSearchParams(s: S): {
  q?: string;
  collection?: string;
  session?: string;
  snapshot?: string;
  detailId?: string;
} {
  return {
    q: readStringSearchParam(s.q),
    collection: readStringSearchParam(s.collection),
    session: readStringSearchParam(s.session),
    snapshot: readStringSearchParam(s.snapshot),
    detailId: readStringSearchParam(s.detailId),
  };
}

/** `/inbox` — `view` is the live field name; V3 extra fields additive */
export function inboxSearchParams(s: S): {
  view?: 'queue' | 'workbench' | 'archive';
  rejectedTab?: 'user' | 'automated';
  sort?: 'newest' | 'oldest' | 'confidence';
  severity?: 'high' | 'medium' | 'low';
  selectedId?: string;
} {
  return {
    view: readEnumSearchParam(s.view, [
      'queue',
      'workbench',
      'archive',
    ] as const),
    rejectedTab: readEnumSearchParam(s.rejectedTab, [
      'user',
      'automated',
    ] as const),
    sort: readEnumSearchParam(s.sort, [
      'newest',
      'oldest',
      'confidence',
    ] as const),
    severity: readEnumSearchParam(s.severity, [
      'high',
      'medium',
      'low',
    ] as const),
    selectedId: readStringSearchParam(s.selectedId),
  };
}

/** `/actions` — sort values match live route; `simulatableOnly` is additive V3 field */
export function actionsSearchParams(s: S) {
  return {
    sort: readEnumSearchParam(s.sort, [
      'urgency',
      'impact',
      'confidence',
      'source',
      'reversibility',
    ] as const),
    simulatableOnly: readBooleanSearchParam(s.simulatableOnly),
    selectedId: readStringSearchParam(s.selectedId),
  };
}

/** `/automation` */
export function automationSearchParams(s: S) {
  return {
    tab: readEnumSearchParam(s.tab, [
      'pipelines',
      'runners',
      'huey',
      'schedules',
    ] as const),
    subtab: readStringSearchParam(s.subtab),
    selectedId: readStringSearchParam(s.selectedId),
    autoRefresh: readBooleanSearchParam(s.autoRefresh),
  };
}

/** `/work` */
export function workSearchParams(s: S): {
  tab?: 'tasks' | 'projects' | 'dependencies';
  status?: string;
  selectedId?: string;
} {
  return {
    tab: readEnumSearchParam(s.tab, [
      'tasks',
      'projects',
      'dependencies',
    ] as const),
    status: readStringSearchParam(s.status),
    selectedId: readStringSearchParam(s.selectedId),
  };
}

/** `/knowledge` */
export function knowledgeSearchParams(s: S): {
  tab?: 'notes' | 'views' | 'memories';
  noteId?: string;
  mode?: 'read' | 'edit';
  templateId?: string;
  memoryTab?: string;
  projectId?: string;
} {
  return {
    tab: readEnumSearchParam(s.tab, ['notes', 'views', 'memories'] as const),
    noteId: readStringSearchParam(s.noteId),
    mode: readEnumSearchParam(s.mode, ['read', 'edit'] as const),
    templateId: readStringSearchParam(s.templateId),
    memoryTab: readStringSearchParam(s.memoryTab),
    projectId: readStringSearchParam(s.projectId),
  };
}

/** `/portfolio` */
export function portfolioSearchParams(s: S) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
  };
}

/** `/bubble` */
export function bubbleSearchParams(s: S) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
  };
}

/** `/health` */
export function healthSearchParams(s: S) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
  };
}

/** `/graph` — live fields preserved; `focus` + `selectedId` are additive V3 fields */
export function graphSearchParams(s: S) {
  return {
    tab: readStringSearchParam(s.tab),
    nodeId: readStringSearchParam(s.nodeId),
    pathMode: readStringSearchParam(s.pathMode),
    entityType: readStringSearchParam(s.entityType),
    focus: readStringSearchParam(s.focus),
    selectedId: readStringSearchParam(s.selectedId),
  };
}

/** `/timeline` — live fields preserved; `from`/`to` are additive V3 fields */
export function timelineSearchParams(s: S) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
    live: readBooleanSearchParam(s.live),
    eventType: readStringSearchParam(s.eventType),
    from: readStringSearchParam(s.from),
    to: readStringSearchParam(s.to),
  };
}

/** `/archive` — `source` preserved from live route; V3 fields additive */
export function archiveSearchParams(s: S) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
    source: readStringSearchParam(s.source),
    scope: readStringSearchParam(s.scope),
    from: readStringSearchParam(s.from),
    to: readStringSearchParam(s.to),
    eventType: readStringSearchParam(s.eventType),
    projectId: readStringSearchParam(s.projectId),
  };
}

/** `/notes` — browse and search vault notes */
export function notesSearchParams(s: S): {
  q?: string;
  collection?: 'human' | 'agent' | 'bubble';
} {
  return {
    q: readStringSearchParam(s.q),
    collection: readEnumSearchParam(s.collection, [
      'human',
      'agent',
      'bubble',
    ] as const),
  };
}

/** `/project/:slug` (and subroutes) */
export function projectSearchParams(s: S) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
    noteId: readStringSearchParam(s.noteId),
    mode: readEnumSearchParam(s.mode, ['read', 'edit'] as const),
    templateId: readStringSearchParam(s.templateId),
    memoryTab: readStringSearchParam(s.memoryTab),
  };
}
