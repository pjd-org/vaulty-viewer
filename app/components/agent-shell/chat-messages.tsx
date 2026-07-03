'use client';

/**
 * agent-shell/chat-messages.tsx
 *
 * Scrollable message list.
 * Auto-scrolls to bottom while running; snaps to bottom on new messages.
 */

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { MessageBubble } from './message-bubble';
import type { ChatMessage, RunStatus } from '../../lib/agent-shell/types';

export type ChatMessagesProps = {
  messages: ChatMessage[];
  status: RunStatus;
  className?: string;
};

export function ChatMessages({
  messages,
  status,
  className,
}: ChatMessagesProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change while running or just finished
  React.useEffect(() => {
    if (status === 'running' || status === 'done') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, status]);

  if (messages.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-1 items-center justify-center',
          'text-sm text-white/30 select-none',
          className
        )}
        aria-label="No messages yet"
      >
        {status === 'idle' ? 'Send a message to start.' : 'Waiting…'}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="log"
      aria-label="Agent conversation"
      aria-live="polite"
      className={cn(
        'flex flex-col flex-1 overflow-y-auto',
        'px-4 py-4 gap-3',
        // Thin scrollbar
        'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20',
        className
      )}
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
