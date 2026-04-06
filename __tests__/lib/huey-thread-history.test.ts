/**
 * Tests for createLocalStorageThreadHistoryAdapter
 *
 * The adapter persists ExportedMessageRepositoryItem entries per threadId
 * in localStorage under HUEY_MESSAGES_STORAGE_KEY.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLocalStorageThreadHistoryAdapter,
  HUEY_MESSAGES_STORAGE_KEY,
} from '../../src/lib/huey-thread-history';
import type { ExportedMessageRepositoryItem } from '@assistant-ui/react';
import type { ThreadMessage } from '@assistant-ui/react';

const THREAD_A = 'huey-thread-a';
const THREAD_B = 'huey-thread-b';

function makeItem(
  id: string,
  role: 'user' | 'assistant',
  text: string,
  parentId: string | null = null
): ExportedMessageRepositoryItem {
  const baseMessage = {
    id,
    role,
    status: { type: 'complete' as const, reason: 'stop' as const },
    content: [{ type: 'text' as const, text }],
    createdAt: new Date(),
    metadata: {
      steps: [],
      unstable_annotations: [],
      unstable_data: [],
      custom: {},
    },
    attachments: [],
  };
  return {
    parentId,
    message: baseMessage as unknown as ThreadMessage,
  };
}

describe('createLocalStorageThreadHistoryAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('load() returns empty repository when no messages stored', async () => {
    const adapter = createLocalStorageThreadHistoryAdapter(THREAD_A);
    const repo = await adapter.load();
    expect(repo.messages).toHaveLength(0);
    expect(repo.headId ?? null).toBeNull();
  });

  it('append() persists a message and load() restores it', async () => {
    const adapter = createLocalStorageThreadHistoryAdapter(THREAD_A);
    const item = makeItem('msg-1', 'user', 'Hello Huey');
    await adapter.append(item);

    const repo = await adapter.load();
    expect(repo.messages).toHaveLength(1);
    expect(repo.messages[0].message.id).toBe('msg-1');
  });

  it('append() multiple messages maintains insertion order', async () => {
    const adapter = createLocalStorageThreadHistoryAdapter(THREAD_A);
    const item1 = makeItem('msg-1', 'user', 'First', null);
    const item2 = makeItem('msg-2', 'assistant', 'Response', 'msg-1');
    await adapter.append(item1);
    await adapter.append(item2);

    const repo = await adapter.load();
    expect(repo.messages).toHaveLength(2);
    expect(repo.messages[0].message.id).toBe('msg-1');
    expect(repo.messages[1].message.id).toBe('msg-2');
    expect(repo.messages[1].parentId).toBe('msg-1');
  });

  it('headId is the id of the last appended message', async () => {
    const adapter = createLocalStorageThreadHistoryAdapter(THREAD_A);
    await adapter.append(makeItem('msg-1', 'user', 'Q'));
    await adapter.append(makeItem('msg-2', 'assistant', 'A', 'msg-1'));

    const repo = await adapter.load();
    expect(repo.headId).toBe('msg-2');
  });

  it('threads are isolated — THREAD_A messages do not appear in THREAD_B', async () => {
    const adapterA = createLocalStorageThreadHistoryAdapter(THREAD_A);
    const adapterB = createLocalStorageThreadHistoryAdapter(THREAD_B);

    await adapterA.append(makeItem('msg-a1', 'user', 'Thread A message'));

    const repoB = await adapterB.load();
    expect(repoB.messages).toHaveLength(0);
  });

  it('two adapters for the same threadId share the same storage', async () => {
    const adapterA1 = createLocalStorageThreadHistoryAdapter(THREAD_A);
    const adapterA2 = createLocalStorageThreadHistoryAdapter(THREAD_A);

    await adapterA1.append(makeItem('msg-1', 'user', 'Hello'));

    const repo = await adapterA2.load();
    expect(repo.messages).toHaveLength(1);
  });

  it('load() gracefully returns empty repository on corrupt storage', async () => {
    localStorage.setItem(HUEY_MESSAGES_STORAGE_KEY, '{invalid json!!');
    const adapter = createLocalStorageThreadHistoryAdapter(THREAD_A);
    const repo = await adapter.load();
    expect(repo.messages).toHaveLength(0);
  });

  it('append() deduplicates on repeated message id', async () => {
    const adapter = createLocalStorageThreadHistoryAdapter(THREAD_A);
    const item = makeItem('msg-1', 'user', 'Hello');
    await adapter.append(item);
    await adapter.append(item); // same id again

    const repo = await adapter.load();
    expect(repo.messages).toHaveLength(1);
  });
});
