import { Badge } from '@/app/components/ui/badge';
import { CardHeader, GlassSurface } from '@vault/ui';
import { Card } from '@/app/components/ui/card';

export function MessageDraft({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <Card className="overflow-hidden bg-[var(--surf-glass)] border border-[var(--border-glass-default)] shadow-sm backdrop-blur-[var(--blur-lg)] rounded-[24px]">
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
