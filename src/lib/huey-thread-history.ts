/**
 * huey-thread-history.ts — localStorage-backed ThreadHistoryAdapter for @assistant-ui/react.
 *
 * One adapter instance is scoped to a single threadId. The adapter:
 *   - load()   → reads stored messages for this thread (empty if none)
 *   - append() → pushes a new message item into storage for this thread
 *
 * Storage layout:
 *   localStorage[HUEY_MESSAGES_STORAGE_KEY] = {
 *     [threadId]: {
 *       headId: string | null,
 *       messages: ExportedMessageRepositoryItem[]
 *     }
 *   }
 *
 * Deduplication: if the same message id is appended twice, the second write is ignored.
 */
import type {
  ThreadHistoryAdapter,
  ExportedMessageRepository,
  ExportedMessageRepositoryItem,
} from '@assistant-ui/react';

export const HUEY_MESSAGES_STORAGE_KEY = 'huey-thread-messages';

type PerThreadStore = {
  headId: string | null;
  messages: ExportedMessageRepositoryItem[];
};

type AllThreadsStore = Record<string, PerThreadStore>;

function readStore(): AllThreadsStore {
  try {
    const raw = localStorage.getItem(HUEY_MESSAGES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AllThreadsStore;
  } catch {
    return {};
  }
}

function writeStore(store: AllThreadsStore): void {
  try {
    localStorage.setItem(HUEY_MESSAGES_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota/security errors — message history is best-effort
  }
}

/**
 * Create a localStorage-backed ThreadHistoryAdapter scoped to a single threadId.
 */
export function createLocalStorageThreadHistoryAdapter(
  threadId: string
): ThreadHistoryAdapter {
  return {
    async load(): Promise<ExportedMessageRepository> {
      const store = readStore();
      const thread = store[threadId];
      if (!thread) {
        return { headId: null, messages: [] };
      }
      return {
        headId: thread.headId ?? null,
        messages: thread.messages,
      };
    },

    async append(item: ExportedMessageRepositoryItem): Promise<void> {
      const store = readStore();
      const thread: PerThreadStore = store[threadId] ?? {
        headId: null,
        messages: [],
      };

      // Deduplicate: ignore if message id already stored
      const messageId = item.message.id;
      if (thread.messages.some((m) => m.message.id === messageId)) {
        return;
      }

      thread.messages = [...thread.messages, item];
      thread.headId = messageId;
      store[threadId] = thread;
      writeStore(store);
    },
  };
}
