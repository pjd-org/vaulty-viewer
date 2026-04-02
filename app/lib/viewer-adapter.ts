import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '../../src/utils/api';
import {
  normalizeNextAction,
  type NextAction,
} from '../../src/lib/focus-logic';
import { splitInboxNotes, type InboxNote } from '../../src/lib/inbox-logic';
import type { ProjectSummary } from '../../src/lib/projects-logic';
export type AdapterEntityType =
  | 'task'
  | 'project'
  | 'note'
  | 'pipeline'
  | 'runner'
  | 'huey_job'
  | 'schedule'
  | 'incident'
  | 'memory'
  | 'portfolio_item'
  | 'bubble_state'
  | 'health_check';

export type AdapterActionType =
  | 'retry'
  | 'approve'
  | 'defer'
  | 'override'
  | 'reopen'
  | 'reschedule'
  | 'rebalance'
  | 'adjust_bubble'
  | 'create_task'
  | 'link_note'
  | 'open_incident'
  | 'open_source';

export type MutationDomain =
  | 'automation'
  | 'work'
  | 'knowledge'
  | 'portfolio'
  | 'bubble'
  | 'health'
  | 'timeline';

export interface AdapterEntityRef {
  id: string;
  type: AdapterEntityType;
  title?: string;
  projectId?: string;
  status?: string;
}

export interface MutationRef {
  domain: MutationDomain;
  operation:
    | 'retry_run'
    | 'approve_pipeline'
    | 'defer_signal'
    | 'override_rejection'
    | 'reopen_signal'
    | 'reschedule_item'
    | 'rebalance_portfolio'
    | 'adjust_bubble_state'
    | 'create_task'
    | 'link_note'
    | 'create_incident';
  targetId: string;
}

export interface AdapterActionRef {
  actionType: AdapterActionType;
  label: string;
  mutationRef?: MutationRef;
}

export interface ScoreBreakdown {
  urgency: number;
  impact: number;
  blockageRemoval: number;
  reversibility: number;
  confidence: number;
  total?: number;
  normalizedTotal?: number;
  explanation?: string;
  milestoneProximity?: number;
  driftReduction?: number;
  riskReduction?: number;
  portfolioEffect?: number;
  bubbleEffect?: number;
}

export interface PressureSignal {
  id: string;
  kind:
    | 'failure'
    | 'blocker'
    | 'drift'
    | 'risk'
    | 'collision'
    | 'stale'
    | 'rejection'
    | 'health'
    | 'portfolio'
    | 'bubble';
  title: string;
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  surfacedBy: 'cod';
  sourceType: AdapterEntityType;
  sourceId: string;
  projectId?: string;
  surfaceScope?:
    | 'home'
    | 'inbox'
    | 'actions'
    | 'project'
    | 'knowledge'
    | 'automation'
    | 'work'
    | 'portfolio'
    | 'bubble'
    | 'health'
    | 'timeline';
  surfacedAt: string;
  whySurfaced: string;
  score?: number;
  state?: 'fresh' | 'aged' | 'stale';
  mutationRef?: MutationRef;
  verificationId?: string;
  confidence?: number;
  reversibility?: 'low' | 'medium' | 'high';
  allowedActions: AdapterActionRef[];
}

export interface Recommendation {
  id: string;
  title: string;
  summary: string;
  actionType: Exclude<AdapterActionType, 'open_source'>;
  surfacedBy: 'cod';
  sourceSignalIds: string[];
  sourceEntities: AdapterEntityRef[];
  projectId?: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  whyNow: string;
  expectedEffect: string;
  confidence: number;
  reversibility: 'low' | 'medium' | 'high';
  state?: 'proposed' | 'simulatable' | 'ready' | 'executed' | 'blocked';
  requiresApproval?: boolean;
  mutationRef?: MutationRef;
}

export interface ContextCandidate {
  id: string;
  contextType: 'note' | 'memory' | 'decision' | 'spec' | 'log' | 'incident';
  title: string;
  summary: string;
  sourceId: string;
  sourcePath?: string;
  projectId?: string;
  reasonSelected: string;
  score?: number;
  evidence?: string[];
  freshness?: 'fresh' | 'aging' | 'stale';
  linkedEntities: AdapterEntityRef[];
}

