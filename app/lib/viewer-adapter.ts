import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '../../src/utils/api';
import {
  normalizeNextAction,
  normalizeSessionSummary,
  type NextAction,
  type CodScoreBreakdown,
  type ActiveSession,
  type SessionSummary,
} from '../../src/lib/focus-logic';
import { splitInboxNotes, type InboxNote } from '../../src/lib/inbox-logic';
import type { ProjectSummary } from '../../src/lib/projects-logic';
import {
  validateNextActionsResponse,
  validateSessionsResponse,
  validateSessionDetailResponse,
  validateActiveSession,
  validateInboxResponse,
  validateGraphJson,
  validateGraphHealth,
} from './api-validation';
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
    | 'approve_pipeline'
    | 'defer_signal'
    | 'override_rejection'
    | 'reopen_signal'
    | 'create_task';
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
  /** Vault-relative task path for API mutations (e.g. updateTaskStatus) */
  taskPath?: string;
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
  /** Vault-relative task path for API mutations (e.g. updateTaskStatus) */
  taskPath?: string;
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
  /** Raw task data preserved for downstream consumers (agent hooks, session logic) */
  tasks: NextAction[];
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
    confidence: task.scoreBreakdown
      ? Math.min(0.95, Math.max(0.4, task.score / 10))
      : task.score
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
    taskPath: task.path || undefined,
  };
}

function taskRecommendation(task: NextAction): Recommendation {
  const reversibility = reversibilityFromTask(task);
  const cod = task.scoreBreakdown;
  const breakdown: ScoreBreakdown = cod
    ? buildCodBreakdown(task, cod, reversibility)
    : buildFallbackBreakdown(task, reversibility);

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
    whyNow: cod
      ? buildCodWhyNow(task, cod)
      : Array.isArray(task.blockers) && task.blockers.length > 0
        ? 'Resolving this item should remove immediate friction in the queue.'
        : (task.estimatedTimeMin ?? 0) <= 45
          ? 'It is short enough to create momentum without expensive context switching.'
          : 'It sits high in the queue and carries meaningful leverage right now.',
    expectedEffect: task.projectId
      ? `Progress moves forward for ${task.projectId}.`
      : 'The visible queue should become clearer after execution.',
    confidence: cod
      ? Math.min(0.95, Math.max(0.4, task.score / 10))
      : Math.min(0.95, Math.max(0.35, (task.score || 5) / 10)),
    reversibility,
    state: reversibility === 'high' ? 'ready' : 'proposed',
    mutationRef: {
      domain: 'work',
      operation: 'create_task',
      targetId: task.id,
    },
    taskPath: task.path || undefined,
  };
}

/** Build ScoreBreakdown from real COD pipeline data */
function buildCodBreakdown(
  task: NextAction,
  cod: CodScoreBreakdown,
  reversibility: 'high' | 'medium' | 'low'
): ScoreBreakdown {
  const urgency = clampScore(
    cod.timeFactor !== undefined
      ? Math.round(cod.timeFactor * 10)
      : task.priority
  );
  const impact = clampScore(
    cod.compoundScore !== undefined
      ? Math.round(cod.compoundScore * 10)
      : task.score
  );
  const blockageRemoval =
    Array.isArray(task.blockers) && task.blockers.length > 0 ? 9 : 4;
  const rev = reversibility === 'high' ? 8 : reversibility === 'medium' ? 5 : 2;
  const confidence = clampScore(
    cod.adhdStartability !== undefined
      ? Math.round(cod.adhdStartability * 10)
      : (task.score || task.priority || 5) * 0.9
  );
  const total = clampScore(urgency + impact + blockageRemoval, 30);
  const normalizedTotal = Math.min(1, Math.max(0, total / 30));

  const reasons: string[] = [];
  if (cod.goalAligned) reasons.push('Goal-aligned');
  if (cod.compoundReasons?.length)
    reasons.push(...cod.compoundReasons.slice(0, 2));
  if (cod.adhdReasons?.length) reasons.push(...cod.adhdReasons.slice(0, 2));
  if (cod.moneyBoost && cod.moneyBoost > 1)
    reasons.push('Financial priority boost');
  if (cod.bubblePenalty && cod.bubblePenalty > 0)
    reasons.push('Bubble constraint applied');

  return {
    urgency,
    impact,
    blockageRemoval,
    reversibility: rev,
    confidence,
    total,
    normalizedTotal,
    explanation:
      reasons.length > 0
        ? reasons.join('. ') + '.'
        : 'Ranked by the COD pipeline with goal, time, and compound scoring.',
  };
}

