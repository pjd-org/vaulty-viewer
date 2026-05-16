import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from '@/app/components/assistant-ui/attachment';
import { ToolFallback } from '@/app/components/assistant-ui/tool-fallback';
import { ChatToolSurface } from '@/app/components/chat-kit/ChatToolSurface';
import {
  ChatRuntimeStatus,
  chatStatusPillClass,
} from '@/app/components/chat-kit/ChatRuntimeStatus';
import {
  CHAT_ACCENTS,
  CHAT_ACCENT_TOKENS,
  CHAT_RUNTIME_STATE_ACCENTS,
  type ChatAccentColor,
  type ChatRuntimeState,
} from '@/app/components/chat-kit/accent';
import { GlassCard } from '@/app/components/ui/glass-card';
import { lazy, Suspense, type CSSProperties } from 'react';

// Lazy-load MarkdownText so unified/remark (ESM-only) are excluded from the SSR bundle
const MarkdownText = lazy(() =>
  import('@/app/components/assistant-ui/markdown-text').then((m) => ({
    default: m.MarkdownText,
  }))
);
import { TooltipIconButton } from '@/app/components/assistant-ui/tooltip-icon-button';
import { Button } from '@/app/components/ui/button';
import { Dock, DockIcon, DockLink } from '@vault/ui';
import { cn } from '@/src/lib/utils';
import { createContext, useContext } from 'react';
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
} from '@assistant-ui/react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  SquareIcon,
} from 'lucide-react';
import type { FC } from 'react';

export interface ThreadConfig {
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  welcomeDetail?: string;
  suggestions?: Array<{ title: string; description: string }>;
}

const ThreadConfigContext = createContext<ThreadConfig>({});

export const ThreadConfigProvider: FC<{
  config: ThreadConfig;
  children: React.ReactNode;
}> = ({ config, children }) => (
  <ThreadConfigContext.Provider value={config}>
    {children}
  </ThreadConfigContext.Provider>
);

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-[var(--surf-canvas)] text-[var(--text-primary)]"
      style={{
        ['--thread-max-width' as string]: '44rem',
        ['--composer-radius' as string]: '28px',
        ['--composer-padding' as string]: '12px',
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-5 pt-5"
      >
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <ThreadPrimitive.Messages>
          {() => <ThreadMessage />}
        </ThreadPrimitive.Messages>

        <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-4 overflow-visible rounded-t-[28px] bg-[color-mix(in_srgb,var(--surf-base)_86%,transparent)] pb-5 md:pb-6">
          <ThreadScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);
  if (isEditing) return <EditComposer />;
  if (role === 'user') return <UserMessage />;
  return <AssistantMessage />;
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-elevated)] p-4 shadow-sm disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  const {
    welcomeTitle = 'Execution interface for the vault system.',
    welcomeSubtitle = 'Ask about tasks, context, decisions, or anything else tracked here.',
    welcomeDetail = 'Select a workflow in the sidebar to pre-load context, or just type below.',
  } = useContext(ThreadConfigContext);
  return (
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-(--thread-max-width) flex-col gap-3">
      <div className="aui-thread-welcome-center flex w-full flex-col items-stretch py-2">
        <div className="aui-thread-welcome-message genie-surface genie-surface--hero flex w-full flex-col justify-center rounded-[32px] px-6 py-7 shadow-none">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            Primary Agent
          </p>
          <h1 className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both mt-2 text-[30px] font-semibold tracking-tight duration-200">
            {welcomeTitle}
          </h1>
          <p className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both mt-3 text-base leading-7 text-[var(--text-secondary)] delay-75 duration-200">
            {welcomeSubtitle}
          </p>
          <p className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both mt-1 text-sm leading-6 text-[var(--text-tertiary)] delay-100 duration-200">
            {welcomeDetail}
          </p>
        </div>
      </div>
      <div className="pt-1">
        <ThreadSuggestions />
      </div>
    </div>
  );
};

const VAULT_SUGGESTIONS = [
  {
    title: 'What should I work on next?',
    description: 'Get a prioritised next action based on current tasks',
  },
  {
    title: 'Summarise the project state.',
    description: 'High-level overview of progress and blockers',
  },
  {
    title: 'Which tasks are blocked right now?',
    description: 'List all tasks with unresolved blockers',
  },
  {
    title: 'What decisions have we made about the API?',
    description: 'Retrieve architecture and decision notes',
  },
];