export interface VerificationOutcome {
  id: string;
  actionId: string;
  mutationId?: string;
  entity?: AdapterEntityRef;
  startedAt: string;
  resolvedAt?: string;
  status: 'pending' | 'success' | 'warning' | 'failed';
  improved?: boolean;
  followUpNeeded?: boolean;
  summary: string;
  evidence?: string[];
  nextRecommendedActionId?: string;
  stage?: 'started' | 'verified' | 'follow_up' | 'done';
  surfaceScope?:
    | 'home'
    | 'inbox'
    | 'actions'
    | 'project'
    | 'knowledge'
    | 'automation'
    | 'work'
    | 'portfolio'
    | 'bubble'
    | 'health'
    | 'timeline';
}

function nowIso() {
  return new Date().toISOString();
}

export interface HomeSurfacePayload {
  pressureBand: PressureSignal[];
  decisionQueue: Recommendation[];
  immediateActions: Recommendation[];
  verificationRail: VerificationOutcome[];
  snapshots: {
    automation: PressureSignal[];
    knowledge: ContextCandidate[];
    portfolio: PressureSignal[];
    bubble: PressureSignal[];
    health: PressureSignal[];
  };
  contextTail: ContextCandidate[];
}

export interface InboxItem extends PressureSignal {
  inboxBucket:
    | 'needs_action'
    | 'needs_approval'
    | 'failure'
    | 'drift'
    | 'stale'
    | 'rejected_user'
    | 'rejected_automated'
    | 'deferred';
  rejectionType?: 'user' | 'automated';
  rejectionReason?: string;
  rejectionSource?: string;
}

export interface ActionsSurfacePayload {
  recommendations: Recommendation[];
  verificationRail: VerificationOutcome[];
}

// Knowledge surface — active authoring workspace context
// Spec: doc/context/viewer-v3/COD-VIEWER-ADAPTER-SPEC.md — Knowledge surface
export interface KnowledgeSurfacePayload {
  selectedContext: ContextCandidate[];
  linkedEntities: AdapterEntityRef[];
  suggestedTemplates: AdapterEntityRef[];
  suggestedActions: AdapterActionRef[];
}

export interface ProjectSurfacePayload {
  projectId: string;
  pressureBand: PressureSignal[];
  decisionQueue: Recommendation[];
  immediateActions: Recommendation[];
  verificationRail: VerificationOutcome[];
  executionSnapshot: {
    activeTasks: AdapterEntityRef[];
    activePipelines: AdapterEntityRef[];
    activeRunners: AdapterEntityRef[];
    hueyJobs: AdapterEntityRef[];
    scheduleItems: AdapterEntityRef[];
  };
  contextPanel: ContextCandidate[];
  timelineHints: AdapterEntityRef[];
  dependencyRiskSignals: PressureSignal[];
}

function clampScore(value: number, max = 10) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.round(value)));
}

function severityFromTask(task: NextAction): PressureSignal['severity'] {
  if (Array.isArray(task.blockers) && task.blockers.length > 0)
    return 'critical';
  if (task.score >= 8 || task.priority >= 9) return 'high';
  if (task.score >= 5 || task.priority >= 6) return 'medium';
  return 'low';
}

function reversibilityFromTask(task: NextAction): 'low' | 'medium' | 'high' {
  if (task.status === 'in-progress') return 'medium';
  if ((task.estimatedTimeMin ?? 0) > 90) return 'low';
  return 'high';
}

function taskSignalKind(task: NextAction): PressureSignal['kind'] {
  if (Array.isArray(task.blockers) && task.blockers.length > 0)
    return 'blocker';
  if (task.status === 'blocked') return 'blocker';
  if (task.status === 'in-progress') return 'risk';
  return 'stale';
}

function taskEntity(task: NextAction): AdapterEntityRef {
  return {
    id: task.id,
    type: 'task',
    title: task.title,
    projectId: task.projectId,
    status: task.status,
  };
}