/** Build ScoreBreakdown from local heuristics (fallback when COD unavailable) */
function buildFallbackBreakdown(
  task: NextAction,
  reversibility: 'high' | 'medium' | 'low'
): ScoreBreakdown {
  return {
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
}

/** Build whyNow text from real COD signals */
function buildCodWhyNow(task: NextAction, cod: CodScoreBreakdown): string {
  const parts: string[] = [];
  if (cod.goalAligned) parts.push('aligned with active goals');
  if (cod.timeDueInDays !== undefined && cod.timeDueInDays <= 2)
    parts.push(
      `due in ${cod.timeDueInDays} day${cod.timeDueInDays === 1 ? '' : 's'}`
    );
  if (cod.adhdStartability !== undefined && cod.adhdStartability >= 0.7)
    parts.push('high startability for current state');
  if (cod.compoundScore !== undefined && cod.compoundScore >= 0.5)
    parts.push('compound leverage from streak or habit');
  if (Array.isArray(task.blockers) && task.blockers.length > 0)
    parts.push('resolving this clears downstream blockers');

  if (parts.length > 0) {
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[0].slice(1) +
      (parts.length > 1 ? ', and ' + parts.slice(1).join(', ') : '') +
      '.'
    );
  }
  return (task.estimatedTimeMin ?? 0) <= 45
    ? 'Short enough to create momentum without expensive context switching.'
    : 'Sits high in the queue and carries meaningful leverage right now.';
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
    tasks,
  };
}

