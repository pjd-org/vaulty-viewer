import { Button } from '@vault/ui';
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
        'mx-auto flex w-full max-w-(--thread-max-width) flex-col px-4 py-10',
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
          Primary Agent
        </p>
        <h2 className="text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">
          {title}
        </h2>
        {subtitle && (
          <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.title}
              type="button"
              unstyled
              className="genie-surface genie-surface--utility h-auto flex-col items-start justify-start gap-1 rounded-[24px] border-[var(--border-glass-soft)] bg-[var(--surf-elevated)] px-4 py-3 text-left shadow-md hover:bg-[var(--surf-elevated)]"
              onClick={() => onSuggestionClick?.(suggestion.title)}
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {suggestion.title}
              </span>
              <span className="text-xs leading-5 text-[var(--text-secondary)]">
                {suggestion.description}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