function taskSignal(task: NextAction): PressureSignal {
  const severity = severityFromTask(task);
  const signalScore = task.score || task.priority || 0;
  return {
    id: `signal:${task.id}`,
    kind: taskSignalKind(task),
    title: task.title,
    summary:
      task.description ??
      (severity === 'critical'
        ? 'This task is actively blocked and likely holding up other work.'
        : 'This task surfaced from the active work queue.'),
    severity,
    surfacedBy: 'cod',
    sourceType: 'task',
    sourceId: task.id,
    projectId: task.projectId,
    surfaceScope: task.projectId ? 'project' : 'home',
    surfacedAt: nowIso(),
    whySurfaced:
      Array.isArray(task.blockers) && task.blockers.length > 0
        ? 'Blocked work is prioritized because clearing it can unblock the rest of the queue.'
        : task.score >= 8
          ? 'High combined priority and leverage make this task worth surfacing now.'
          : 'This task is near the top of the next-actions queue and is ready to move.',
    score: signalScore,
    state: 'fresh',
    mutationRef: {
      domain: 'work',
      operation: 'create_task',
      targetId: task.id,
    },
    confidence: task.score
      ? Math.min(0.95, Math.max(0.4, task.score / 10))
      : 0.5,
    reversibility: reversibilityFromTask(task),
    allowedActions: [
      {
        actionType: 'create_task',
        label: 'Open task',
        mutationRef: {
          domain: 'work',
          operation: 'create_task',
          targetId: task.id,
        },
      },
      {
        actionType: 'defer',
        label: 'Defer',
        mutationRef: {
          domain: 'work',
          operation: 'defer_signal',
          targetId: task.id,
        },
      },
    ],
  };
}

function taskRecommendation(task: NextAction): Recommendation {
  const reversibility = reversibilityFromTask(task);
  const breakdown: ScoreBreakdown = {
    urgency: clampScore(task.priority),
    impact: clampScore(task.score),
    blockageRemoval:
      Array.isArray(task.blockers) && task.blockers.length > 0 ? 9 : 4,
    reversibility:
      reversibility === 'high' ? 8 : reversibility === 'medium' ? 5 : 2,
    confidence: clampScore((task.score || task.priority || 5) * 0.9),
    total: clampScore(
      (task.score || 0) +
        task.priority +
        (Array.isArray(task.blockers) && task.blockers.length > 0 ? 2 : 0),
      30
    ),
    normalizedTotal: Math.min(
      1,
      Math.max(0, ((task.score || 0) + task.priority) / 20)
    ),
    explanation:
      Array.isArray(task.blockers) && task.blockers.length > 0
        ? 'Blocked work gets extra weight because clearing it can unblock downstream items.'
        : 'Higher priority and leverage push the recommendation upward.',
  };

  return {
    id: `action:${task.id}`,
    title: task.title,
    summary: task.description ?? 'Recommended next move from the active queue.',
    actionType: 'create_task',
    surfacedBy: 'cod',
    sourceSignalIds: [`signal:${task.id}`],
    sourceEntities: [taskEntity(task)],
    projectId: task.projectId,
    score: task.score,
    scoreBreakdown: breakdown,
    whyNow:
      Array.isArray(task.blockers) && task.blockers.length > 0
        ? 'Resolving this item should remove immediate friction in the queue.'
        : (task.estimatedTimeMin ?? 0) <= 45
          ? 'It is short enough to create momentum without expensive context switching.'
          : 'It sits high in the queue and carries meaningful leverage right now.',
    expectedEffect: task.projectId
      ? `Progress moves forward for ${task.projectId}.`
      : 'The visible queue should become clearer after execution.',
    confidence: Math.min(0.95, Math.max(0.35, (task.score || 5) / 10)),
    reversibility,
    state: reversibility === 'high' ? 'ready' : 'proposed',
    mutationRef: {
      domain: 'work',
      operation: 'create_task',
      targetId: task.id,
    },
  };
}

function noteRejectionType(note: InboxNote): 'user' | 'automated' {
  const source = note.frontmatter?.rejection_source;
  if (typeof source === 'string' && source.toLowerCase().includes('user'))
    return 'user';
  return 'automated';
}

