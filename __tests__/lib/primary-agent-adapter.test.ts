/**
 * primary-agent-adapter.test.ts — Unit tests for createPrimaryAgentModelAdapter
 *
 * Mocks apiFetch and primary-agent-agent-server helpers. Tests:
 *   1. Sends correct path and body to agent server
 *   2. Returns assistant text from parsed response
 *   3. Retries with gpt-4o-mini on 429
 *   4. Retries with gpt-4o-mini on 500
 *   5. Throws when primary fails and no payload, fallback not attempted
 *   6. Calls onThreadIdResolved when server returns a different threadId
 *   7. Does NOT call onThreadIdResolved when server returns same threadId
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockInstance,
} from 'vitest';
import type {
  ChatModelRunOptions,
  ChatModelRunResult,
  ThreadMessage,
} from '@assistant-ui/react';

// ---------------------------------------------------------------------------
// Mocks — must be declared before module imports
// ---------------------------------------------------------------------------

vi.mock('../../src/utils/api', () => ({ apiFetch: vi.fn() }));
vi.mock('../../src/lib/primary-agent-agent-server', () => ({
  buildPrimaryAgentServerRunPath: (threadId: string) =>
    `/tensura/v1/agent-server/threads/${encodeURIComponent(threadId)}/runs`,
  parsePrimaryAgentServerRunResponse: vi.fn(),
}));

import { apiFetch } from '../../src/utils/api';
import { parsePrimaryAgentServerRunResponse } from '../../src/lib/primary-agent-agent-server';
import { createPrimaryAgentModelAdapter } from '../../src/lib/primary-agent-adapter';

const mockApiFetch = apiFetch as unknown as MockInstance;
const mockParse = parsePrimaryAgentServerRunResponse as unknown as MockInstance;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse(ok: boolean, status: number, body: unknown): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function makeMessages(text: string): readonly ThreadMessage[] {
  return [
    {
      id: 'msg-1',
      role: 'user',
      content: [{ type: 'text', text }],
      status: { type: 'complete', reason: 'unknown' },
      metadata: {
        unstable_annotations: [],
        unstable_data: [],
        steps: [],
        custom: {},
      },
    } as unknown as ThreadMessage,
  ];
}

function makeRunOptions(
  text: string,
  abortSignal?: AbortSignal
): ChatModelRunOptions {
  return {
    messages: makeMessages(text),
    abortSignal: abortSignal ?? new AbortController().signal,
    runConfig: {},
    context: {} as never,
    config: {} as never,
    unstable_getMessage: () => {
      throw new Error('not used');
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createPrimaryAgentModelAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends POST to the correct path with thread_id and messages', async () => {
    mockApiFetch.mockResolvedValueOnce(
      makeResponse(true, 200, { result: 'ok', thread: { id: 'thread-abc' } })
    );
    mockParse.mockReturnValueOnce({
      threadId: 'thread-abc',
      assistantText: 'ok',
      meta: 'Thread thread-abc',
    });

    const adapter = createPrimaryAgentModelAdapter({ getThreadId: () => 'thread-abc' });
    await adapter.run(makeRunOptions('hello'));

    expect(mockApiFetch).toHaveBeenCalledOnce();
    const [path, init] = mockApiFetch.mock.calls[0];
    expect(path).toBe('/tensura/v1/agent-server/threads/thread-abc/runs');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.thread_id).toBe('thread-abc');
    expect(body.messages[0].content).toBe('hello');
    expect(body.mode).toBe('repo+spec');
    expect(body.model).toBeUndefined();
  });

  it('returns content with assistantText from parsed response', async () => {
    mockApiFetch.mockResolvedValueOnce(
      makeResponse(true, 200, { result: 'Planned the sprint' })
    );
    mockParse.mockReturnValueOnce({
      threadId: 'thread-abc',
      assistantText: 'Planned the sprint',
      meta: 'Thread thread-abc',
    });

    const adapter = createPrimaryAgentModelAdapter({ getThreadId: () => 'thread-abc' });
    const result = await (adapter.run(
      makeRunOptions('plan')
    ) as Promise<ChatModelRunResult>);

    expect(result.content).toEqual([
      { type: 'text', text: 'Planned the sprint' },
    ]);
  });

  it('retries with gpt-4o-mini on 429', async () => {
    mockApiFetch
      .mockResolvedValueOnce(makeResponse(false, 429, null))
      .mockResolvedValueOnce(
        makeResponse(true, 200, { result: 'fallback ok' })
      );
    mockParse.mockReturnValueOnce({
      threadId: 'thread-abc',
      assistantText: 'fallback ok',
      meta: 'Thread thread-abc',
    });

    const adapter = createPrimaryAgentModelAdapter({ getThreadId: () => 'thread-abc' });
    const result = await (adapter.run(
      makeRunOptions('retry test')
    ) as Promise<ChatModelRunResult>);

    expect(mockApiFetch).toHaveBeenCalledTimes(2);
    const fallbackBody = JSON.parse(
      mockApiFetch.mock.calls[1][1].body as string
    );
    expect(fallbackBody.model).toBe('gpt-4o-mini');
    expect(result.content).toEqual([{ type: 'text', text: 'fallback ok' }]);
  });

  it('retries with gpt-4o-mini on 500', async () => {
    mockApiFetch
      .mockResolvedValueOnce(makeResponse(false, 500, null))
      .mockResolvedValueOnce(makeResponse(true, 200, { result: 'recovered' }));
    mockParse.mockReturnValueOnce({
      threadId: 'thread-abc',
      assistantText: 'recovered',
      meta: 'Thread thread-abc',
    });

    const adapter = createPrimaryAgentModelAdapter({ getThreadId: () => 'thread-abc' });
    await adapter.run(makeRunOptions('server error'));

    expect(mockApiFetch).toHaveBeenCalledTimes(2);
    const fallbackBody = JSON.parse(
      mockApiFetch.mock.calls[1][1].body as string
    );
    expect(fallbackBody.model).toBe('gpt-4o-mini');
  });

  it('throws when primary fails non-retryable with no payload', async () => {
    mockApiFetch.mockResolvedValueOnce(makeResponse(false, 403, null));

    const adapter = createPrimaryAgentModelAdapter({ getThreadId: () => 'thread-abc' });
    await expect(adapter.run(makeRunOptions('forbidden'))).rejects.toThrow(
      'Primary Agent request failed (403)'
    );
    // No fallback attempted for 403
    expect(mockApiFetch).toHaveBeenCalledOnce();
  });

  it('calls onThreadIdResolved when server returns a different threadId', async () => {
    mockApiFetch.mockResolvedValueOnce(
      makeResponse(true, 200, { thread: { id: 'thread-server-new' } })
    );
    mockParse.mockReturnValueOnce({
      threadId: 'thread-server-new',
      assistantText: 'hello',
      meta: 'Thread thread-server-new',
    });

    const onThreadIdResolved = vi.fn();
    const adapter = createPrimaryAgentModelAdapter({
      getThreadId: () => 'thread-local',
      onThreadIdResolved,
    });
    await adapter.run(makeRunOptions('new thread'));

    expect(onThreadIdResolved).toHaveBeenCalledWith('thread-server-new');
  });

  it('does NOT call onThreadIdResolved when server returns same threadId', async () => {
    mockApiFetch.mockResolvedValueOnce(
      makeResponse(true, 200, { thread: { id: 'thread-same' } })
    );
    mockParse.mockReturnValueOnce({
      threadId: 'thread-same',
      assistantText: 'unchanged',
      meta: 'Thread thread-same',
    });

    const onThreadIdResolved = vi.fn();
    const adapter = createPrimaryAgentModelAdapter({
      getThreadId: () => 'thread-same',
      onThreadIdResolved,
    });
    await adapter.run(makeRunOptions('same thread'));

    expect(onThreadIdResolved).not.toHaveBeenCalled();
  });
});
