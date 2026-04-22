import React, { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
import { RouteLoadingState } from '../components/ui';
import { archiveSearchParams } from '../../src/lib/routes/search-params';
import {
  useArchiveSurface,
  type ArchiveSurfacePayload,
  type InboxItem,
} from '../lib/viewer-adapter';

export const Route = createFileRoute('/archive')({
  validateSearch: archiveSearchParams,
  component: ArchiveRoute,
});

// ---------------------------------------------------------------------------
// ArchiveItemDetail — aside panel
// ---------------------------------------------------------------------------

function ArchiveItemDetail({ item }: { item: InboxItem }) {
  const bucketLabel: Record<string, string> = {
    rejected_user: 'Rejected by user',
    rejected_automated: 'Rejected automatically',
    deferred: 'Deferred',
  };

  const severityColor: Record<string, string> = {
    critical: 'text-destructive',
    high: 'text-warning',
    medium: 'text-warning',
    low: 'text-muted-foreground',
  };

  return (
    <div className="flex flex-col gap-4 text-sm" data-testid="archive-item-detail">
      <div>
        <p className="font-medium leading-snug text-foreground">{item.title}</p>
        {item.summary && (
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
            {item.summary}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {bucketLabel[item.inboxBucket] ?? item.inboxBucket}
        </span>
        <span
          className={`rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium ${severityColor[item.severity] ?? 'text-muted-foreground'}`}
        >
          {item.severity}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Why archived:</span>{' '}
          {item.whySurfaced}
        </p>
        {item.rejectionReason && (
          <p>
            <span className="font-medium text-foreground">Reason:</span>{' '}
            {item.rejectionReason}
          </p>
        )}
        {item.confidence !== undefined && (
          <p>
            <span className="font-medium text-foreground">Confidence:</span>{' '}
            {(item.confidence * 100).toFixed(0)}%
          </p>
        )}
      </div>

      {item.allowedActions.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Available actions
          </p>
          <ul className="flex flex-col gap-1">
            {item.allowedActions.map((action) => (
              <li
                key={action.actionType}
                className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                {action.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ArchiveSection
// ---------------------------------------------------------------------------

function ArchiveSection({
  testId,
  label,
  items,
  selectedId,
  onSelect,
}: {
  testId: string;
  label: string;
  items: InboxItem[];
  selectedId: string | null;
  onSelect: (item: InboxItem) => void;
}) {
  return (
    <div data-testid={testId} className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {label}
        <span className="ml-2 text-xs font-normal text-muted-foreground/60">
          ({items.length})
        </span>
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">None.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={[
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                  selectedId === item.id
                    ? 'bg-muted text-foreground'
                    : 'hover:bg-muted/60 text-muted-foreground',
                ].join(' ')}
              >
                <span className="font-mono text-xs text-muted-foreground shrink-0">
                  ▸
                </span>
                <span className="truncate">{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ArchiveList
// ---------------------------------------------------------------------------

function ArchiveList({
  data,
  selectedId,
  onSelect,
}: {
  data: ArchiveSurfacePayload;
  selectedId: string | null;
  onSelect: (item: InboxItem) => void;
}) {
  return (
    <div data-testid="archive-list" className="flex flex-col gap-6">
      <ArchiveSection
        testId="archive-user-rejected-section"
        label="Rejected by user"
        items={data.rejectedUser}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <ArchiveSection
        testId="archive-automated-rejected-section"
        label="Rejected automatically"
        items={data.rejectedAutomated}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <ArchiveSection
        testId="archive-deferred-section"
        label="Deferred"
        items={data.deferred}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ArchiveRoute
// ---------------------------------------------------------------------------

function ArchiveRoute() {
  const { data, isLoading } = useArchiveSurface();
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);

  // Clear selection if the selected item is no longer present after a data refresh
  useEffect(() => {
    if (!selectedItem || !data) return;
    const allItems = [
      ...data.rejectedUser,
      ...data.rejectedAutomated,
      ...data.deferred,
    ];
    const stillExists = allItems.some((i) => i.id === selectedItem.id);
    if (!stillExists) setSelectedItem(null);
  }, [data, selectedItem]);

  return (
    <WorkspaceScaffold
      title="Archive"
      subtitle="Historical decisions, rejected artifacts, and completed operational context."
      summaryItems={[
        {
          label: 'Total',
          value: data ? String(data.total) : '—',
          detail: 'Archived items',
        },
        {
          label: 'Rejected (user)',
          value: data ? String(data.rejectedUser.length) : '—',
          detail: 'User-rejected runs',
        },
        {
          label: 'Rejected (auto)',
          value: data ? String(data.rejectedAutomated.length) : '—',
          detail: 'Automated rejections',
        },
        {
          label: 'Deferred',
          value: data ? String(data.deferred.length) : '—',
          detail: 'Deferred items',
        },
      ]}
      primaryTitle="Archive"
      primarySubtitle="Rejected and deferred inbox items."
      primary={
        isLoading ? (
          <RouteLoadingState label="Loading archive queues..." />
        ) : data == null || data.total === 0 ? (
          <div data-testid="archive-empty-state" className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              Archive is empty.
            </p>
            <p className="text-xs text-muted-foreground">
              Items will appear here once runs are rejected or deferred.
            </p>
          </div>
        ) : (
          <ArchiveList
            data={data}
            selectedId={selectedItem?.id ?? null}
            onSelect={setSelectedItem}
          />
        )
      }
    />
  );
}
