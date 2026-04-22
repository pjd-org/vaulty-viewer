import { Button, Card, CardHeader } from '@vault/ui';

export function ApprovalCard({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card
      padding={false}
      className="genie-surface genie-surface--utility overflow-hidden rounded-[24px]"
    >
      <CardHeader
        label={title}
        subtitle={description}
        className="px-4 pb-2 pt-4"
      />
      <div className="flex items-center gap-2 px-4 pb-4 pt-0">
        <Button
          type="button"
          unstyled
          className="rounded-full bg-[var(--n-900)] px-4 py-2 text-sm text-[var(--n-0)] hover:bg-[var(--n-800)]"
        >
          Approve
        </Button>
        <Button
          type="button"
          unstyled
          className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surf-elevated)]"
        >
          Review
        </Button>
      </div>
    </Card>
  );
}
