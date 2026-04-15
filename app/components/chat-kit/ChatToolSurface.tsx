import type { ComponentProps } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { cn } from '@/src/lib/utils';
import {
  PrimaryAgentToolInvocation,
} from '@/src/components/tool-ui/primary-agent-tool-invocation';
import { Plan } from '@/src/components/tool-ui/plan';
import { safeParseSerializablePlan } from '@/src/components/tool-ui/plan/schema';
import {
  ProgressTracker,
} from '@/src/components/tool-ui/progress-tracker';
import {
  safeParseSerializableProgressTracker,
} from '@/src/components/tool-ui/progress-tracker/schema';
import { StatsDisplay } from '@/src/components/tool-ui/stats-display';
import { safeParseSerializableStatsDisplay } from '@/src/components/tool-ui/stats-display/schema';

type ToolStatus = ComponentProps<typeof PrimaryAgentToolInvocation>['status'];

export interface ChatToolSurfaceProps {
  toolName: string;
  argsText?: string;
  result?: unknown;
  status?: ToolStatus;
  className?: string;
}

function normalizeToolName(toolName: string): string {
  return toolName.trim().toLowerCase().replace(/_/g, '-');
}

function ApprovalCard({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="border-[var(--border-glass)] bg-[var(--surf-glass)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {description && (
          <p className="text-sm text-[var(--text-secondary)]">{description}</p>
        )}
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <Button type="button" size="sm">
          Approve
        </Button>
        <Button type="button" size="sm" variant="secondary">
          Review
        </Button>
      </CardContent>
    </Card>
  );
}

function MessageDraft({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <Card className="border-[var(--border-glass)] bg-[var(--surf-glass)]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-sm">{title}</CardTitle>
        {body && <p className="text-sm text-[var(--text-secondary)]">{body}</p>}
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <Badge variant="secondary">Draft</Badge>
        <span className="text-xs text-[var(--text-secondary)]">
          Ready for review before send
        </span>
      </CardContent>
    </Card>
  );
}

export function ChatToolSurface({
  toolName,
  argsText,
  result,
  status,
  className,
}: ChatToolSurfaceProps) {
  const normalizedName = normalizeToolName(toolName);

  if (normalizedName === 'show-plan' || normalizedName === 'plan') {
    const plan = safeParseSerializablePlan(result);
    if (plan) {
      return (
        <div className={cn('w-full', className)}>
          <Plan {...plan} />
        </div>
      );
    }
  }

  if (
    normalizedName === 'show-progress' ||
    normalizedName === 'progress-tracker' ||
    normalizedName === 'progress'
  ) {
    const tracker = safeParseSerializableProgressTracker(result);
    if (tracker) {
      return (
        <div className={cn('w-full', className)}>
          <ProgressTracker {...tracker} />
        </div>
      );
    }
  }

  if (normalizedName === 'show-stats' || normalizedName === 'stats-display') {
    const stats = safeParseSerializableStatsDisplay(result);
    if (stats) {
      return (
        <div className={cn('w-full', className)}>
          <StatsDisplay {...stats} />
        </div>
      );
    }
  }

  if (normalizedName === 'approval-card' || normalizedName === 'approval') {
    const title =
      typeof result === 'object' && result && 'title' in result
        ? String((result as Record<string, unknown>).title)
        : toolName;
    const description =
      typeof result === 'object' && result && 'description' in result
        ? String((result as Record<string, unknown>).description)
        : undefined;
    return (
      <div className={cn('w-full', className)}>
        <ApprovalCard title={title} description={description} />
      </div>
    );
  }

  if (normalizedName === 'message-draft' || normalizedName === 'draft') {
    const title =
      typeof result === 'object' && result && 'title' in result
        ? String((result as Record<string, unknown>).title)
        : 'Message draft';
    const body =
      typeof result === 'object' && result && 'body' in result
        ? String((result as Record<string, unknown>).body)
        : undefined;
    return (
      <div className={cn('w-full', className)}>
        <MessageDraft title={title} body={body} />
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <PrimaryAgentToolInvocation
        {...({
          toolName,
          argsText,
          result,
          status,
        } as any)}
      />
    </div>
  );
}

export { ApprovalCard, MessageDraft };
