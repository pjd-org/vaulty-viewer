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
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  useAui,
  Tools,
} from '@assistant-ui/react';
import {
  createHueyModelAdapter,
  type HueyContext,
} from '../../../src/lib/huey-adapter';
import { createLocalStorageThreadHistoryAdapter } from '../../../src/lib/huey-thread-history';
import { hueyToolkit } from '../../../src/lib/huey-toolkit';

interface HueyAssistantProviderProps {
  children: React.ReactNode;
  threadId: string;
  onThreadIdChange: (id: string) => void;
  getIntent: () => string | null;
  getContext: () => HueyContext | null;
}

/**
 * Inner bridge: must live inside AssistantRuntimeProvider to call useAui.
 * Registers the hueyToolkit renders on the active runtime.
 */
function HueyToolkitBridge({ children }: { children: React.ReactNode }) {
  useAui({ tools: Tools({ toolkit: hueyToolkit }) });
  return <>{children}</>;
}

export function HueyAssistantProvider({
  children,
  threadId,
  onThreadIdChange,
  getIntent,
  getContext,
}: HueyAssistantProviderProps) {
  // Ref keeps onThreadIdChange stable across renders without recreating the model adapter.
  const onThreadIdChangeRef = useRef(onThreadIdChange);
  onThreadIdChangeRef.current = onThreadIdChange;

  // Model adapter is stable — it reads threadId, intent, and context via refs.
  const threadIdRef = useRef(threadId);
  threadIdRef.current = threadId;

  const getIntentRef = useRef(getIntent);
  getIntentRef.current = getIntent;

  const getContextRef = useRef(getContext);
  getContextRef.current = getContext;

  const modelAdapter = useMemo(
    () =>
      createHueyModelAdapter({
        getThreadId: () => threadIdRef.current,
        onThreadIdResolved: (resolvedId) =>
          onThreadIdChangeRef.current(resolvedId),
        getIntent: () => getIntentRef.current(),
        getContext: () => getContextRef.current(),
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
      <HueyToolkitBridge>{children}</HueyToolkitBridge>
    </AssistantRuntimeProvider>
  );
}
