import type { ReactNode } from 'react';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/src/lib/utils';

export interface ChatEmptyStateProps {
  title: string;
  subtitle?: string;
  suggestions?: Array<{ title: string; description: string }>;
  onSuggestionClick?: (title: string) => void;
  className?: string;
}

export function ChatEmptyState({
  title,
  subtitle,
  suggestions = [],
  onSuggestionClick,
  className,
}: ChatEmptyStateProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-(--thread-max-width) grow flex-col justify-center px-4 py-10',
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        {subtitle && (
          <p className="max-w-xl text-sm text-[var(--text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-6 grid gap-2 md:grid-cols-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.title}
              type="button"
              variant="ghost"
              className="h-auto flex-col items-start justify-start gap-1 rounded-3xl border border-[var(--border-glass)] bg-[var(--surf-glass)] px-4 py-3 text-left hover:bg-[var(--surf-glass)]"
              onClick={() => onSuggestionClick?.(suggestion.title)}
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {suggestion.title}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {suggestion.description}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
