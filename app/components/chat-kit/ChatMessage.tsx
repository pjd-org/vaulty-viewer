import type { ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: ReactNode;
  toolSurface?: ReactNode;
  className?: string;
}

export function ChatMessage({
  role,
  content,
  toolSurface,
  className,
}: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <article
      className={cn(
        'flex w-full flex-col gap-3 py-3',
        isUser ? 'items-end' : 'items-start',
        className
      )}
    >
      <div
        className={cn(
          'max-w-[min(42rem,100%)] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-muted text-foreground'
            : 'border border-[var(--border-glass)] bg-[var(--surf-glass)] text-[var(--text-primary)]'
        )}
      >
        {content}
      </div>
      {toolSurface && <div className="w-full max-w-[min(42rem,100%)]">{toolSurface}</div>}
    </article>
  );
}
