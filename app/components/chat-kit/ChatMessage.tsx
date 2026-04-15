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
        'flex w-full flex-col gap-3 py-4',
        isUser ? 'items-end' : 'items-start',
        className
      )}
    >
      <div
        className={cn(
          'max-w-[min(46rem,100%)] rounded-[24px] px-4 py-3.5 text-sm leading-6',
          isUser
            ? 'bg-[var(--n-900)] text-[var(--n-0)] shadow-[0_10px_24px_rgba(17,21,29,0.16)]'
            : 'border border-[var(--border-glass-default)] bg-[rgba(255,255,255,0.9)] text-[var(--text-primary)] shadow-[0_10px_24px_rgba(17,21,29,0.08)]'
        )}
      >
        {content}
      </div>
      {toolSurface && <div className="w-full max-w-[min(46rem,100%)]">{toolSurface}</div>}
    </article>
  );
}
