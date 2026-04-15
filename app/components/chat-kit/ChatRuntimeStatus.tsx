import { cn } from '@/src/lib/utils';

export interface ChatRuntimeStatusProps {
  state: 'idle' | 'running' | 'degraded' | 'error';
  detail?: string;
  className?: string;
}

export function ChatRuntimeStatus({
  state,
  detail,
  className,
}: ChatRuntimeStatusProps) {
  const toneClass =
    state === 'running'
      ? 'border-[color-mix(in_srgb,var(--a-sky)_36%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_16%,white)] text-[var(--text-info)]'
      : state === 'degraded'
        ? 'border-[color-mix(in_srgb,var(--a-sun)_32%,transparent)] bg-[color-mix(in_srgb,var(--a-sun)_18%,white)] text-[var(--text-warning)]'
          : state === 'error'
          ? 'border-[color-mix(in_srgb,var(--s-danger)_32%,transparent)] bg-[color-mix(in_srgb,var(--s-danger)_14%,white)] text-[var(--text-danger)]'
          : 'border-[var(--border-glass-soft)] bg-[var(--surf-base)] text-[var(--text-secondary)]';

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
          toneClass
        )}
      >
        {state}
      </span>
      {detail && <span className="text-[var(--text-secondary)]">{detail}</span>}
    </div>
  );
}
