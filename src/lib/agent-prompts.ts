/**
 * agent-prompts.ts — Prompt builders for viewer-side agents.
 *
 * Each builder returns a { prompt, model } pair ready to send to
 * POST /tensura/v1/supervisor/invoke.
 *
 * All agents use the fast/cheap tier — output is structured JSON,
 * not multi-step reasoning chains.
 */

// Default fast model for all viewer agents.
const FAST_MODEL = 'claude-haiku-4-5';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface AgentPromptResult {
  prompt: string;
  model: string;
}

export interface TaskInput {
  id: string;
  title: string;
  estimatedMinutes?: number;
  focusCost?: number;
  priority?: number;
  project?: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// 1. What Now — single best next action
// ---------------------------------------------------------------------------

export function buildWhatNowPrompt(tasks: TaskInput[]): AgentPromptResult {
  const taskList = tasks
    .slice(0, 20)
    .map(
      (t, i) =>
        `${i + 1}. [${t.id}] ${t.title}` +
        (t.estimatedMinutes ? ` (~${t.estimatedMinutes}m)` : '') +
        (t.focusCost !== undefined ? ` focus:${t.focusCost}` : '') +
        (t.priority !== undefined ? ` priority:${t.priority}` : '') +
        (t.project ? ` (${t.project})` : '')
    )
    .join('\n');

  const prompt = `[Intent: what_now]
You are the execution selector. Pick the single highest-leverage next task.

Tasks:
${taskList}

Rules:
1. Optimize for momentum + real-world impact.
2. Prefer tasks that unblock others, are short (<45 min), or reduce uncertainty.
3. Avoid vague, exploratory, or long high-friction tasks unless critical.

Respond ONLY with valid JSON (no markdown, no prose):
{
  "best_task_id": "<id>",
  "rationale": "<1-2 sentences>",
  "expected_outcome": "<one sentence>",
  "why_now": "<constraint or leverage reason>"
}`;

  return { prompt, model: FAST_MODEL };
}

// ---------------------------------------------------------------------------
// 2. Up Next — structured 3-step execution flow
// ---------------------------------------------------------------------------

export function buildUpNextPrompt(tasks: TaskInput[]): AgentPromptResult {
  const taskList = tasks
    .slice(0, 15)
    .map(
      (t, i) =>
        `${i + 1}. [${t.id}] ${t.title}` +
        (t.estimatedMinutes ? ` (~${t.estimatedMinutes}m)` : '') +
        (t.project ? ` (${t.project})` : '')
    )
    .join('\n');

  const prompt = `[Intent: up_next]
You are a workflow planner. Turn the task list into a 3-step execution sequence.

Tasks:
${taskList}

Rules:
1. Select 2-4 tasks only.
2. Order by: dependency → ease of execution → momentum.
3. Prefer: quick wins first, setup → execution → validation pattern.

Respond ONLY with valid JSON (no markdown, no prose):
{
  "flow_label": "<optional one-phrase label>",
  "steps": [
    { "id": "<task_id>", "title": "<title>", "duration": "<Xm>", "reason": "<why this order>" }
  ]
}`;

  return { prompt, model: FAST_MODEL };
}

// ---------------------------------------------------------------------------
// 3. Step Extractor — turn LLM response into atomic steps
// ---------------------------------------------------------------------------

export function buildStepExtractorPrompt(
  responseText: string
): AgentPromptResult {
  const truncated = responseText.slice(0, 3000);

  const prompt = `[Intent: step_extract]
You are an execution extractor. Turn this assistant response into atomic, actionable steps.

Response:
"""
${truncated}
"""

Rules:
1. Break into atomic actions (1 action = 1 step).
2. Each step must be: concrete, testable, actionable without interpretation.
3. Remove all explanation and fluff.

Respond ONLY with valid JSON (no markdown, no prose):
{
  "steps": [
    { "title": "<short label>", "action": "<imperative sentence>", "expected_result": "<one sentence>" }
  ]
}`;

  return { prompt, model: FAST_MODEL };
}

// ---------------------------------------------------------------------------
// 4. Inbox → Task Converter
// ---------------------------------------------------------------------------

export function buildInboxConverterPrompt(rawText: string): AgentPromptResult {
  const truncated = rawText.slice(0, 1500);

  const prompt = `[Intent: inbox_convert]
You are a task normalizer. Convert this raw inbox item into a structured, executable task.

Item:
"""
${truncated}
"""

Rules:
1. Extract the core intent — what needs to be done.
2. Convert into a single clear task title (imperative, < 10 words).
3. Estimate duration and effort honestly.
4. Type: "execution" (build/do), "research" (investigate), or "setup" (configure/prepare).

Respond ONLY with valid JSON (no markdown, no prose):
{
  "title": "<imperative task title>",
  "duration": "<Xm or Xh>",
  "effort": "low" | "medium" | "high",
  "type": "execution" | "research" | "setup",
  "project": "<project name if obvious, else null>"
}`;

  return { prompt, model: FAST_MODEL };
}

// ---------------------------------------------------------------------------
// 6. Session Planner
// ---------------------------------------------------------------------------

export interface SessionTaskInput {
  id: string;
  title: string;
  estimatedMinutes?: number;
  focusCost?: number;
  priority?: number;
}

export function buildSessionPlannerPrompt(
  tasks: SessionTaskInput[],
  budgetMin: number
): AgentPromptResult {
  const taskList = tasks
    .slice(0, 15)
    .map(
      (t, i) =>
        `${i + 1}. [${t.id}] ${t.title}` +
        (t.estimatedMinutes ? ` (~${t.estimatedMinutes}m)` : '') +
        (t.focusCost !== undefined ? ` focus:${t.focusCost}` : '') +
        (t.priority !== undefined ? ` priority:${t.priority}` : '')
    )
    .join('\n');

  const prompt = `[Intent: session_plan]
You are a session planner. Create a focused execution block.

Available time: ${budgetMin} minutes
Tasks:
${taskList}

Rules:
1. Pick 1 main task + 1-2 supporting tasks.
2. Total time must be <= ${budgetMin} minutes.
3. Prefer: one clear outcome, minimal context switching.
4. Main task should be the highest-leverage work.

Respond ONLY with valid JSON (no markdown, no prose):
{
  "main_task": { "id": "<id>", "title": "<title>", "duration": "<Xm>" },
  "supporting_tasks": [ { "id": "<id>", "title": "<title>", "duration": "<Xm>" } ],
  "total_time": "<Xm>",
  "expected_outcome": "<one sentence — what will be true when session ends>"
}`;

  return { prompt, model: FAST_MODEL };
}

// ---------------------------------------------------------------------------
// 7. System State Summarizer
// ---------------------------------------------------------------------------

export interface ProjectSummaryInput {
  id: string;
  title: string;
  taskCount?: number;
}

export function buildSystemSummarizerPrompt(
  tasks: TaskInput[],
  projects: ProjectSummaryInput[]
): AgentPromptResult {
  const taskSummary = tasks
    .slice(0, 20)
    .map((t) => `- [${t.status ?? 'todo'}] ${t.title}${t.project ? ` (${t.project})` : ''}`)
    .join('\n');

  const projectSummary = projects
    .slice(0, 8)
    .map((p) => `- ${p.title}${p.taskCount !== undefined ? ` (${p.taskCount} tasks)` : ''}`)
    .join('\n');

  const prompt = `[Intent: system_summarize]
You are a system summarizer. Give a 3-bullet executive summary of current execution state.

Tasks:
${taskSummary || '(none)'}

Projects:
${projectSummary || '(none)'}

Rules:
1. Highlight: what is actively progressing, what is blocked, what is at risk.
2. Be brutally concise — max 3 bullets, each < 15 words.
3. Only surface things that actually matter right now.

Respond ONLY with valid JSON (no markdown, no prose):
{
  "summary": ["<bullet 1>", "<bullet 2>", "<bullet 3>"]
}`;

  return { prompt, model: FAST_MODEL };
}
