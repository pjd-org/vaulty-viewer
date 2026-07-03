/**
 * primary-agent-intents.ts — intent templates for the Primary Agent execution interface.
 * Pure data and functions. No API calls.
 */

export interface ThreadRecord {
  id: string;
  title: string;
  intent: IntentType | null;
  emoji: string;
  timestamp: number;
}

export type IntentType =
  | 'plan_next_step'
  | 'review_spec'
  | 'debug_blocker'
  | 'generate_code'
  | 'summarize_state'
  | 'freeform';

export interface IntentField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  multiline?: boolean;
}

export interface IntentTemplate {
  id: IntentType;
  label: string;
  description: string;
  fields: IntentField[];
  buildPrompt: (values: Record<string, string>) => string;
}

export const INTENT_TEMPLATES: IntentTemplate[] = [
  {
    id: 'plan_next_step',
    label: 'Plan next step',
    description: 'Get ordered next actions for a goal or area.',
    fields: [
      {
        key: 'goal',
        label: 'Goal or area',
        placeholder: 'e.g. finish viewer redesign, unblock promotion pipeline',
        required: true,
      },
      {
        key: 'constraints',
        label: 'Constraints',
        placeholder: 'e.g. max 2h, no breaking changes, only frontend',
        required: false,
      },
    ],
    buildPrompt: (v) =>
      [
        '[Intent: plan_next_step]',
        `Goal: ${v.goal ?? ''}`,
        v.constraints ? `Constraints: ${v.constraints}` : '',
        'Respond with: numbered next actions, brief reasoning per step, dependencies, estimated effort.',
      ]
        .filter(Boolean)
        .join('\n'),
  },
  {
    id: 'review_spec',
    label: 'Review spec / task',
    description: 'Spot issues, gaps, and improvements in a spec or task.',
    fields: [
      {
        key: 'spec',
        label: 'Spec path or description',
        placeholder: 'e.g. specs/viewer-redesign.md or paste the spec here',
        required: true,
        multiline: true,
      },
    ],
    buildPrompt: (v) =>
      [
        '[Intent: review_spec]',
        `Spec: ${v.spec ?? ''}`,
        'Respond with: issues found, gaps, improvements needed.',
      ].join('\n'),
  },
  {
    id: 'debug_blocker',
    label: 'Debug blocker',
    description: 'Diagnose what is blocked and get exact next steps.',
    fields: [
      {
        key: 'blocked',
        label: 'What is blocked',
        placeholder: 'e.g. session start always returns 404, API offline, test failing',
        required: true,
        multiline: true,
      },
      {
        key: 'tried',
        label: 'What you have tried',
        placeholder: 'e.g. checked logs, restarted service, verified env vars',
        required: false,
        multiline: true,
      },
    ],
    buildPrompt: (v) =>
      [
        '[Intent: debug_blocker]',
        `Blocked: ${v.blocked ?? ''}`,
        v.tried ? `Tried: ${v.tried}` : '',
        'Respond with: root cause hypothesis, missing pieces, exact next steps.',
      ]
        .filter(Boolean)
        .join('\n'),
  },
  {
    id: 'generate_code',
    label: 'Generate code',
    description: 'Get implementation-ready code for a task.',
    fields: [
      {
        key: 'task',
        label: 'What to implement',
        placeholder: 'e.g. add PATCH /tasks/:path/priority endpoint to API',
        required: true,
        multiline: true,
      },
      {
        key: 'context',
        label: 'Context or constraints',
        placeholder: 'e.g. TypeScript, Fastify, must not break existing tests',
        required: false,
      },
    ],
    buildPrompt: (v) =>
      [
        '[Intent: generate_code]',
        `Task: ${v.task ?? ''}`,
        v.context ? `Context: ${v.context}` : '',
        'Respond with: implementation-ready code first, then minimal explanation.',
      ]
        .filter(Boolean)
        .join('\n'),
  },
  {
    id: 'summarize_state',
    label: 'Summarize state',
    description: 'Get current state, blockers, and recommended moves.',
    fields: [
      {
        key: 'scope',
        label: 'Scope or area',
        placeholder: 'e.g. viewer, API, promotion pipeline, all (default)',
        required: false,
      },
    ],
    buildPrompt: (v) =>
      [
        '[Intent: summarize_state]',
        `Scope: ${v.scope?.trim() || 'repo'}`,
        'Respond with: current state summary, key blockers, recommended next moves.',
      ].join('\n'),
  },
  {
    id: 'freeform',
    label: 'Free input',
    description: 'Ask anything directly.',
    fields: [
      {
        key: 'message',
        label: 'Message',
        placeholder: 'Ask the Primary Agent to plan, inspect, explain, or act...',
        required: true,
        multiline: true,
      },
    ],
    buildPrompt: (v) => v.message ?? '',
  },
];

export function getTemplate(id: IntentType): IntentTemplate {
  return INTENT_TEMPLATES.find((t) => t.id === id) ?? INTENT_TEMPLATES[INTENT_TEMPLATES.length - 1];
}

export function isIntentComplete(
  template: IntentTemplate,
  values: Record<string, string>
): boolean {
  return template.fields
    .filter((f) => f.required)
    .every((f) => (values[f.key] ?? '').trim().length > 0);
}
