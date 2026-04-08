import React, { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { WorkspaceScaffold } from '../components/layout';
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
    critical: 'text-red-700',
    high: 'text-orange-700',
    medium: 'text-yellow-700',
    low: 'text-slate-500',
  };

  return (
    <div className="space-y-4 text-sm" data-testid="archive-item-detail">
      <div>
        <p className="font-medium leading-snug text-slate-800">{item.title}</p>
        {item.summary && (
          <p className="mt-1 text-xs text-slate-500 font-mono break-all">
            {item.summary}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-slate-600">
          {bucketLabel[item.inboxBucket] ?? item.inboxBucket}
        </span>
        <span
          className={`rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium ${severityColor[item.severity] ?? 'text-slate-500'}`}
        >
          {item.severity}
        </span>
      </div>

      <div className="space-y-1 text-xs text-slate-600">
        <p>
          <span className="font-medium text-slate-700">Why archived:</span>{' '}
          {item.whySurfaced}
        </p>
        {item.rejectionReason && (
          <p>
            <span className="font-medium text-slate-700">Reason:</span>{' '}
            {item.rejectionReason}
          </p>
        )}
        {item.confidence !== undefined && (
          <p>
            <span className="font-medium text-slate-700">Confidence:</span>{' '}
            {(item.confidence * 100).toFixed(0)}%
          </p>
        )}
      </div>

      {item.allowedActions.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
            Available actions
          </p>
          <ul className="space-y-1">
            {item.allowedActions.map((action) => (
              <li
                key={action.actionType}
                className="text-xs text-slate-600 bg-black/5 rounded-md px-2 py-1"
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
    <div data-testid={testId} className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {label}
        <span className="ml-2 text-xs font-normal text-muted-foreground/60">
          ({items.length})
        </span>
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">None.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={[
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-left',
                  selectedId === item.id
                    ? 'bg-slate-100 text-slate-900'
                    : 'hover:bg-black/5 text-slate-600',
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
    <div data-testid="archive-list" className="space-y-6">
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
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data == null || data.total === 0 ? (
          <div data-testid="archive-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              Archive is empty.
            </p>
            <p className="text-xs text-slate-500">
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
      asideTitle="Archive Detail"
      asideSubtitle="Why it was archived and its rejection context."
      aside={
        selectedItem ? (
          <ArchiveItemDetail item={selectedItem} />
        ) : (
          <div data-testid="archive-aside-empty-state" className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              No item selected.
            </p>
            <p className="text-xs text-slate-500">
              Select an archived item to inspect it here.
            </p>
          </div>
        )
      }
    />
  );
}
