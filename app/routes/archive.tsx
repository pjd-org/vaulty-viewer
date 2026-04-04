import React from 'react';
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

function ArchiveSection({
  testId,
  label,
  items,
}: {
  testId: string;
  label: string;
  items: InboxItem[];
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
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              <span className="font-mono text-xs text-muted-foreground">▸</span>
              <span>{item.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ArchiveList({ data }: { data: ArchiveSurfacePayload }) {
  return (
    <div data-testid="archive-list" className="space-y-6">
      <ArchiveSection
        testId="archive-user-rejected-section"
        label="Rejected by user"
        items={data.rejectedUser}
      />
      <ArchiveSection
        testId="archive-automated-rejected-section"
        label="Rejected automatically"
        items={data.rejectedAutomated}
      />
      <ArchiveSection
        testId="archive-deferred-section"
        label="Deferred"
        items={data.deferred}
      />
    </div>
  );
}

function ArchiveRoute() {
  const { data, isLoading } = useArchiveSurface();

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
            <p className="text-sm font-medium text-neutral-600">
              Archive is empty.
            </p>
            <p className="text-xs text-neutral-400">
              Items will appear here once runs are rejected or deferred.
            </p>
          </div>
        ) : (
          <ArchiveList data={data} />
        )
      }
      asideTitle="Archive Detail"
      asideSubtitle="Why it was archived and what can be reopened."
      aside={
        <div data-testid="archive-aside-empty-state" className="space-y-2">
          <p className="text-sm font-medium text-neutral-600">
            No item selected.
          </p>
          <p className="text-xs text-neutral-400">
            Select an archived item to inspect it here.
          </p>
        </div>
      }
    />
  );
}
