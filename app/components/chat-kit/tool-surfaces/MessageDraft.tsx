import { Badge } from '@/app/components/ui/badge';
import { CardHeader } from '@vault/ui';
import { Card } from '@/app/components/ui/card';

export function MessageDraft({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <Card className="genie-surface genie-surface--utility overflow-hidden rounded-[24px]">
      <CardHeader label={title} subtitle={body} className="px-4 pb-2 pt-4" />
      <div className="flex items-center gap-2 px-4 pb-4 pt-0">
        <Badge
          variant="muted"
          className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]"
        >
          Draft
        </Badge>
        <span className="text-xs text-[var(--text-secondary)]">
          Ready for review before send
        </span>
      </div>
    </Card>
  );
}
