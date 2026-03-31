import { describe, expect, it } from 'vitest'
import {
  buildHueyAgentServerRunPath,
  parseHueyAgentServerRunResponse,
} from '../../src/lib/huey-agent-server'

describe('huey agent-server helpers', () => {
  it('builds an encoded run path for a thread', () => {
    expect(buildHueyAgentServerRunPath('huey/thread 1')).toBe(
      '/tensura/v1/agent-server/threads/huey%2Fthread%201/runs'
    )
  })

  it('parses a completed run response into Huey UI fields', () => {
    const parsed = parseHueyAgentServerRunResponse(
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
    })
  })

  it('falls back to top-level compatibility fields and default text', () => {
    const parsed = parseHueyAgentServerRunResponse(
      {
        threadId: 'thread-compat',
        result: '',
      },
      'fallback-thread'
    )

    expect(parsed).toEqual({
      threadId: 'thread-compat',
      assistantText: 'Huey responded without text.',
      meta: 'Thread thread-compat',
    })
  })
})