function buildRunItems(runs: Array<Record<string, unknown>>): InboxItem[] {
  return runs.map((run, index) => {
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
}

function buildRejectedItems(archiveNotes: InboxNote[]): InboxItem[] {
  return archiveNotes.map((note) => {
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
}

function buildWorkbenchItems(workbenchNotes: InboxNote[]): InboxItem[] {
  return workbenchNotes.map((note) => ({
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
}

export function buildInboxSurfacePayload(args: {
  runs: Array<Record<string, unknown>>;
  workbenchNotes: InboxNote[];
  archiveNotes: InboxNote[];
}): InboxItem[] {
  return [
    ...buildRunItems(args.runs),
    ...buildRejectedItems(args.archiveNotes),
    ...buildWorkbenchItems(args.workbenchNotes),
  ];
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
  const raw = validateNextActionsResponse(body);
  return raw.map(normalizeNextAction);
}

export function getHomeSurfaceQueryOptions() {
  return {
    queryKey: ['viewer-adapter', 'home-surface'],
    queryFn: async (): Promise<HomeSurfacePayload> => {
      const res = await apiFetch('/api/v1/surfaces/home?max=25');
      if (!res.ok)
        throw new Error(`Failed to fetch home surface: ${res.status}`);
      const body = await res.json();
      // API returns { structuredContent: HomeSurfacePayload, warnings? }
      const sc = (body?.structuredContent ?? body) as HomeSurfacePayload & {
        tasks?: unknown[];
        meta?: unknown;
      };
      // tasks array from the server is raw records; normalize to NextAction[]
      const rawTasks = Array.isArray(sc.tasks) ? sc.tasks : [];
      const tasks = (rawTasks as Array<Record<string, unknown>>).map(
        normalizeNextAction
      );
      return { ...sc, tasks } as HomeSurfacePayload;
    },
    staleTime: 60_000,
    retry: 1,
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
  const { notes, runs } = validateInboxResponse(body);
  const { workbenchNotes, archiveNotes } = splitInboxNotes(
    notes as InboxNote[]
  );

  return {
    runs: runs as Array<Record<string, unknown>>,
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

// Archive surface — groups inbox items with archive buckets from the shared
// inbox-surface cache (same queryKey, zero extra fetches).
export interface ArchiveSurfacePayload {
  rejectedUser: InboxItem[];
  rejectedAutomated: InboxItem[];
  deferred: InboxItem[];
  total: number;
}

function selectArchivePayload(items: InboxItem[]): ArchiveSurfacePayload {
  const archived = items.filter(
    (item) =>
      item.inboxBucket === 'rejected_user' ||
      item.inboxBucket === 'rejected_automated' ||
      item.inboxBucket === 'deferred'
  );
  return {
    rejectedUser: archived.filter((i) => i.inboxBucket === 'rejected_user'),
    rejectedAutomated: archived.filter(
      (i) => i.inboxBucket === 'rejected_automated'
    ),
    deferred: archived.filter((i) => i.inboxBucket === 'deferred'),
    total: archived.length,
  };
}

export function useArchiveSurface() {
  return useQuery({
    ...getInboxSurfaceQueryOptions(),
    select: selectArchivePayload,
  });
}

export function getActionsSurfaceQueryOptions() {
  return {
    queryKey: ['viewer-adapter', 'actions-surface'],
    queryFn: async (): Promise<ActionsSurfacePayload> => {
      const res = await apiFetch('/api/v1/surfaces/actions?max=25');
      if (!res.ok)
        throw new Error(`Failed to fetch actions surface: ${res.status}`);
      const body = await res.json();
      const sc = (body?.structuredContent ?? body) as ActionsSurfacePayload & {
        meta?: unknown;
      };
      return sc as ActionsSurfacePayload;
    },
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

// ─── Knowledge Graph & Health ─────────────────────────────────────────────────

export type GraphNode = {
  title: string;
  type?: string;
  tags?: string[];
  status?: string;
  audience?: string | null;
};

export type GraphJson = {
  generated: string;
  node_count: number;
  edge_count: number;
  nodes: Record<string, GraphNode>;
  links: Record<string, string[]>;
  backlinks: Record<string, string[]>;
  by_audience: { human: string[]; agent: string[]; bubble: string[] };
  unresolved_links: Record<string, string[]>;
};

export type GraphHealthReport = {
  graph_generated: string;
  is_stale: boolean;
  node_count: number;
  edge_count: number;
  by_audience: { human: number; agent: number; bubble: number };
  unresolved_link_count: number;
};

export type KnowledgeNoteRef = {
  path: string;
  title: string;
  type?: string;
  audience?: string | null;
  domain?: string;
  tags?: string[];
  status?: string;
};

export function getKnowledgeGraphQueryOptions() {
  return {
    queryKey: ['viewer-adapter', 'knowledge-graph'] as const,
    queryFn: async (): Promise<GraphJson> => {
      const res = await apiFetch('/api/v1/knowledge/graph');
      if (!res.ok)
        throw new Error(`Failed to fetch knowledge graph: ${res.status}`);
      const body = await res.json();
      validateGraphJson(body);
      return body as GraphJson;
    },
    staleTime: 120_000,
    retry: 1,
  };
}

export function useKnowledgeGraph() {
  return useQuery(getKnowledgeGraphQueryOptions());
}

export function getKnowledgeHealthQueryOptions() {
  return {
    queryKey: ['viewer-adapter', 'knowledge-health'] as const,
    queryFn: async (): Promise<GraphHealthReport> => {
      const res = await apiFetch('/api/v1/knowledge/health');
      if (!res.ok)
        throw new Error(`Failed to fetch knowledge health: ${res.status}`);
      const body = await res.json();
      validateGraphHealth(body);
      return body as GraphHealthReport;
    },
    staleTime: 60_000,
    retry: 1,
  };
}

export function useKnowledgeHealth() {
  return useQuery(getKnowledgeHealthQueryOptions());
}

export function getKnowledgeByAudienceQueryOptions(
  audience: 'human' | 'agent' | 'bubble'
) {
  return {
    queryKey: ['viewer-adapter', 'knowledge-by-audience', audience] as const,
    queryFn: async (): Promise<KnowledgeNoteRef[]> => {
      const res = await apiFetch(
        `/api/v1/knowledge/by-audience?audience=${audience}`
      );
      if (!res.ok)
        throw new Error(
          `Failed to fetch knowledge notes (${audience}): ${res.status}`
        );
      const body = (await res.json()) as {
        audience: string;
        notes: KnowledgeNoteRef[];
      };
      return body.notes ?? [];
    },
    staleTime: 60_000,
    retry: 1,
  };
}

export function useKnowledgeByAudience(audience: 'human' | 'agent' | 'bubble') {
  return useQuery(getKnowledgeByAudienceQueryOptions(audience));
}

export function getKnowledgeSearchQueryOptions(
  query: string,
  mode: 'tag' | 'semantic'
) {
  return {
    queryKey: ['viewer-adapter', 'knowledge-search', query, mode] as const,
    queryFn: async (): Promise<KnowledgeNoteRef[]> => {
      if (!query.trim()) return [];
      const res = await apiFetch(
        `/api/v1/knowledge/search?q=${encodeURIComponent(query)}&mode=${mode}`
      );
      if (!res.ok) throw new Error(`Failed to search knowledge: ${res.status}`);
      const body = await res.json();
      return (body as { results: KnowledgeNoteRef[] }).results ?? [];
    },
    staleTime: 30_000,
    retry: 1,
    enabled: query.trim().length > 0,
  };
}

export function useKnowledgeSearch(query: string, mode: 'tag' | 'semantic') {
  return useQuery(getKnowledgeSearchQueryOptions(query, mode));
}

// ─── Session Detail ───────────────────────────────────────────────────────────

export function getSessionDetailQueryOptions(sessionId: string) {
  return {
    queryKey: ['sessions', 'detail', sessionId] as const,
    queryFn: async (): Promise<ActiveSession | null> => {
      const res = await apiFetch(
        `/api/v1/sessions/${encodeURIComponent(sessionId)}`
      );
      if (!res.ok)
        throw new Error(
          res.status === 404
            ? `Session not found: ${sessionId}`
            : `Failed to fetch session: ${res.status}`
        );
      const body = await res.json();
      const raw = validateSessionDetailResponse(body);
      return validateActiveSession(raw);
    },
    staleTime: 15_000,
    retry: (failureCount: number, error: Error) => {
      // Don't retry 404s
      if (error.message.includes('not found')) return false;
      return failureCount < 2;
    },
  };
}

export function useSessionDetail(sessionId: string) {
  return useQuery({
    ...getSessionDetailQueryOptions(sessionId),
    enabled: !!sessionId,
  });
}

// ─── Knowledge Surface ────────────────────────────────────────────────────────

export function buildKnowledgeSurfacePayload(source: {
  notes?: { id?: string; path?: string; title?: string }[];
}): KnowledgeSurfacePayload {
  const notes = (source.notes ?? []).map((n) => ({
    ...n,
    id: n.id ?? n.path ?? '',
  }));

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
      const res = await apiFetch(
        '/api/v1/knowledge/by-audience?audience=human'
      );
      if (!res.ok)
        throw new Error(`Failed to fetch knowledge surface: ${res.status}`);
      const body = (await res.json()) as {
        audience: string;
        notes: KnowledgeNoteRef[];
      };
      return buildKnowledgeSurfacePayload({ notes: body.notes ?? [] });
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

// ─── Session Queries ──────────────────────────────────────────────────────────

export function getActiveSessionQueryOptions() {
  return {
    queryKey: ['sessions', 'active'] as const,
    queryFn: async (): Promise<ActiveSession | null> => {
      const res = await apiFetch('/api/v1/sessions?status=active&limit=1');
      if (!res.ok)
        throw new Error(`Failed to fetch active session: ${res.status}`);
      const body = await res.json();
      const sessions = validateSessionsResponse(body);
      const active = (sessions as ActiveSession[]).find(
        (s) => s.status === 'active'
      );
      return active ? validateActiveSession(active) : null;
    },
    staleTime: 30_000,
    retry: 1,
  };
}

export function useActiveSession() {
  return useQuery(getActiveSessionQueryOptions());
}

export function getRecentSessionsQueryOptions(limit = 3) {
  return {
    queryKey: ['sessions', 'recent', limit] as const,
    queryFn: async (): Promise<SessionSummary[]> => {
      const res = await apiFetch(`/api/v1/sessions?limit=${limit}`);
      if (!res.ok)
        throw new Error(`Failed to fetch recent sessions: ${res.status}`);
      const body = await res.json();
      const raw = validateSessionsResponse(body);
      return raw.map(normalizeSessionSummary);
    },
    staleTime: 30_000,
    retry: 1,
  };
}

export function useRecentSessions(limit = 3) {
  return useQuery(getRecentSessionsQueryOptions(limit));
}

// ─── Health Surface ────────────────────────────────────────────────────────────

export interface HealthServiceEntry {
  id: string;
  name: string;
  status: 'ok' | 'degraded' | 'timeout' | 'error';
  latencyMs?: number;
  version?: string;
  uptime?: number;
  detail?: string;
  toolCount?: number;
}

export interface HealthSurfacePayload {
  overall: 'ok' | 'degraded';
  timestamp: string;
  services: HealthServiceEntry[];
}

function normalizeHealthResponse(raw: unknown): HealthSurfacePayload {
  const r = raw as {
    status: 'ok' | 'degraded';
    timestamp: string;
    uptime?: number;
    version?: string;
    dependencies?: {
      mcp?: {
        status: 'ok' | 'timeout' | 'error';
        latencyMs?: number;
        toolCount?: number;
        error?: string;
      };
    };
  };

  const services: HealthServiceEntry[] = [
    {
      id: 'vault-api',
      name: 'API',
      status: r.status === 'ok' ? 'ok' : 'degraded',
      version: r.version,
      uptime: r.uptime,
    },
  ];

  if (r.dependencies?.mcp) {
    const mcp = r.dependencies.mcp;
    services.push({
      id: 'mcp',
      name: 'MCP',
      status: mcp.status === 'ok' ? 'ok' : (mcp.status as 'timeout' | 'error'),
      latencyMs: mcp.latencyMs,
      toolCount: mcp.toolCount,
      detail: mcp.error,
    });
  }

  return {
    overall: r.status === 'ok' ? 'ok' : 'degraded',
    timestamp: r.timestamp,
    services,
  };
}

export function useHealthSurface() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async (): Promise<HealthSurfacePayload> => {
      const res = await apiFetch('/api/v1/health/detailed');
      if (!res.ok) throw new Error(`Failed to fetch health: ${res.status}`);
      const body = await res.json();
      return normalizeHealthResponse(body);
    },
    staleTime: 30_000,
  });
}

// ─── Automation Surface ────────────────────────────────────────────────────────

export interface PipelineEntry {
  name: string;
}

export interface SchedulerJobEntry {
  id: string;
  pipeline: string;
  cron?: string;
  intervalSec?: number;
  mode?: string;
  lastRun?: unknown;
  source?: string;
}

export interface AutomationSurfacePayload {
  pipelines: PipelineEntry[];
  scheduler: {
    enabled: boolean;
    mode: string;
    tz: string;
    jobs: SchedulerJobEntry[];
  };
}

function normalizeAutomationResponse(
  pipelinesRes: unknown,
  schedulerRes: unknown
): AutomationSurfacePayload {
  const pl = pipelinesRes as { pipelines: string[] };
  const sc = schedulerRes as {
    enabled: boolean;
    mode: string;
    tz: string;
    jobs: SchedulerJobEntry[];
  };
  return {
    pipelines: (pl.pipelines ?? []).map((name) => ({ name })),
    scheduler: {
      enabled: sc.enabled ?? false,
      mode: sc.mode ?? 'auto',
      tz: sc.tz ?? 'UTC',
      jobs: sc.jobs ?? [],
    },
  };
}

export function useAutomationSurface() {
  return useQuery({
    queryKey: ['viewer-adapter', 'automation-surface'],
    queryFn: async (): Promise<AutomationSurfacePayload> => {
      const [pipelinesRes, schedulerRes] = await Promise.all([
        apiFetch('/api/v1/pipelines'),
        apiFetch('/api/v1/scheduler/status'),
      ]);
      if (!pipelinesRes.ok)
        throw new Error(`Failed to fetch pipelines: ${pipelinesRes.status}`);
      if (!schedulerRes.ok)
        throw new Error(`Failed to fetch scheduler: ${schedulerRes.status}`);
      const [pipelinesBody, schedulerBody] = await Promise.all([
        pipelinesRes.json(),
        schedulerRes.json(),
      ]);
      return normalizeAutomationResponse(pipelinesBody, schedulerBody);
    },
    staleTime: 30_000,
  });
}

// ─── Work Surface ──────────────────────────────────────────────────────────────

export interface WorkSurfacePayload {
  tasks: NextAction[];
  total: number;
  mode: 'cod' | 'local_fallback';
  warnings: string[];
}

export function useWorkSurface(max = 20) {
  return useQuery({
    queryKey: ['viewer-adapter', 'work-surface', max],
    queryFn: async (): Promise<WorkSurfacePayload> => {
      const res = await apiFetch(`/api/v1/tasks/next-actions?max=${max}`);
      if (!res.ok)
        throw new Error(`Failed to fetch work surface: ${res.status}`);
      const body = await res.json();
      const sc = body?.structuredContent ?? body;
      const rawTasks = Array.isArray(sc.tasks) ? sc.tasks : [];
      const tasks = (rawTasks as Array<Record<string, unknown>>).map(
        normalizeNextAction
      );
      return {
        tasks,
        total: typeof sc.total === 'number' ? sc.total : tasks.length,
        mode: sc.mode === 'cod' ? 'cod' : 'local_fallback',
        warnings: Array.isArray(body?.warnings)
          ? (body.warnings as string[])
          : [],
      };
    },
    staleTime: 60_000,
    retry: 1,
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
      if (ctx.projectId) {
        inv(queryClient, ['viewer-adapter', 'project-surface', ctx.projectId]);
      }
      break;

    case 'work':
      inv(queryClient, ['work']);
      // home surface re-ranks when task pressure changes
      inv(queryClient, ['viewer-adapter', 'home-surface']);
      // actions surface re-ranks when task status changes
      inv(queryClient, ['viewer-adapter', 'actions-surface']);
      // inbox derives from task-adjacent data — keep it fresh
      inv(queryClient, ['viewer-adapter', 'inbox-surface']);
      inv(queryClient, ['inbox']);
      // task queries used by various surfaces
      inv(queryClient, ['tasks']);
      // session data reflects task status changes
      inv(queryClient, ['sessions']);
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
