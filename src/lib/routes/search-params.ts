// ─── Primitive readers ────────────────────────────────────────────────────────

export function readStringSearchParam(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

export function readBooleanSearchParam(value: unknown): boolean | undefined {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return undefined
}

export function readEnumSearchParam<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number] | undefined {
  if (typeof value !== 'string') return undefined
  return allowed.includes(value as T[number]) ? (value as T[number]) : undefined
}

// ─── Per-route search-param schemas ──────────────────────────────────────────
// These are the canonical validateSearch shapes used by each top-level route.
// Routes import and spread these into their createFileRoute({ validateSearch }).

type S = Record<string, unknown>

/** `/` — Home */
export function homeSearchParams(s: S) {
  return {
    snapshot: readStringSearchParam(s.snapshot),
    detailId: readStringSearchParam(s.detailId),
  }
}

/** `/inbox` */
export function inboxSearchParams(s: S) {
  return {
    tab: readEnumSearchParam(s.tab, ['queue', 'workbench', 'archive'] as const),
    rejectedTab: readEnumSearchParam(s.rejectedTab, ['user', 'automated'] as const),
    sort: readEnumSearchParam(s.sort, ['newest', 'oldest', 'confidence'] as const),
    severity: readEnumSearchParam(s.severity, ['high', 'medium', 'low'] as const),
    selectedId: readStringSearchParam(s.selectedId),
  }
}

/** `/actions` */
export function actionsSearchParams(s: S) {
  return {
    sort: readEnumSearchParam(s.sort, ['priority', 'newest', 'effort'] as const),
    simulatableOnly: readBooleanSearchParam(s.simulatableOnly),
    selectedId: readStringSearchParam(s.selectedId),
  }
}

/** `/automation` */
export function automationSearchParams(s: S) {
  return {
    tab: readEnumSearchParam(s.tab, ['pipelines', 'runners', 'huey', 'schedules'] as const),
    subtab: readStringSearchParam(s.subtab),
    selectedId: readStringSearchParam(s.selectedId),
    autoRefresh: readBooleanSearchParam(s.autoRefresh),
  }
}

/** `/work` */
export function workSearchParams(s: S) {
  return {
    tab: readEnumSearchParam(s.tab, ['tasks', 'projects', 'dependencies'] as const),
    status: readStringSearchParam(s.status),
    selectedId: readStringSearchParam(s.selectedId),
  }
}

/** `/knowledge` */
export function knowledgeSearchParams(s: S) {
  return {
    tab: readEnumSearchParam(s.tab, ['notes', 'views', 'memories'] as const),
    noteId: readStringSearchParam(s.noteId),
    mode: readEnumSearchParam(s.mode, ['read', 'edit'] as const),
    templateId: readStringSearchParam(s.templateId),
    memoryTab: readStringSearchParam(s.memoryTab),
    projectId: readStringSearchParam(s.projectId),
  }
}

/** `/portfolio` */
export function portfolioSearchParams(s: S) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
  }
}

/** `/bubble` */
export function bubbleSearchParams(s: S) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
  }
}

/** `/health` */
export function healthSearchParams(s: S) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
  }
}

/** `/graph` */
export function graphSearchParams(s: S) {
  return {
    selectedId: readStringSearchParam(s.selectedId),
    focus: readStringSearchParam(s.focus),
  }
}

/** `/timeline` */
export function timelineSearchParams(s: S) {
  return {
    tab: readEnumSearchParam(s.tab, ['all', 'user', 'automated'] as const),
    selectedId: readStringSearchParam(s.selectedId),
    from: readStringSearchParam(s.from),
    to: readStringSearchParam(s.to),
  }
}

/** `/archive` */
export function archiveSearchParams(s: S) {
  return {
    tab: readEnumSearchParam(s.tab, ['all', 'user', 'automated'] as const),
    scope: readStringSearchParam(s.scope),
    from: readStringSearchParam(s.from),
    to: readStringSearchParam(s.to),
    eventType: readStringSearchParam(s.eventType),
    selectedId: readStringSearchParam(s.selectedId),
    projectId: readStringSearchParam(s.projectId),
  }
}

/** `/project/:slug` (and subroutes) */
export function projectSearchParams(s: S) {
  return {
    tab: readStringSearchParam(s.tab),
    selectedId: readStringSearchParam(s.selectedId),
    noteId: readStringSearchParam(s.noteId),
  }
}
