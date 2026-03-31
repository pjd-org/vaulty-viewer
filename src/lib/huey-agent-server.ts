type AgentServerRunPayload = {
  result?: string
  threadId?: string
  thread_id?: string
  next_action?: string | null
  tool_results_degraded?: boolean
  thread?: {
    id?: string
  }
  run?: {
    output?: {
      result?: string
      next_action?: string | null
      tool_results_degraded?: boolean
    }
  }
}

export function buildHueyAgentServerRunPath(threadId: string): string {
  return `/tensura/v1/agent-server/threads/${encodeURIComponent(threadId)}/runs`
}

export function parseHueyAgentServerRunResponse(
  payload: AgentServerRunPayload | null,
  fallbackThreadId: string
): {
  threadId: string
  assistantText: string
  meta: string
} {
  const threadId =
    payload?.thread?.id ||
    payload?.threadId ||
    payload?.thread_id ||
    fallbackThreadId

  const output = payload?.run?.output
  const assistantText =
    output?.result?.trim() || payload?.result?.trim() || 'Huey responded without text.'

  const nextAction = output?.next_action ?? payload?.next_action
  const toolResultsDegraded =
    output?.tool_results_degraded ?? payload?.tool_results_degraded

  const metaParts = [`Thread ${threadId}`]
  if (nextAction) metaParts.push(`Next: ${nextAction}`)
  if (toolResultsDegraded) metaParts.push('⚠ Degraded tools')

  return {
    threadId,
    assistantText,
    meta: metaParts.join(' · '),
  }
}
