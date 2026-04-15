'use client';

import { memo } from 'react';
import {
  AlertCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  LoaderIcon,
  XCircleIcon,
} from 'lucide-react';
import {
  useScrollLock,
  type ToolCallMessagePartComponent,
  type ToolCallMessagePartStatus,
} from '@assistant-ui/react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible';
import { cn } from '@/src/lib/utils';
import {
  parseWidget,
  WidgetRenderer,
} from '@/src/components/tool-ui/widget-renderer';
import { useCallback, useRef, useState } from 'react';

const ANIMATION_DURATION = 200;

type ToolStatus = ToolCallMessagePartStatus['type'];

const statusIconMap: Record<ToolStatus, React.ElementType> = {
  running: LoaderIcon,
  complete: CheckIcon,
  incomplete: XCircleIcon,
  'requires-action': AlertCircleIcon,
};

// ---------------------------------------------------------------------------
// PrimaryAgentToolInvocation
// ---------------------------------------------------------------------------

const PrimaryAgentToolInvocationImpl: ToolCallMessagePartComponent = ({
  toolName,
  argsText,
  result,
  status,
}) => {
  const collapsibleRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const lockScroll = useScrollLock(collapsibleRef, ANIMATION_DURATION);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) lockScroll();
      setIsOpen(open);
    },
    [lockScroll]
  );

  const statusType = status?.type ?? 'complete';
  const isRunning = statusType === 'running';
  const isCancelled =
    status?.type === 'incomplete' && status.reason === 'cancelled';
  const isError =
    status?.type === 'incomplete' && status.reason !== 'cancelled';

  const Icon = statusIconMap[statusType];
  const label = isCancelled ? 'Cancelled tool' : 'Used tool';

  // Try to parse result as a Widget
  const widget = status?.type === 'complete' ? parseWidget(result) : null;

  return (
    <Collapsible
      ref={collapsibleRef}
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={cn(
        'primary-agent-tool-invocation w-full rounded-lg border py-3',
        'group/tool-invocation',
        isCancelled && 'border-muted-foreground/30 bg-muted/30'
      )}
      style={
        {
          '--animation-duration': `${ANIMATION_DURATION}ms`,
        } as React.CSSProperties
      }
    >
      {/* ---- Trigger ---- */}
      <CollapsibleTrigger className="group/trigger flex w-full items-center gap-2 px-4 text-sm transition-colors">
        <Icon
          className={cn(
            'size-4 shrink-0',
            isCancelled && 'text-muted-foreground',
            isRunning && 'animate-spin',
            isError && 'text-destructive'
          )}
        />
        <span
          className={cn(
            'relative inline-block grow text-left leading-none',
            isCancelled && 'text-muted-foreground line-through'
          )}
        >
          <span>
            {label}: <b>{toolName}</b>
          </span>
          {isRunning && (
            <span
              aria-hidden
              className="shimmer pointer-events-none absolute inset-0 motion-reduce:animate-none"
            >
              {label}: <b>{toolName}</b>
            </span>
          )}
        </span>
        <ChevronDownIcon
          className={cn(
            'size-4 shrink-0',
            'transition-transform duration-(--animation-duration) ease-out',
            'group-data-[state=closed]/trigger:-rotate-90',
            'group-data-[state=open]/trigger:rotate-0'
          )}
        />
      </CollapsibleTrigger>

      {/* ---- Collapsible content ---- */}
      <CollapsibleContent
        className={cn(
          'relative overflow-hidden text-sm outline-none',
          'ease-out',
          'data-[state=closed]:animate-collapsible-up',
          'data-[state=open]:animate-collapsible-down',
          'data-[state=closed]:fill-mode-forwards',
          'data-[state=closed]:pointer-events-none',
          'data-[state=open]:duration-(--animation-duration)',
          'data-[state=closed]:duration-(--animation-duration)'
        )}
      >
        <div className="mt-3 flex flex-col gap-2 border-t pt-2">
          {/* Error / cancel reason */}
          {status?.type === 'incomplete' &&
            (() => {
              const error = status.error;
              const errorText = error
                ? typeof error === 'string'
                  ? error
                  : JSON.stringify(error)
                : null;
              if (!errorText) return null;
              return (
                <div className="px-4">
                  <p className="font-semibold text-muted-foreground">
                    {isCancelled ? 'Cancelled reason:' : 'Error:'}
                  </p>
                  <p className="text-muted-foreground">{errorText}</p>
                </div>
              );
            })()}

          {/* Args */}
          {argsText && (
            <div className={cn('px-4', isCancelled && 'opacity-60')}>
              <pre className="whitespace-pre-wrap">{argsText}</pre>
            </div>
          )}

          {/* Result — widget or raw */}
          {!isCancelled && result !== undefined && (
            <div className="border-t border-dashed px-4 pt-2">
              {widget ? (
                <WidgetRenderer widget={widget} disabled />
              ) : (
                <>
                  <p className="font-semibold">Result:</p>
                  <pre className="whitespace-pre-wrap">
                    {typeof result === 'string'
                      ? result
                      : JSON.stringify(result, null, 2)}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const PrimaryAgentToolInvocation = memo(
  PrimaryAgentToolInvocationImpl
) as unknown as ToolCallMessagePartComponent;

PrimaryAgentToolInvocation.displayName = 'PrimaryAgentToolInvocation';
