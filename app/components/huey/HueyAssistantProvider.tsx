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
 * When threadId changes the runtime thread is reset (history cleared), matching
 * the existing behaviour where thread history is sidebar-only, not restored.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react';
import { createHueyModelAdapter } from '../../../src/lib/huey-adapter';

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
  // Refs keep the adapter stable (never recreated) while always reading fresh values.
  const threadIdRef = useRef(threadId);
  const onThreadIdChangeRef = useRef(onThreadIdChange);

  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);

  useEffect(() => {
    onThreadIdChangeRef.current = onThreadIdChange;
  }, [onThreadIdChange]);

  const adapter = useMemo(
    () =>
      createHueyModelAdapter({
        getThreadId: () => threadIdRef.current,
        onThreadIdResolved: (resolvedId) =>
          onThreadIdChangeRef.current(resolvedId),
      }),
    [] // stable — refs handle mutability
  );

  const runtime = useLocalRuntime(adapter);

  // When the thread switches, clear the runtime message history.
  useEffect(() => {
    runtime.thread.reset();
  }, [threadId, runtime.thread]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
