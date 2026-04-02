/**
 * HueyAssistantProvider — scoped @assistant-ui/react runtime wrapper.
 *
 * SCOPE INVARIANT: This file is the only entry point for @assistant-ui/react
 * in the viewer. It must NOT be imported from any route other than /huey.
 *
 * Usage:
 *   <HueyAssistantProvider>
 *     <YourChatUI />
 *   </HueyAssistantProvider>
 */
import React from 'react';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from '@assistant-ui/react';

// ---------------------------------------------------------------------------
// No-op adapter — chat is handled by the existing Huey agent server.
// This provider exists to unlock assistant-ui hooks/primitives when needed,
// without forcing a full runtime migration on the existing message loop.
// ---------------------------------------------------------------------------
const NoOpAdapter: ChatModelAdapter = {
  async run({ messages, abortSignal: _abortSignal }) {
    // The real message submission goes through apiFetch in the Huey route.
    // This adapter is a stub so the runtime context is available.
    void messages;
    return { content: [{ type: 'text', text: '' }] };
  },
};

interface HueyAssistantProviderProps {
  children: React.ReactNode;
}

export function HueyAssistantProvider({
  children,
}: HueyAssistantProviderProps) {
  const runtime = useLocalRuntime(NoOpAdapter);
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
