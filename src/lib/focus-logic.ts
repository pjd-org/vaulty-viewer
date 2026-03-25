export interface NextAction {
  id: string;
  path: string;
  title: string;
  score: number;
  priority: number;
  effortScore: number;
  focusCost: number;
  estimatedTimeMin: number;
  status: string;
  tags: string[];
  dueDate?: string;
  projectId?: string;
  goalId?: string;
  description?: string;
  blockers?: unknown[];
}

export interface ActiveSession {
  id: string;
  status: 'planned' | 'active' | 'completed' | 'aborted';
  title?: string;
  budgetMin: number;
  startedAt?: string;
  tasks: SessionTask[];
}

export interface SessionTask {
  id: string;
  title: string;
  path: string;
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
  effortScore?: number;
}

export function normalizeNextAction(raw: Record<string, unknown>): NextAction {
  return {
    id: String(raw.id ?? raw.path ?? ''),
    path: String(raw.path ?? ''),
    title: String(raw.title ?? 'Untitled'),
    score: Number(raw.score ?? 0),
    priority: Number(raw.priority ?? 0),
    effortScore: Number(raw.effortScore ?? raw.effort_score ?? 5),
    focusCost: Number(raw.focusCost ?? raw.focus_cost ?? 3),
    estimatedTimeMin: Number(raw.estimatedTimeMin ?? raw.estimated_time_min ?? 0),
    status: String(raw.status ?? 'todo'),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    dueDate: typeof raw.dueDate === 'string' ? raw.dueDate : undefined,
    projectId: typeof raw.projectId === 'string' ? raw.projectId : undefined,
    goalId: typeof raw.goalId === 'string' ? raw.goalId : undefined,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    blockers: Array.isArray(raw.blockers) ? raw.blockers : [],
  };
}

export function isBlocked(task: NextAction): boolean {
  return Array.isArray(task.blockers) && task.blockers.length > 0;
}

export function dueDays(task: NextAction): number | null {
  if (!task.dueDate) return null;
  const ms = Date.parse(task.dueDate) - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function formatScore(score: number): string {
  return score.toFixed(2);
}

export function formatDuration(min: number): string {
  if (min <= 0) return '';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function elapsedMinutes(startedAt: string): number {
  const ms = Date.now() - Date.parse(startedAt);
  return Math.floor(ms / 60_000);
}

// ---------------------------------------------------------------------------
// Session summary (recent sessions panel)
// ---------------------------------------------------------------------------

export interface SessionSummary {
  id: string;
  title?: string;
  status: 'planned' | 'active' | 'completed' | 'aborted';
  startedAt?: string;
  endedAt?: string;
  taskCount?: number;
}

export function normalizeSessionSummary(raw: unknown): SessionSummary {
  if (!raw || typeof raw !== 'object') {
    return { id: String(Math.random()), status: 'planned' };
  }
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? r.sessionId ?? ''),
    title: typeof r.title === 'string' ? r.title : undefined,
    status: (['planned', 'active', 'completed', 'aborted'].includes(r.status as string)
      ? r.status as SessionSummary['status']
      : 'planned'),
    startedAt: typeof r.startedAt === 'string' ? r.startedAt : undefined,
    endedAt: typeof r.endedAt === 'string' ? r.endedAt : undefined,
    taskCount: typeof r.taskCount === 'number' ? r.taskCount : undefined,
  };
}

export function formatSessionDuration(startedAt?: string, endedAt?: string): string {
  if (!startedAt) return '';
  const end = endedAt ? Date.parse(endedAt) : Date.now();
  const start = Date.parse(startedAt);
  if (isNaN(start) || isNaN(end)) return '';
  const min = Math.round((end - start) / 60_000);
  return formatDuration(min);
}
