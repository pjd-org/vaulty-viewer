import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useModals } from 'react-easy-modals';
import { toast } from 'sonner';
import { useInbox } from '../../src/hooks/useInbox';
import type { InboxNote } from '../../src/lib/inbox-logic';
import { inboxSearchParams } from '../../src/lib/routes/search-params';
import { AmbientSurface } from '../components/v2';
import { useViewerV2 } from '../lib/design/viewer-v2-context';
import { roleForSeverity } from '../lib/design/role-mapping';
import { WorkspaceScaffold } from '../components/layout';
import {
  FilterBar,
  InboxInspectModal,
  InboxItemCard,
  InboxItemList,
  InboxSummaryLine,
  InboxViewSwitcher,
} from '../components/inbox';
import type { InboxItemDetail } from '../components/inbox/InboxInspectModal';
import { EmptyState } from '../components/ui';
import { GlassCard } from '../components/ui/glass-card';
import { useInboxConverterMutation } from '../lib/queries/agents';
import { buildInboxSurfacePayload, type InboxItem } from '../lib/viewer-adapter';
import type { InboxItemDisplay } from '../types/display';

type InboxTab = 'signals' | 'queue' | 'workbench' | 'archive';
type SortKey = 'newest' | 'oldest' | 'confidence' | 'itemCount';

interface RunItem {
  path?: string;
  targetPath?: string;
  domainFields?: Record<string, unknown>;
}

interface Run {
  runId: string;
  runType?: string;
  action?: string;
  itemCount: number;
  confidence?: number;
  templateRef?: string;
  items: RunItem[];
  error?: string;
}

function runToOriginSource(runType?: string): string {
  if (runType === 'signals_infer') return 'agent';
  if (runType === 'conversation') return 'llm';
  return runType ?? 'manual';
}

function isArchiveBucket(bucket: InboxItem['inboxBucket']) {
  return bucket === 'rejected_user' || bucket === 'rejected_automated';
}

function inboxItemToDisplay(
  item: InboxItem,
  note?: InboxNote,
  run?: Run
): InboxItemDisplay {
  const source =
    item.runtimeSignal
      ? item.sourceId
      : item.rejectionType === 'user'
        ? 'manual'
      : note?.source === 'extracted'
        ? 'agent'
        : run
          ? runToOriginSource(run.runType)
          : item.inboxBucket === 'deferred' ||
              item.inboxBucket === 'rejected_automated'
            ? 'agent'
            : 'manual';

  return {
    title: item.title,
    originLabel: source,
    isBlocked: (note?.status ?? item.status) === 'blocked',
    ageLabel: '',
    contextSnippet: item.summary ?? '',
    actions: item.runtimeSignal
      ? ['inspect']
      : (note?.status ?? item.status) === 'blocked'
        ? ['inspect', 'reject']
        : ['inspect', 'promote', 'reject'],
    runId: run?.runId ?? item.runId ?? null,
  };
}

export const Route = createFileRoute('/inbox')({
  validateSearch: inboxSearchParams,
  component: InboxRoute,
});

