import { Button } from '@vault/ui';
import { Skeleton } from '@/app/components/ui/skeleton';
import {
  AuiIf,
  ThreadListItemMorePrimitive,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from '@assistant-ui/react';
import {
  ArchiveIcon,
  MoreHorizontalIcon,
  PlusIcon,
  TrashIcon,
} from 'lucide-react';
import type { FC } from 'react';

export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="aui-root aui-thread-list-root genie-surface genie-surface--utility flex flex-col gap-2 rounded-[24px] border border-[var(--border-glass-soft)] bg-[rgba(255,255,255,0.88)] p-3 shadow-[0_10px_24px_rgba(17,21,29,0.08)]">
      <ThreadListNew />
      <AuiIf condition={(s) => s.threads.isLoading}>
        <ThreadListSkeleton />
      </AuiIf>
      <AuiIf condition={(s) => !s.threads.isLoading}>
        <ThreadListPrimitive.Items>
          {() => <ThreadListItem />}
        </ThreadListPrimitive.Items>
      </AuiIf>
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <Button
        unstyled
        className="aui-thread-list-new h-10 justify-start gap-2 rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] px-4 text-sm text-[var(--text-primary)] shadow-none hover:bg-white data-active:bg-white"
      >
        <PlusIcon className="size-4" />
        New Thread
      </Button>
    </ThreadListPrimitive.New>
  );
};

const ThreadListSkeleton: FC = () => {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          role="status"
          aria-label="Loading threads"
          className="aui-thread-list-skeleton-wrapper flex h-10 items-center px-3"
        >
          <Skeleton className="aui-thread-list-skeleton h-4 w-full" />
        </div>
      ))}
    </div>
  );
};

const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root className="aui-thread-list-item group flex h-10 items-center gap-2 rounded-[18px] transition-colors hover:bg-white focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_24%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent data-active:bg-white">
      <ThreadListItemPrimitive.Trigger className="aui-thread-list-item-trigger flex h-full min-w-0 flex-1 items-center px-3 text-start text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_24%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
        <span className="aui-thread-list-item-title min-w-0 flex-1 truncate font-medium">
          <ThreadListItemPrimitive.Title fallback="New Chat" />
        </span>
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemMore />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemMore: FC = () => {
  return (
    <ThreadListItemMorePrimitive.Root>
      <ThreadListItemMorePrimitive.Trigger asChild>
        <Button
          unstyled
          className="aui-thread-list-item-more mr-2 size-7 rounded-full border border-[var(--border-glass-soft)] bg-[var(--surf-base)] p-0 opacity-0 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_24%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent group-hover:opacity-100 data-[state=open]:bg-white data-[state=open]:opacity-100 group-data-active:opacity-100"
        >
          <MoreHorizontalIcon className="size-4" />
          <span className="sr-only">More options</span>
        </Button>
      </ThreadListItemMorePrimitive.Trigger>
      <ThreadListItemMorePrimitive.Content
        side="bottom"
        align="start"
        className="aui-thread-list-item-more-content z-50 min-w-32 overflow-hidden rounded-[16px] border border-[var(--border-glass-soft)] bg-[rgba(255,255,255,0.94)] p-1 text-[var(--text-primary)] shadow-[0_10px_24px_rgba(17,21,29,0.12)]"
      >
        <ThreadListItemPrimitive.Archive asChild>
          <ThreadListItemMorePrimitive.Item className="aui-thread-list-item-more-item flex cursor-pointer select-none items-center gap-2 rounded-[12px] px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-sky)_24%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent hover:bg-[var(--surf-base)] focus:bg-[var(--surf-base)]">
            <ArchiveIcon className="size-4" />
            Archive
          </ThreadListItemMorePrimitive.Item>
        </ThreadListItemPrimitive.Archive>
        <ThreadListItemPrimitive.Delete asChild>
          <ThreadListItemMorePrimitive.Item className="aui-thread-list-item-more-item flex cursor-pointer select-none items-center gap-2 rounded-[12px] px-2 py-1.5 text-sm text-[var(--text-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--a-rose)_30%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent hover:bg-[color-mix(in_srgb,var(--s-danger)_12%,white)] hover:text-[var(--text-danger)] focus:bg-[color-mix(in_srgb,var(--s-danger)_12%,white)] focus:text-[var(--text-danger)]">
            <TrashIcon className="size-4" />
            Delete
          </ThreadListItemMorePrimitive.Item>
        </ThreadListItemPrimitive.Delete>
      </ThreadListItemMorePrimitive.Content>
    </ThreadListItemMorePrimitive.Root>
  );
};