export function buildHomeSurfacePayload(
  tasks: NextAction[]
): HomeSurfacePayload {
  const recommendations = tasks.slice(0, 5).map(taskRecommendation);
  const pressureBand = tasks.slice(0, 5).map(taskSignal);
  const verificationRail: VerificationOutcome[] = tasks
    .slice(0, 3)
    .map((task) => ({
      id: `verification:${task.id}`,
      actionId: `action:${task.id}`,
      mutationId: `mutation:${task.id}`,
      entity: taskEntity(task),
      startedAt: nowIso(),
      status: task.status === 'blocked' ? 'warning' : 'pending',
      improved: undefined,
      followUpNeeded: task.status === 'blocked',
      summary: `Verification pending for ${task.title}`,
      evidence: task.description ? [task.description] : undefined,
      nextRecommendedActionId:
        task.score >= 8 ? `action:${task.id}` : undefined,
      stage: 'started',
      surfaceScope: task.projectId ? 'project' : 'home',
    }));
  return {
    pressureBand,
    decisionQueue: recommendations,
    immediateActions: recommendations
      .filter((item) => item.reversibility === 'high')
      .slice(0, 3),
    verificationRail,
    snapshots: {
      automation: pressureBand
        .filter((item) => item.kind === 'blocker')
        .slice(0, 2),
      knowledge: tasks.slice(0, 2).map((task) => ({
        id: `context:${task.id}`,
        contextType: 'note',
        title: task.title,
        summary:
          task.description ?? 'Task context selected from the active queue.',
        sourceId: task.id,
        projectId: task.projectId,
        reasonSelected:
          'This item is directly linked to currently surfaced work.',
        freshness: 'fresh',
        linkedEntities: [taskEntity(task)],
      })),
      portfolio: pressureBand.filter((item) => item.projectId).slice(0, 2),
      bubble: [],
      health: [],
    },
    contextTail: tasks.slice(0, 3).map((task) => ({
      id: `context-tail:${task.id}`,
      contextType: 'note',
      title: task.title,
      summary: task.description ?? 'Relevant queue context.',
      sourceId: task.id,
      projectId: task.projectId,
      reasonSelected:
        'Selected because it is adjacent to the highest-priority work.',
      freshness: 'fresh',
      linkedEntities: [taskEntity(task)],
    })),
  };
}

