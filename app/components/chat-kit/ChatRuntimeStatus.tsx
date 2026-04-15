import { Badge } from '@/app/components/ui/badge';
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
  const tone =
    state === 'running'
      ? 'secondary'
      : state === 'degraded'
        ? 'outline'
        : state === 'error'
          ? 'destructive'
          : 'default';

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <Badge variant={tone as never} className="uppercase tracking-[0.16em]">
        {state}
      </Badge>
      {detail && <span className="text-[var(--text-secondary)]">{detail}</span>}
    </div>
  );
}
