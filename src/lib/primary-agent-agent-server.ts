type AgentServerRunPayload = {
  error?: string;
  result?: string;
  threadId?: string;
  thread_id?: string;
  next_action?: string | null;
  tool_results_degraded?: boolean;
  thread?: {
    id?: string;
  };
  run?: {
    output?: {
      result?: string;
      next_action?: string | null;
      tool_results_degraded?: boolean;
    };
    status?: string;
    error?: string;
  };
};

export function buildPrimaryAgentServerRunPath(threadId: string): string {
  return `/tensura/v1/agent-server/threads/${encodeURIComponent(threadId)}/runs`;
}

export function buildPrimaryAgentServerStreamPath(threadId: string): string {
  return `/tensura/v1/agent-server/threads/${encodeURIComponent(threadId)}/stream`;
}

export function parsePrimaryAgentServerRunResponse(
  payload: AgentServerRunPayload | null,
  fallbackThreadId: string
): {
  threadId: string;
  assistantText: string;
  meta: string;
  isError: boolean;
  errorDetail: string | null;
} {
  const threadId =
    payload?.thread?.id ||
    payload?.threadId ||
    payload?.thread_id ||
    fallbackThreadId;

  // Surface errors from 200-envelope failures
  const isError = !!(payload?.error || payload?.run?.status === 'failed');
  const errorDetail = payload?.run?.error || payload?.error || null;

  const output = payload?.run?.output;
  const rawText = output?.result?.trim() || payload?.result?.trim() || '';

  let assistantText: string;
  if (isError) {
    assistantText = errorDetail
      ? `⚠ ${errorDetail}`
      : '⚠ Primary Agent encountered an error.';
  } else if (!rawText) {
    assistantText = '(No response)';
  } else {
    assistantText = rawText;
  }

  const nextAction = output?.next_action ?? payload?.next_action;
  const toolResultsDegraded =
    output?.tool_results_degraded ?? payload?.tool_results_degraded;

  const metaParts = [`Thread ${threadId}`];
  if (nextAction) metaParts.push(`Next: ${nextAction}`);
  if (toolResultsDegraded) metaParts.push('⚠ Degraded tools');
  if (isError) metaParts.push('⚠ Run failed');

  return {
    threadId,
    assistantText,
    meta: metaParts.join(' · '),
    isError,
    errorDetail,
  };
}