function InboxRoute() {
  const { runs, signals, workbenchNotes, archiveNotes, loading, error, refresh, commitRun, actionState, pendingConfirmations, counts } = useInbox();
  const navigate = useNavigate();
  const modals = useModals();
  const { mutate: convertTask } = useInboxConverterMutation();
  const openedRef = React.useRef<string | null>(null);

  const surface = React.useMemo(
    () =>
      buildInboxSurfacePayload({
        signals: signals as unknown as Array<Record<string, unknown>>,
        runs: runs as unknown as Array<Record<string, unknown>>,
        workbenchNotes: workbenchNotes as InboxNote[],
        archiveNotes: archiveNotes as InboxNote[],
      }),
    [signals, runs, workbenchNotes, archiveNotes]
  );

  // These are the draft notes the authenticated inbox endpoint actually
  // returned. Never fall back to a global read-scoped list for staging.
  const drafts = workbenchNotes.filter((note) => note.path.startsWith('inbox/'));

  const { view, sort, severity, runType, reversibility, selectedId } =
    Route.useSearch();
  const activeTab = view ?? 'signals';
  const currentSort: SortKey = sort ?? 'newest';
  const anyActionInFlight = Object.values(actionState).some(
    (s) => s === 'committing' || s === 'rejecting'
  );

  const runById = React.useMemo(
    () => new Map((runs as Run[]).map((run) => [run.runId, run])),
    [runs]
  );
  const noteByPath = React.useMemo(
    () =>
      new Map(
        [
          ...(workbenchNotes as InboxNote[]),
          ...(archiveNotes as InboxNote[]),
        ].map((note) => [note.path, note] as const)
      ),
    [archiveNotes, workbenchNotes]
  );

  const tabItems = React.useMemo(() => {
    return surface.filter((item) => {
      if (activeTab === 'signals') {
        return item.runtimeSignal === true;
      }
      if (activeTab === 'queue') {
        return (
          item.runtimeSignal !== true &&
          (item.inboxBucket === 'needs_action' ||
            item.inboxBucket === 'needs_approval')
        );
      }
      if (activeTab === 'workbench') {
        return item.inboxBucket === 'deferred';
      }
      if (activeTab === 'archive') {
        return isArchiveBucket(item.inboxBucket);
      }
      return false;
    });
  }, [surface, activeTab]);

  const filteredItems = React.useMemo(() => {
    return tabItems.filter((item) => {
      if (severity && item.severity !== severity) return false;
      if (runType) {
        const src = item.runtimeSignal
          ? item.sourceId
          : item.rejectionType === 'user'
            ? 'manual'
          : item.inboxBucket === 'deferred' || item.inboxBucket === 'rejected_automated'
            ? 'agent'
            : 'manual';
        if (src !== runType) return false;
      }
      if (reversibility && item.reversibility !== reversibility) return false;
      return true;
    });
  }, [tabItems, severity, runType, reversibility]);

  const { select } = useViewerV2();

  // Mirror the open inbox item into the shared ambient state, using the item's
  // own severity. roleForSeverity maps only what the domain already
  // distinguishes; anything unknown falls to neutral rather than being guessed
  // into an alarm colour.
  React.useEffect(() => {
    if (!selectedId) {
      select(null);
      return;
    }
    const item = (tabItems as InboxItem[]).find((entry) => entry.id === selectedId);
    select({
      id: selectedId,
      role: item ? roleForSeverity(item.severity) : 'total',
    });
  }, [selectedId, tabItems, select]);

  const visibleItems = React.useMemo(() => {
    const copy = [...filteredItems];
    switch (currentSort) {
      case 'oldest':
        return copy.sort(
          (a, b) =>
            new Date(a.surfacedAt ?? 0).getTime() -
            new Date(b.surfacedAt ?? 0).getTime()
        );
      case 'confidence':
        return copy.sort((a, b) => {
          const ra = runById.get(a.sourceId);
          const rb = runById.get(b.sourceId);
          return (ra?.confidence ?? 1) - (rb?.confidence ?? 1);
        });
      case 'itemCount':
        return copy.sort((a, b) => {
          const ra = runById.get(a.sourceId);
          const rb = runById.get(b.sourceId);
          return (rb?.itemCount ?? 0) - (ra?.itemCount ?? 0);
        });
      default:
        return copy.sort(
          (a, b) =>
            new Date(b.surfacedAt ?? 0).getTime() -
            new Date(a.surfacedAt ?? 0).getTime()
        );
    }
  }, [filteredItems, currentSort, runById]);

  const tabCounts = React.useMemo(
    () => ({
      signals:
        counts?.signals ??
        surface.filter((i) => i.runtimeSignal === true).length,
      queue:
        counts?.queue ??
        surface.filter(
          (i) =>
            i.runtimeSignal !== true &&
            (i.inboxBucket === 'needs_action' || i.inboxBucket === 'needs_approval')
        ).length,
      workbench: counts?.workbench ?? surface.filter((i) => i.inboxBucket === 'deferred').length,
      archive: counts?.archive ?? surface.filter((i) => isArchiveBucket(i.inboxBucket)).length,
    }),
    [counts, surface]
  );

  const setSearch = React.useCallback(
    (patch: Record<string, unknown>) => {
      navigate({
        to: '/inbox',
        search: {
          view: activeTab,
          sort: currentSort,
          severity,
          runType,
          reversibility,
          selectedId,
          ...patch,
        },
        replace: true,
      });
    },
    [navigate, activeTab, currentSort, severity, runType, reversibility, selectedId]
  );

  const handleCommit = React.useCallback(
    async (runId: string) => {
      try {
        const result = await commitRun(runId);
        const status = result?.structuredContent?.status ?? result?.status;
        if (status === 'pending_confirmation') {
          toast('Promotion armed. Review the run, then explicitly confirm it below.');
          return;
        }
        const committed = result?.structuredContent?.committed ?? 0;
        const failed = result?.structuredContent?.failed ?? 0;
        if (failed > 0) toast.error(`Promotion completed with ${failed} failure(s). Inspect the receipt.`);
        else if (committed > 0) toast.success(`Committed ${committed} item(s) from ${runId}`);
        else toast('No items were committed. Check the run status.');
        await refresh();
      } catch (err) {
        toast.error((err as Error).message ?? 'Commit failed');
      }
    },
    [commitRun, refresh]
  );

  const openItem = React.useCallback(
    (item: InboxItem) => {
      const run = runById.get(item.sourceId);
      const note = noteByPath.get(item.sourceId);
      const display = inboxItemToDisplay(item, note, run);
      const detail: InboxItemDetail = {
        ...item,
        summary: item.summary ?? undefined,
        whySurfaced: item.whySurfaced,
        severity: item.severity,
        inboxBucket: item.inboxBucket,
        rejectionReason: item.rejectionReason,
        runId: run?.runId ?? item.runId,
        runAction: run?.action,
        sourceId: item.sourceId,
        reversibility: item.reversibility ?? null,
      };

      openedRef.current = item.id;
      setSearch({ selectedId: item.id });
      modals.open(InboxInspectModal, {
        item: display,
        detail,
        onClose: () => {
          setSearch({ selectedId: undefined });
        },
        onPromote:
          run && run.runType !== 'signals_infer' && run.runType !== 'transform'
            ? () => handleCommit(run.runId)
            : undefined,
        convertPanel: run ? (
          <button
            type="button"
            onClick={() => convertTask(`${run.runId}${run.action ? ` — ${run.action}` : ''}`)}
          >
            Convert to task
          </button>
        ) : undefined,
      });
    },
    [convertTask, handleCommit, modals, noteByPath, runById, setSearch]
  );

  React.useEffect(() => {
    if (!selectedId) {
      openedRef.current = null;
      return;
    }
    if (openedRef.current === selectedId) return;
    const item = visibleItems.find((candidate) => candidate.id === selectedId);
    if (!item) return;
    openedRef.current = selectedId;
    openItem(item);
  }, [selectedId, visibleItems, openItem]);

  return (
    <WorkspaceScaffold
      title="Inbox"
      subtitle={`${surface.length} items · ${visibleItems.length} shown${surface.length !== visibleItems.length ? ` · ${surface.length - visibleItems.length} hidden by tab/filters` : ''}`}
      primaryTitle="Review queue"
      primary={
        <AmbientSurface className="rounded-2xl p-1">
        <div className="flex flex-col gap-4">
          {loading && <div>Loading inbox…</div>}
          {!loading && error && (
            <EmptyState title="Could not reach the API." description={error} />
          )}
          {!loading && !error && (
            <>
              <section data-testid="inbox-drafts" aria-label="Drafts awaiting review"
                className="rounded-xl border border-border bg-background/50 p-4">
                <h2 className="text-sm font-semibold">Drafts · {drafts.length}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Inspect staged Markdown, frontmatter and destination before promoting.
                  Promotion uses the note's existing two-step authorization flow.
                </p>
                {drafts.length > 0 ? (
                  <ul className="mt-3 divide-y divide-border">
                    {drafts.map((note) => {
                      const fm = note.frontmatter ?? {};
                      const promotable = note.path.startsWith('inbox/extracted/') &&
                        typeof fm._run_id === 'string' &&
                        typeof fm._target_path === 'string' &&
                        fm._action == null;
                      return (
                        <li key={note.path} className="flex flex-wrap items-center justify-between gap-3 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{note.title || note.path.split('/').pop()}</p>
                            <p className="break-all font-mono text-xs text-muted-foreground">{note.path}</p>
                            {typeof fm._target_path === 'string' ? (
                              <p className="text-xs text-muted-foreground">Target: {fm._target_path}</p>
                            ) : null}
                            <p className="text-xs text-muted-foreground">
                              {typeof fm.type === 'string' ? fm.type : 'note'} · {note.status ?? 'staged'}
                            </p>
                          </div>
                          <a href={`/note?p=${encodeURIComponent(note.path)}`}
                            className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                            data-testid="inbox-draft-review">
                            {promotable ? 'Review & promote' : 'Inspect draft'}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    No draft notes were returned for this session. This does not mean the vault has no drafts;
                    staged-run visibility requires verified review authority.
                  </p>
                )}
              </section>
              {Object.entries(pendingConfirmations ?? {})
                .filter(([, pending]) => Boolean(pending?.token))
                .map(([runId, pending]) => (
                  <section key={runId} data-testid="inbox-promotion-confirmation"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <p className="text-sm">
                      Run <code>{runId}</code> awaits explicit confirmation.
                      {pending?.expiresAt ? ` Expires ${pending.expiresAt}.` : ''}
                    </p>
                    <button type="button" disabled={anyActionInFlight}
                      onClick={() => void handleCommit(runId)}
                      className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40">
                      Confirm promotion
                    </button>
                  </section>
                ))}
              <InboxViewSwitcher
                value={activeTab}
                onValueChange={(v) => setSearch({ view: v })}
                counts={tabCounts}
              />
              <GlassCard variant="light" glowEffect={false} className="px-3 py-2.5">
                <FilterBar
                  sort={currentSort}
                  onSortChange={(v) => setSearch({ sort: v })}
                  runType={runType ?? ''}
                  onRunTypeChange={(v) => setSearch({ runType: v || undefined })}
                  reversibility={reversibility ?? ''}
                  onReversibilityChange={(v) =>
                    setSearch({ reversibility: v || undefined })
                  }
                  severity={severity ?? ''}
                  onSeverityChange={(v) => setSearch({ severity: v || undefined })}
                  loading={loading}
                  anyInFlight={anyActionInFlight}
                  onRefresh={refresh}
                />
              </GlassCard>

              <InboxSummaryLine
                total={surface.length}
                visible={visibleItems.length}
                filters={severity || runType || reversibility ? 'filtered' : undefined}
                loading={loading}
              />

              <InboxItemList
                items={visibleItems}
                emptyTitle={
                  surface.length === 0
                    ? 'No staged runs are visible here.'
                    : 'Nothing here'
                }
                emptyDescription={
                  surface.length === 0
                    ? 'Staged runs are withheld from the HTTP inbox by design: this ingress has no agent identity to verify run ownership against, so it returns none rather than enumerate them for any read-scoped caller. Review them through MCP, which scopes the list to your verified agent identity.'
                    : 'Try a different tab or clear the active filters.'
                }
                emptyAction={
                  <button
                    type="button"
                    onClick={() =>
                      setSearch({
                        view: 'queue',
                        sort: 'newest',
                        severity: undefined,
                        runType: undefined,
                        reversibility: undefined,
                        selectedId: undefined,
                      })
                    }
                  >
                    Clear Filters
                  </button>
                }
                renderItem={(item) => {
                  const run = runById.get(item.sourceId);
                  const note = noteByPath.get(item.sourceId);
                  const canPromote =
                    item.allowedActions.some((a) =>
                      ['approve', 'reopen', 'override'].includes(a.actionType)
                    ) ||
                    (run && run.runType !== 'signals_infer' &&
                      run.runType !== 'transform');
                  const runActionId = run?.runId ?? item.sourceId;
                  const actionInflight =
                    !!runActionId &&
                    (actionState[runActionId] === 'committing' ||
                      actionState[runActionId] === 'rejecting');

                  return (
                    <InboxItemCard
                      key={item.id}
                      item={inboxItemToDisplay(item, note, run)}
                      detail={{
                        ...item,
                        summary: item.summary ?? undefined,
                        whySurfaced: item.whySurfaced,
                        severity: item.severity,
                        inboxBucket: item.inboxBucket,
                        rejectionReason: item.rejectionReason,
                        runId: run?.runId ?? item.runId,
                        runAction: run?.action,
                        sourceId: item.sourceId,
                        reversibility: item.reversibility ?? null,
                      }}
                      onInspect={() => openItem(item)}
                      onPromote={
                        canPromote && run && run.runType !== 'signals_infer'
                          ? () => handleCommit(run.runId)
                          : undefined
                      }
                      actionInFlight={actionInflight}
                      convertPanel={
                        run ? (
                          <button
                            type="button"
                            onClick={() =>
                              convertTask(
                                `${run.runId}${run.action ? ` — ${run.action}` : ''}`
                              )
                            }
                          >
                            Convert to task
                          </button>
                        ) : undefined
                      }
                    />
                  );
                }}
              />
            </>
          )}
        </div>
        </AmbientSurface>
      }
      asideTitle="Detail"
      aside={null}
    />
  );
}
