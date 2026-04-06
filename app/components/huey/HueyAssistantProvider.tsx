/**
 * HueyAssistantProvider — scoped @assistant-ui/react runtime wrapper.
 *
 * SCOPE INVARIANT: This file is the only entry point for @assistant-ui/react
 * in the viewer. It must NOT be imported from any route other than /huey.
 *
 * Usage:
 *   <HueyAssistantProvider threadId={threadId} onThreadIdChange={handleChange}>
 *     <YourChatUI />
 *   </HueyAssistantProvider>
 *
 * Thread persistence: each threadId gets its own localStorage-backed
 * ThreadHistoryAdapter. The adapter is re-created when threadId changes so
 * useLocalRuntime loads the correct message history for the active thread.
 */
import React, { useMemo, useRef } from 'react';
import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react';
import { createHueyModelAdapter } from '../../../src/lib/huey-adapter';
import { createLocalStorageThreadHistoryAdapter } from '../../../src/lib/huey-thread-history';

interface HueyAssistantProviderProps {
  children: React.ReactNode;
  threadId: string;
  onThreadIdChange: (id: string) => void;
}

export function HueyAssistantProvider({
  children,
  threadId,
  onThreadIdChange,
}: HueyAssistantProviderProps) {
  // Ref keeps onThreadIdChange stable across renders without recreating the model adapter.
  const onThreadIdChangeRef = useRef(onThreadIdChange);
  onThreadIdChangeRef.current = onThreadIdChange;

  // Model adapter is stable — it reads threadId via a ref inside createHueyModelAdapter.
  // We pass a getter that always returns the latest threadId.
  const threadIdRef = useRef(threadId);
  threadIdRef.current = threadId;

  const modelAdapter = useMemo(
    () =>
      createHueyModelAdapter({
        getThreadId: () => threadIdRef.current,
        onThreadIdResolved: (resolvedId) =>
          onThreadIdChangeRef.current(resolvedId),
      }),
    [] // stable — refs handle mutability
  );

  // History adapter is scoped per threadId so switching threads loads the
  // correct persisted conversation from localStorage.
  const historyAdapter = useMemo(
    () => createLocalStorageThreadHistoryAdapter(threadId),
    [threadId]
  );

  const runtime = useLocalRuntime(modelAdapter, {
    adapters: { history: historyAdapter },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