const ThreadSuggestions: FC = () => {
  const { suggestions = VAULT_SUGGESTIONS } = useContext(ThreadConfigContext);
  return (
    <div className="aui-thread-welcome-suggestions grid w-full gap-3 px-4 pb-4 @md:grid-cols-2">
      {suggestions.map((s) => (
        <ThreadSuggestionItem
          key={s.title}
          title={s.title}
          description={s.description}
        />
      ))}
    </div>
  );
};

const ThreadSuggestionItem: FC<{ title: string; description: string }> = ({
  title,
  description,
}) => {
  const aui = useAui();
  return (
    <div className="aui-thread-welcome-suggestion-display fade-in slide-in-from-bottom-2 animate-in fill-mode-both duration-200">
      <Button
        unstyled
        className="aui-thread-welcome-suggestion genie-surface genie-surface--utility h-auto w-full flex-col items-start justify-start gap-1.5 rounded-[24px] border border-[var(--border-glass-soft)] bg-[var(--surf-elevated)] px-4 py-3 text-left text-sm text-[var(--text-primary)] shadow-md transition-colors hover:bg-[var(--surf-elevated)] hover:text-[var(--text-primary)]"
        onClick={() => {
          aui.thread().append({
            content: [{ type: 'text', text: title }],
            runConfig: aui.composer().getState().runConfig,
          });
          aui.composer().setText('');
        }}
      >
        <span className="aui-thread-welcome-suggestion-text-1 font-medium">
          {title}
        </span>
        <span className="aui-thread-welcome-suggestion-text-2 text-xs text-[var(--text-secondary)]">
          {description}
        </span>
      </Button>
    </div>
  );
};

type ComposerStyle = CSSProperties & { '--composer-accent'?: string };

const PALETTE_SWATCHES = CHAT_ACCENTS.map((name) => ({
  name,
  color: CHAT_ACCENT_TOKENS[name],
}));

const ComposerPaletteLegend: FC<{ activeAccent: ChatAccentColor }> = ({
  activeAccent,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PALETTE_SWATCHES.map((swatch) => (
        <span
          key={swatch.name}
          className={[
            chatStatusPillClass,
            'bg-[var(--surf-elevated)] gap-1.5 px-2.5 text-[var(--text-tertiary)] shadow-sm transition-[background-color,box-shadow,color,transform]',
            swatch.name === activeAccent
              ? 'scale-[1.02] text-[var(--text-primary)] shadow-md'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            borderColor:
              swatch.name === activeAccent
                ? `color-mix(in srgb, ${swatch.color} 42%, var(--border-glass-soft))`
                : 'var(--border-glass-soft)',
            background:
              swatch.name === activeAccent
                ? `linear-gradient(180deg, color-mix(in srgb, ${swatch.color} 14%, var(--surf-elevated)) 0%, var(--surf-elevated) 100%)`
                : 'var(--surf-elevated)',
          }}
        >
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{
              background: swatch.color,
              boxShadow:
                swatch.name === activeAccent
                  ? `0 0 0 4px color-mix(in srgb, ${swatch.color} 16%, transparent)`
                  : '0 0 0 3px color-mix(in srgb, var(--surf-elevated) 65%, transparent)',
            }}
          />
          {swatch.name}
        </span>
      ))}
    </div>
  );
};

