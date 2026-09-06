/**
 * PrimaryAgentAssistantProvider — scoped @assistant-ui/react runtime wrapper.
 *
 * SCOPE INVARIANT: This file is the only entry point for @assistant-ui/react
 * in the viewer. It must NOT be imported from any route other than the
 * Primary Agent route alias (/huey).
 *
 * Usage:
 *   <PrimaryAgentAssistantProvider threadId={threadId} onThreadIdChange={handleChange}>
 *     <YourChatUI />
 *   </PrimaryAgentAssistantProvider>
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
import { createPrimaryAgentModelAdapter } from '../../../src/lib/primary-agent-adapter';
import { createLocalStorageThreadHistoryAdapter } from '../../../src/lib/primary-agent-thread-history';
import { primaryAgentToolkit } from '../../../src/lib/primary-agent-toolkit';
import { TooltipProvider } from '../ui/tooltip';

interface PrimaryAgentAssistantProviderProps {
  children: React.ReactNode;
  threadId: string;
  onThreadIdChange: (id: string) => void;
  getIntent: () => string | null;
  getTopicId?: () => string | null;
}

/**
 * Inner bridge: must live inside AssistantRuntimeProvider to call useAui.
 * Registers the primaryAgentToolkit renders on the active runtime.
 */
function PrimaryAgentToolkitBridge({ children }: { children: React.ReactNode }) {
  useAui({ tools: Tools({ toolkit: primaryAgentToolkit as any }) });
  return <>{children}</>;
}

export function PrimaryAgentAssistantProvider({
  children,
  threadId,
  onThreadIdChange,
  getIntent,
  getTopicId,
}: PrimaryAgentAssistantProviderProps) {
  // Ref keeps onThreadIdChange stable across renders without recreating the model adapter.
  const onThreadIdChangeRef = useRef(onThreadIdChange);
  onThreadIdChangeRef.current = onThreadIdChange;

  // Model adapter is stable — it reads threadId, intent hint, and topic locator via refs.
  const threadIdRef = useRef(threadId);
  threadIdRef.current = threadId;

  const getIntentRef = useRef(getIntent);
  getIntentRef.current = getIntent;

  const getTopicIdRef = useRef(getTopicId);
  getTopicIdRef.current = getTopicId;

  const modelAdapter = useMemo(
    () =>
      createPrimaryAgentModelAdapter({
        getThreadId: () => threadIdRef.current,
        onThreadIdResolved: (resolvedId) =>
          onThreadIdChangeRef.current(resolvedId),
        getIntent: () => getIntentRef.current(),
        getTopicId: () => getTopicIdRef.current?.() ?? null,
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
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        <PrimaryAgentToolkitBridge>{children}</PrimaryAgentToolkitBridge>
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
}
