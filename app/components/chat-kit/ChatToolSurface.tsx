import type { ComponentProps } from 'react';
import { cn } from '@/src/lib/utils';
import { GlassCard } from '@/app/components/ui/glass-card';
import { ApprovalCard, MessageDraft } from './tool-surfaces';
import { PrimaryAgentToolInvocation } from '@/src/components/tool-ui/primary-agent-tool-invocation';
import { Plan } from '@/src/components/tool-ui/plan';
import { safeParseSerializablePlan } from '@/src/components/tool-ui/plan/schema';
import { ProgressTracker } from '@/src/components/tool-ui/progress-tracker';
import { safeParseSerializableProgressTracker } from '@/src/components/tool-ui/progress-tracker/schema';
import { StatsDisplay } from '@/src/components/tool-ui/stats-display';
import { safeParseSerializableStatsDisplay } from '@/src/components/tool-ui/stats-display/schema';

type ToolStatus = ComponentProps<typeof PrimaryAgentToolInvocation>['status'];

const toolSurfaceWrapClass =
  'w-full p-3 bg-[var(--surf-glass)] border border-[var(--border-glass-default)] shadow-sm backdrop-blur-[var(--blur-lg)] rounded-[24px]';

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
        <GlassCard
          glowEffect={false}
          className={cn(toolSurfaceWrapClass, className)}
        >
          <Plan {...plan} />
        </GlassCard>
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
        <GlassCard
          glowEffect={false}
          className={cn(toolSurfaceWrapClass, className)}
        >
          <ProgressTracker {...tracker} />
        </GlassCard>
      );
    }
  }

  if (normalizedName === 'show-stats' || normalizedName === 'stats-display') {
    const stats = safeParseSerializableStatsDisplay(result);
    if (stats) {
      return (
        <GlassCard
          glowEffect={false}
          className={cn(toolSurfaceWrapClass, className)}
        >
          <StatsDisplay {...stats} />
        </GlassCard>
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

export { ApprovalCard, MessageDraft } from './tool-surfaces';
