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
  const statusTone =
    state === 'running'
      ? {
          badge:
            'border-[color-mix(in_srgb,var(--a-sky)_36%,transparent)] bg-[color-mix(in_srgb,var(--a-sky)_16%,white)] text-[var(--text-info)]',
          dot: 'bg-[var(--a-sky)]',
          label: 'RUNNING',
        }
      : state === 'degraded'
        ? {
            badge:
              'border-[color-mix(in_srgb,var(--a-sun)_32%,transparent)] bg-[color-mix(in_srgb,var(--a-sun)_18%,white)] text-[var(--text-warning)]',
            dot: 'bg-[var(--a-sun)]',
            label: 'DEGRADED',
          }
        : state === 'error'
          ? {
              badge:
                'border-[color-mix(in_srgb,var(--a-rose)_32%,transparent)] bg-[color-mix(in_srgb,var(--a-rose)_14%,white)] text-[var(--text-danger)]',
              dot: 'bg-[var(--a-rose)]',
              label: 'ERROR',
            }
          : {
              badge:
                'border-[color-mix(in_srgb,var(--a-lilac)_28%,transparent)] bg-[color-mix(in_srgb,var(--a-lilac)_14%,white)] text-[var(--text-secondary)]',
              dot: 'bg-[var(--a-lilac)]',
              label: 'IDLE',
            };

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
          statusTone.badge
        )}
      >
        <span
          aria-hidden="true"
          className={cn('size-2 rounded-full', statusTone.dot)}
        />
        {statusTone.label}
      </span>
      {detail && <span className="text-[var(--text-secondary)]">{detail}</span>}
    </div>
  );
}