export function buildInboxSurfacePayload(args: {
  runs: Array<Record<string, unknown>>;
  workbenchNotes: InboxNote[];
  archiveNotes: InboxNote[];
}): InboxItem[] {
  const runItems: InboxItem[] = args.runs.map((run, index) => {
    const runId = String(run.runId ?? `run-${index}`);
    const confidence =
      typeof run.confidence === 'number' ? run.confidence : 0.5;
    return {
      id: `signal:${runId}`,
      kind: confidence < 0.45 ? 'risk' : 'rejection',
      title: String(run.action ?? run.runType ?? runId),
      summary: `${Number(run.itemCount ?? 0)} staged item(s) awaiting review.`,
      severity: confidence < 0.45 ? 'high' : 'medium',
      surfacedBy: 'cod' as const,
      sourceType: 'note' as const,
      sourceId: runId,
      surfacedAt: nowIso(),
      whySurfaced:
        'This staged run needs operator review before promotion or rejection.',
      confidence,
      reversibility: 'high' as const,
      allowedActions: [
        {
          actionType: 'approve',
          label: 'Approve',
          mutationRef: {
            domain: 'knowledge',
            operation: 'approve_pipeline',
            targetId: runId,
          },
        },
        {
          actionType: 'defer',
          label: 'Defer',
          mutationRef: {
            domain: 'knowledge',
            operation: 'defer_signal',
            targetId: runId,
          },
        },
      ],
      inboxBucket: confidence < 0.45 ? 'needs_approval' : 'needs_action',
    };
  });

  const rejected: InboxItem[] = args.archiveNotes.map((note) => {
    const rejectionType = noteRejectionType(note);
    return {
      id: `signal:${note.path}`,
      kind: 'rejection' as const,
      title: note.title,
      summary: note.path,
      severity:
        rejectionType === 'user' ? ('medium' as const) : ('high' as const),
      surfacedBy: 'cod' as const,
      sourceType: 'note' as const,
      sourceId: note.path,
      surfacedAt: nowIso(),
      whySurfaced:
        rejectionType === 'user'
          ? 'Human rejection remains visible as a distinct audit trail.'
          : 'Automated rejection stays separate so override and fix paths remain visible.',
      confidence: rejectionType === 'user' ? 0.85 : 0.65,
      reversibility:
        rejectionType === 'user' ? ('medium' as const) : ('high' as const),
      allowedActions:
        rejectionType === 'user'
          ? [
              {
                actionType: 'reopen',
                label: 'Reopen',
                mutationRef: {
                  domain: 'knowledge',
                  operation: 'reopen_signal',
                  targetId: note.path,
                },
              },
            ]
          : [
              {
                actionType: 'override',
                label: 'Override',
                mutationRef: {
                  domain: 'knowledge',
                  operation: 'override_rejection',
                  targetId: note.path,
                },
              },
            ],
      inboxBucket:
        rejectionType === 'user'
          ? ('rejected_user' as const)
          : ('rejected_automated' as const),
      rejectionType,
      rejectionReason:
        typeof note.frontmatter?.rejection_reason === 'string'
          ? String(note.frontmatter.rejection_reason)
          : undefined,
      rejectionSource: note.source,
    };
  });

  const workbench: InboxItem[] = args.workbenchNotes.map((note) => ({
    id: `signal:${note.path}`,
    kind: 'stale' as const,
    title: note.title,
    summary: note.path,
    severity: 'low' as const,
    surfacedBy: 'cod' as const,
    sourceType: 'note' as const,
    sourceId: note.path,
    surfacedAt: nowIso(),
    whySurfaced:
      'Workbench items remain visible as operator context and follow-up material.',
    confidence: 0.55,
    reversibility: 'high' as const,
    allowedActions: [{ actionType: 'open_source', label: 'Open note' }],
    inboxBucket: 'deferred' as const,
  }));

  return [...runItems, ...rejected, ...workbench];
}

export function buildActionsSurfacePayload(
  tasks: NextAction[]
): ActionsSurfacePayload {
  const recommendations = tasks.map(taskRecommendation);
  const verificationRail: VerificationOutcome[] = recommendations
    .slice(0, 3)
    .map((item) => ({
      id: `verification:${item.id}`,
      actionId: item.id,
      mutationId: item.mutationRef
        ? `${item.mutationRef.domain}:${item.mutationRef.targetId}`
        : undefined,
      entity: item.sourceEntities[0],
      startedAt: nowIso(),
      status: item.reversibility === 'high' ? 'pending' : 'warning',
      improved: undefined,
      followUpNeeded: item.requiresApproval ?? false,
      summary: `Verification pending for ${item.title}`,
      evidence: [item.whyNow],
      nextRecommendedActionId: item.id,
      stage: 'started',
      surfaceScope: 'actions',
    }));
  return {
    recommendations,
    verificationRail,
  };
}

export function buildProjectSurfacePayload(args: {
  projectId: string;
  project?: ProjectSummary;
  tasks: NextAction[];
}): ProjectSurfacePayload {
  const pressureBand = args.tasks.slice(0, 5).map(taskSignal);
  const decisionQueue = args.tasks.slice(0, 5).map(taskRecommendation);
  const contextPanel = args.tasks.slice(0, 3).map((task) => ({
    id: `context:${task.id}`,
    contextType: 'note' as const,
    title: task.title,
    summary: task.description ?? 'Project-linked execution context.',
    sourceId: task.id,
    projectId: args.projectId,
    reasonSelected:
      'Selected because it is directly tied to this project queue.',
    freshness: 'fresh' as const,
    linkedEntities: [taskEntity(task)],
  }));

  return {
    projectId: args.projectId,
    pressureBand,
    decisionQueue,
    immediateActions: decisionQueue
      .filter((item) => item.reversibility === 'high')
      .slice(0, 3),
    verificationRail: decisionQueue.slice(0, 3).map((item) => ({
      id: `verification:${item.id}`,
      actionId: item.id,
      mutationId: item.mutationRef
        ? `${item.mutationRef.domain}:${item.mutationRef.targetId}`
        : undefined,
      entity: item.sourceEntities[0],
      startedAt: nowIso(),
      status: 'pending',
      improved: undefined,
      followUpNeeded: item.reversibility !== 'high',
      summary: `Project verification pending for ${item.title}`,
      evidence: [item.whyNow],
      nextRecommendedActionId: item.id,
      stage: 'started',
      surfaceScope: 'project',
    })),
    executionSnapshot: {
      activeTasks: args.tasks.slice(0, 5).map(taskEntity),
      activePipelines: [],
      activeRunners: [],
      hueyJobs: [],
      scheduleItems: [],
    },
    contextPanel,
    timelineHints: args.tasks.slice(0, 3).map(taskEntity),
    dependencyRiskSignals: pressureBand.filter(
      (item) => item.kind === 'blocker' || item.kind === 'risk'
    ),
  };
}