const Composer: FC = () => {
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const statusState: ChatRuntimeState = isRunning ? 'running' : 'idle';
  const resolvedAccent: ChatAccentColor = isRunning
    ? CHAT_RUNTIME_STATE_ACCENTS['running']
    : 'sky';
  const accent = CHAT_ACCENT_TOKENS[resolvedAccent];
  const statusDetail = isRunning ? 'Generating response' : 'No active thread';

  return (
    <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
      <ComposerPrimitive.AttachmentDropzone asChild>
        <div
          data-slot="composer-shell"
          style={
            {
              '--composer-accent': accent,
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--composer-accent) 16%, var(--surf-elevated)) 0%, var(--surf-elevated) 36%, var(--surf-canvas) 100%)',
              border:
                '1px solid color-mix(in srgb, var(--composer-accent) 22%, rgba(255,255,255,0.9))',
              boxShadow:
                '0 18px 42px color-mix(in srgb, var(--composer-accent) 12%, rgba(17,21,29,0.12))',
            } as ComposerStyle
          }
          className="genie-surface genie-surface--overlay flex w-full flex-col items-stretch gap-2 rounded-[32px] px-3 py-3 transition-shadow data-[dragging=true]:border-dashed"
        >
          <ComposerAttachments />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <ChatRuntimeStatus
              state={statusState}
              detail={statusDetail}
              accentColor={resolvedAccent}
            />
            <ComposerPaletteLegend activeAccent={resolvedAccent} />
          </div>
          <ComposerPrimitive.Input
            placeholder="Send a message..."
            className="aui-composer-input min-h-14 max-h-14 w-full resize-none bg-transparent px-1 py-2 text-sm leading-6 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none"
            rows={1}
            autoFocus
            aria-label="Message input"
          />
          <ComposerAction />
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <div className="aui-composer-action-wrapper flex items-center justify-between gap-3">
      <ComposerAddAttachment />
      <Dock
        position="inline"
        className="border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-[3px] shadow-sm backdrop-blur-none"
      >
        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send asChild>
            <DockIcon
              icon={<ArrowUpIcon className="size-4" />}
              tone="sky"
              ariaLabel="Send message"
            />
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel asChild>
            <DockLink
              label="Stop"
              icon={<SquareIcon className="size-3 fill-current" />}
              tone="sun"
            />
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </Dock>
    </div>
  );
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root genie-surface genie-surface--danger mt-2 rounded-[20px] px-3 py-3 text-sm text-[var(--text-danger)]">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-4 duration-150"
      data-role="assistant"
    >
      <GlassCard
        glowEffect={false}
        className="aui-assistant-message-content wrap-break-word rounded-[24px] border border-[var(--border-glass-default)] bg-[var(--surf-elevated)] px-4 py-3.5 leading-6 text-[var(--text-primary)] shadow-md"
      >
        <MessagePrimitive.Parts>
          {({ part }) => {
            if (part.type === 'text')
              return (
                <Suspense fallback={null}>
                  <MarkdownText />
                </Suspense>
              );
            if (part.type === 'tool-call')
              return part.toolUI ?? <ChatToolSurface {...part} />;
            return null;
          }}
        </MessagePrimitive.Parts>
        <MessageError />
      </GlassCard>

      <div className="aui-assistant-message-footer mt-1 ml-2 flex min-h-6 items-center text-[var(--text-tertiary)]">
        <BranchPicker />
        <AssistantActionBar />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-[var(--text-tertiary)]"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger asChild>
          <TooltipIconButton
            tooltip="More"
            className="data-[state=open]:bg-[var(--surf-elevated)]"
          >
            <MoreHorizontalIcon />
          </TooltipIconButton>
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          className="aui-action-bar-more-content z-50 min-w-32 overflow-hidden rounded-[16px] border border-[var(--border-glass-soft)] bg-[var(--surf-elevated)] p-1 text-[var(--text-primary)] shadow-md"
        >
          <ActionBarPrimitive.ExportMarkdown asChild>
            <ActionBarMorePrimitive.Item className="aui-action-bar-more-item flex cursor-pointer select-none items-center gap-2 rounded-[12px] px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_28%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent hover:bg-[var(--surf-base)] focus:bg-[var(--surf-base)]">
              <DownloadIcon className="size-4" />
              Export as Markdown
            </ActionBarMorePrimitive.Item>
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-4 duration-150 [&:where(>*)]:col-start-2"
      data-role="user"
    >
      <UserMessageAttachments />

      <div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
        <div className="aui-user-message-content wrap-break-word peer rounded-[24px] bg-[var(--n-900)] px-4 py-3.5 text-[var(--n-0)] shadow-md empty:hidden">
          <MessagePrimitive.Parts />
        </div>
        <div className="aui-user-action-bar-wrapper absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2 peer-empty:hidden">
          <UserActionBar />
        </div>
      </div>

      <BranchPicker className="aui-user-branch-picker col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-end text-[var(--text-tertiary)]"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="aui-user-action-edit p-4">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-(--thread-max-width) flex-col px-2 py-4">
      <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col rounded-[24px] border border-[var(--border-glass-soft)] bg-[var(--surf-elevated)] shadow-md">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-4 text-sm text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_28%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-3 mb-3 flex items-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button
              unstyled
              className="rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] text-[var(--text-secondary)] hover:bg-[var(--surf-elevated)]"
            >
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button
              unstyled
              className="rounded-full bg-[var(--n-900)] text-[var(--n-0)] hover:bg-[var(--n-800)]"
            >
              Update
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        'aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-xs text-[var(--text-tertiary)]',
        className
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
