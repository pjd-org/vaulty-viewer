'use client';

/**
 * agent-shell/message-bubble.tsx
 *
 * Renders a single ChatMessage.
 * - User messages: right-aligned, glass surface
 * - Assistant messages: left-aligned, with optional nodeId badge for non-huey
 * - Streaming: pulsing cursor appended while streaming === true
 */

import * as React from 'react';
import { cn } from '@/src/lib/utils';
import type { ChatMessage } from '../../lib/agent-shell/types';

export type MessageBubbleProps = {
  message: ChatMessage;
  className?: string;
};

export function MessageBubble({ message, className }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const showNodeBadge = !isUser && message.nodeId && message.nodeId !== 'huey';

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={cn(
          'relative max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
          'transition-opacity duration-200',
          isUser
            ? ['bg-white/15 border border-white/20 text-white', 'rounded-br-sm']
            : [
                'bg-white/5 border border-white/10 text-white/90',
                'rounded-bl-sm',
              ]
        )}
      >
        {/* Node badge for specialist / cabinet messages */}
        {showNodeBadge && (
          <span className="block mb-1.5 text-[10px] font-mono text-white/40 uppercase tracking-wider">
            {message.nodeId}
          </span>
        )}

        {/* Message content */}
        <span className="whitespace-pre-wrap break-words">
          {message.content}
          {message.streaming && (
            <span
              aria-hidden="true"
              className="inline-block w-[2px] h-[1em] ml-0.5 bg-white/60 align-middle animate-pulse"
            />
          )}
        </span>
      </div>
    </div>
  );
}
