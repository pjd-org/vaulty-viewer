/**
 * agents.ts — TanStack Query hooks for viewer-side LLM agents.
 *
 * All hooks call POST /tensura/v1/supervisor/invoke with a structured prompt
 * and a fast/cheap model override. Results are JSON-parsed from the `result`
 * field of the response.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../../src/utils/api';
import {
  buildWhatNowPrompt,
  buildUpNextPrompt,
  buildStepExtractorPrompt,
  buildInboxConverterPrompt,
  buildSessionPlannerPrompt,
  buildSystemSummarizerPrompt,
  type TaskInput,
  type SessionTaskInput,
  type ProjectSummaryInput,
} from '../../../src/lib/agent-prompts';

// ---------------------------------------------------------------------------
// Shared invoker
// ---------------------------------------------------------------------------

async function invokeAgent<T>(prompt: string, model: string): Promise<T> {
  const res = await apiFetch('/tensura/v1/supervisor/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [prompt], model }),
  });

  if (!res.ok) {
    throw new Error(`Agent invoke failed: ${res.status}`);
  }

  const data = (await res.json()) as { ok: boolean; result?: string };
  if (!data.ok || !data.result) {
    throw new Error('Agent returned no result');
  }

  // Strip possible markdown code fences around JSON
  const raw = data.result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(raw) as T;
}

// ---------------------------------------------------------------------------
// What Now
// ---------------------------------------------------------------------------

export interface WhatNowResult {
  best_task_id: string;
  rationale: string;
  expected_outcome: string;
  why_now: string;
}

export function useWhatNowQuery(
  tasks: TaskInput[],
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && tasks.length > 0;
  const { prompt, model } = buildWhatNowPrompt(tasks);

  return useQuery<WhatNowResult>({
    queryKey: ['agent', 'what-now', tasks.map((t) => t.id).join(',')],
    queryFn: () => invokeAgent<WhatNowResult>(prompt, model),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 min — task selection doesn't change that fast
    retry: 0,
  });
}

// ---------------------------------------------------------------------------
// Up Next
// ---------------------------------------------------------------------------

export interface UpNextStep {
  id: string;
  title: string;
  duration: string;
  reason: string;
}

export interface UpNextResult {
  flow_label?: string;
  steps: UpNextStep[];
}

export function useUpNextQuery(
  tasks: TaskInput[],
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && tasks.length > 0;
  const { prompt, model } = buildUpNextPrompt(tasks);

  return useQuery<UpNextResult>({
    queryKey: ['agent', 'up-next', tasks.map((t) => t.id).join(',')],
    queryFn: () => invokeAgent<UpNextResult>(prompt, model),
    enabled,
    staleTime: 1000 * 60 * 5,
    retry: 0,
  });
}

// ---------------------------------------------------------------------------
// Step Extractor
// ---------------------------------------------------------------------------

export interface ExtractedStep {
  title: string;
  action: string;
  expected_result: string;
}

export interface StepExtractorResult {
  steps: ExtractedStep[];
}

export function useStepExtractorQuery(
  responseText: string,
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && responseText.trim().length > 0;
  const { prompt, model } = buildStepExtractorPrompt(responseText);

  return useQuery<StepExtractorResult>({
    queryKey: ['agent', 'step-extract', responseText.slice(0, 64)],
    queryFn: () => invokeAgent<StepExtractorResult>(prompt, model),
    enabled,
    staleTime: Infinity, // response text is immutable once set
    retry: 0,
  });
}

// ---------------------------------------------------------------------------
// Inbox Converter (mutation — user-triggered per item)
// ---------------------------------------------------------------------------

export interface InboxConvertResult {
  title: string;
  duration: string;
  effort: 'low' | 'medium' | 'high';
  type: 'execution' | 'research' | 'setup';
  project: string | null;
}

export function useInboxConverterMutation() {
  return useMutation<InboxConvertResult, Error, string>({
    mutationFn: (rawText: string) => {
      const { prompt, model } = buildInboxConverterPrompt(rawText);
      return invokeAgent<InboxConvertResult>(prompt, model);
    },
  });
}

// ---------------------------------------------------------------------------
// Session Planner
// ---------------------------------------------------------------------------

export interface SessionPlanTask {
  id: string;
  title: string;
  duration: string;
}

export interface SessionPlanResult {
  main_task: SessionPlanTask;
  supporting_tasks: SessionPlanTask[];
  total_time: string;
  expected_outcome: string;
}

export function useSessionPlannerQuery(
  tasks: SessionTaskInput[],
  budgetMin: number,
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? false) && tasks.length > 0 && budgetMin > 0;
  const { prompt, model } = buildSessionPlannerPrompt(tasks, budgetMin);

  return useQuery<SessionPlanResult>({
    queryKey: ['agent', 'session-plan', budgetMin, tasks.map((t) => t.id).join(',')],
    queryFn: () => invokeAgent<SessionPlanResult>(prompt, model),
    enabled,
    staleTime: 1000 * 60 * 10,
    retry: 0,
  });
}

// ---------------------------------------------------------------------------
// System State Summarizer
// ---------------------------------------------------------------------------

export interface SystemSummaryResult {
  summary: string[];
}

export function useSystemSummarizerQuery(
  tasks: TaskInput[],
  projects: ProjectSummaryInput[],
  options?: { enabled?: boolean }
) {
  const enabled = (options?.enabled ?? true) && tasks.length > 0;
  const { prompt, model } = buildSystemSummarizerPrompt(tasks, projects);

  return useQuery<SystemSummaryResult>({
    queryKey: ['agent', 'system-summary', tasks.map((t) => t.id).join(',')],
    queryFn: () => invokeAgent<SystemSummaryResult>(prompt, model),
    enabled,
    staleTime: 1000 * 60 * 5,
    retry: 0,
  });
}
