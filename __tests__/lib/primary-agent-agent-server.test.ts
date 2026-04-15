import { describe, expect, it } from 'vitest'
import {
  buildPrimaryAgentServerRunPath,
  parsePrimaryAgentServerRunResponse,
} from '../../src/lib/primary-agent-agent-server'

describe('primary-agent agent-server helpers', () => {
  it('builds an encoded run path for a thread', () => {
    expect(buildPrimaryAgentServerRunPath('primary-agent/thread 1')).toBe(
      '/tensura/v1/agent-server/threads/primary-agent%2Fthread%201/runs'
    )
  })

  it('parses a completed run response into PrimaryAgent UI fields', () => {
    const parsed = parsePrimaryAgentServerRunResponse(
      {
        thread: { id: 'thread-123' },
        run: {
          output: {
            result: 'planned the migration',
            next_action: 'respond',
            tool_results_degraded: true,
          },
        },
      },
      'fallback-thread'
    )

    expect(parsed).toEqual({
      threadId: 'thread-123',
      assistantText: 'planned the migration',
      meta: 'Thread thread-123 · Next: respond · ⚠ Degraded tools',
      isError: false,
      errorDetail: null,
    })
  })

  it('falls back to top-level compatibility fields and default text', () => {
    const parsed = parsePrimaryAgentServerRunResponse(
      {
        threadId: 'thread-compat',
        result: '',
      },
      'fallback-thread'
    )

    expect(parsed).toEqual({
      threadId: 'thread-compat',
      assistantText: '(No response)',
      meta: 'Thread thread-compat',
      isError: false,
      errorDetail: null,
    })
  })
})