export async function fetchRichNextActions(max = 25): Promise<NextAction[]> {
  const res = await apiFetch(`/api/v1/tasks/next-actions?max=${max}`);
  if (!res.ok) throw new Error(`Failed to fetch next actions: ${res.status}`);
  const body = await res.json();
  const raw: Record<string, unknown>[] =
    body.structuredContent?.tasks ?? body.tasks ?? [];
  return raw.map(normalizeNextAction);
}

export function getHomeSurfaceQueryOptions() {
  return {
    queryKey: ['viewer-adapter', 'home-surface'],
    queryFn: async () =>
      buildHomeSurfacePayload(await fetchRichNextActions(25)),
    staleTime: 60_000,
    retry: 1,
  };
}

export function getTaskSurfaceQueryOptions() {
  return {
    queryKey: ['tasks'] as const,
  };
}

export function useHomeSurface(initialData?: HomeSurfacePayload) {
  return useQuery({
    ...getHomeSurfaceQueryOptions(),
    initialData,
  });
}

async function fetchInboxSurfaceSource() {
  const res = await apiFetch('/api/v1/inbox');
  if (!res.ok) throw new Error(`Failed to fetch inbox: ${res.status}`);
  const body = await res.json();
  const structured = body?.structuredContent;
  const notes = Array.isArray(structured?.notes ?? body?.notes)
    ? (structured?.notes ?? body?.notes)
    : [];
  const runs = Array.isArray(structured?.runs ?? body?.runs)
    ? (structured?.runs ?? body?.runs)
    : [];
  const { workbenchNotes, archiveNotes } = splitInboxNotes(notes);

  return {
    runs,
    workbenchNotes,
    archiveNotes,
  };
}

export function getInboxSurfaceQueryOptions() {
  return {
    queryKey: ['viewer-adapter', 'inbox-surface'],
    queryFn: async () =>
      buildInboxSurfacePayload(await fetchInboxSurfaceSource()),
    staleTime: 30_000,
    retry: 1,
  };
}

export function useInboxSurface(initialData?: InboxItem[]) {
  return useQuery({
    ...getInboxSurfaceQueryOptions(),
    initialData,
  });
}

export function getActionsSurfaceQueryOptions() {
  return {
    queryKey: ['viewer-adapter', 'actions-surface'],
    queryFn: async () =>
      buildActionsSurfacePayload(await fetchRichNextActions(25)),
    staleTime: 60_000,
    retry: 1,
  };
}

export function useActionsSurface(initialData?: ActionsSurfacePayload) {
  return useQuery({
    ...getActionsSurfaceQueryOptions(),
    initialData,
  });
}

export function getProjectSurfaceQueryOptions(projectId: string) {
  return {
    queryKey: ['viewer-adapter', 'project-surface', projectId] as const,
    queryFn: async () => {
      const tasks = await fetchRichNextActions(50);
      return buildProjectSurfacePayload({
        projectId,
        tasks: tasks.filter((task) => task.projectId === projectId),
      });
    },
    staleTime: 60_000,
    retry: 1,
  };
}

export function useProjectSurface(
  projectId: string,
  initialData?: ProjectSurfacePayload
) {
  return useQuery({
    ...getProjectSurfaceQueryOptions(projectId),
    enabled: !!projectId,
    initialData,
  });
}

// ─── Knowledge Surface ────────────────────────────────────────────────────────

export function buildKnowledgeSurfacePayload(source: {
  notes?: { id: string; title?: string; path?: string }[];
}): KnowledgeSurfacePayload {
  const notes = source.notes ?? [];

  const selectedContext: ContextCandidate[] = notes.slice(0, 5).map((n) => ({
    id: n.id,
    contextType: 'note',
    title: n.title ?? n.id,
    summary: '',
    sourceId: n.id,
    sourcePath: n.path,
    reasonSelected: 'Recently active in the knowledge workspace.',
    linkedEntities: [],
  }));

  const linkedEntities: AdapterEntityRef[] = notes.slice(0, 10).map((n) => ({
    id: n.id,
    type: 'note',
    title: n.title ?? n.id,
  }));

  // Derive open-source actions from the first 3 context notes.
  // TODO: when the API returns template metadata, populate suggestedTemplates here.
  const suggestedActions: AdapterActionRef[] = notes.slice(0, 3).map((n) => ({
    actionType: 'open_source' as const,
    label: `Open "${n.title ?? n.id}"`,
  }));

  return {
    selectedContext,
    linkedEntities,
    // TODO: populate suggestedTemplates once template metadata is available from the API.
    suggestedTemplates: [],
    suggestedActions,
  };
}

export function getKnowledgeSurfaceQueryOptions() {
  return {
    queryKey: ['viewer-adapter', 'knowledge-surface'] as const,
    queryFn: async (): Promise<KnowledgeSurfacePayload> => {
      const res = await apiFetch('/api/v1/notes');
      if (!res.ok)
        throw new Error(`Failed to fetch knowledge surface: ${res.status}`);
      const body = await res.json();
      const notes: { id: string; title?: string; path?: string }[] =
        body?.structuredContent?.notes ?? body?.notes ?? [];
      return buildKnowledgeSurfacePayload({ notes });
    },
    staleTime: 60_000,
    retry: 1,
  };
}

export function useKnowledgeSurface(initialData?: KnowledgeSurfacePayload) {
  return useQuery({
    ...getKnowledgeSurfaceQueryOptions(),
    initialData,
  });
}

// ─── Query Invalidation Helpers ───────────────────────────────────────────────
// Spec: doc/context/viewer-v3/QUERY-KEY-INVALIDATION-DOC.md

type InvalidationContext = { projectId?: string };

interface QueryClientLike {
  invalidateQueries: (queryKey: { queryKey: unknown[] }) => void;
}

function inv(qc: QueryClientLike, key: unknown[]) {
  qc.invalidateQueries({ queryKey: key });
}

/**
 * Invalidate the affected queries after a mutation completes.
 * Rules per domain follow QUERY-KEY-INVALIDATION-DOC.md.
 */
export function invalidateQueriesForDomain(
  queryClient: QueryClientLike,
  domain: MutationDomain,
  ctx: InvalidationContext
): void {
  switch (domain) {
    case 'automation':
      inv(queryClient, ['automation']);
      inv(queryClient, ['viewer-adapter', 'verification']);
      if (ctx.projectId) {
        inv(queryClient, ['viewer-adapter', 'project-surface', ctx.projectId]);
      }
      break;

    case 'work':
      inv(queryClient, ['work']);
      // home surface re-ranks when task pressure changes
      inv(queryClient, ['viewer-adapter', 'home-surface']);
      if (ctx.projectId) {
        inv(queryClient, ['viewer-adapter', 'project-surface', ctx.projectId]);
      }
      break;

    case 'knowledge':
      inv(queryClient, ['viewer-adapter', 'knowledge-surface']);
      inv(queryClient, ['knowledge']);
      if (ctx.projectId) {
        inv(queryClient, ['viewer-adapter', 'project-surface', ctx.projectId]);
      }
      break;

    case 'portfolio':
      inv(queryClient, ['portfolio']);
      break;

    case 'bubble':
      inv(queryClient, ['bubble']);
      break;

    case 'health':
      inv(queryClient, ['health']);
      break;

    case 'timeline':
      inv(queryClient, ['timeline']);
      break;
  }
}
