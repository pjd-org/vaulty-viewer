import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useModals } from 'react-easy-modals';
import { toast } from 'sonner';
import { useInbox } from '../../src/hooks/useInbox';
import type { InboxNote } from '../../src/lib/inbox-logic';
import { inboxSearchParams } from '../../src/lib/routes/search-params';
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
    item.rejectionType === 'user'
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
    isBlocked: item.severity === 'high' || item.severity === 'critical',
    ageLabel: '',
    contextSnippet: item.summary ?? '',
    actions: item.severity === 'high' || item.severity === 'critical'
      ? ['inspect', 'reject']
      : ['inspect', 'promote', 'reject'],
    runId: run?.runId ?? null,
  };
}

export const Route = createFileRoute('/inbox')({
  validateSearch: inboxSearchParams,
  component: InboxRoute,
});

function InboxRoute() {
  const { runs, signals, workbenchNotes, archiveNotes, loading, error, refresh, commitRun, rejectRun, actionState, counts } = useInbox();
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
    [runs, workbenchNotes, archiveNotes]
  );

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
        const src = item.rejectionType === 'user'
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
        const committed = result?.structuredContent?.committed ?? 0;
        toast(`Committed ${committed} item${committed !== 1 ? 's' : ''} from ${runId}`);
        refresh();
      } catch (err) {
        toast.error((err as Error).message ?? 'Commit failed');
      }
    },
    [commitRun, refresh]
  );

  const handleReject = React.useCallback(
    async (runId: string) => {
      try {
        await rejectRun(runId);
        toast(`Rejected run ${runId}`);
        refresh();
      } catch (err) {
        toast.error((err as Error).message ?? 'Reject failed');
      }
    },
    [rejectRun, refresh]
  );

  const openItem = React.useCallback(
    (item: InboxItem) => {
      const run = runById.get(item.sourceId);
      const note = noteByPath.get(item.sourceId);
      const display = inboxItemToDisplay(item, note, run);
      const detail: InboxItemDetail = {
        summary: item.summary ?? undefined,
        whySurfaced: item.whySurfaced,
        severity: item.severity,
        inboxBucket: item.inboxBucket,
        rejectionReason: item.rejectionReason,
        runId: run?.runId,
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
          run && run.runType !== 'signals_infer'
            ? () => handleCommit(run.runId)
            : undefined,
        onReject: run
          ? () => handleReject(run.runId)
          : item.sourceId
            ? () => handleReject(item.sourceId)
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
    [convertTask, handleCommit, handleReject, modals, noteByPath, runById, setSearch]
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
        <div className="flex flex-col gap-4">
          {loading && <div>Loading inbox…</div>}
          {!loading && error && (
            <EmptyState title="Could not reach the API." description={error} />
          )}
          {!loading && !error && (
            <>
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
                emptyTitle="Nothing here"
                emptyDescription="Try a different tab or clear the active filters."
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
                    (run && run.runType !== 'signals_infer');
                  const canReject =
                    item.allowedActions.some((a) =>
                      ['defer', 'approve'].includes(a.actionType)
                    ) ||
                    !!run ||
                    !!item.sourceId;
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
                        summary: item.summary ?? undefined,
                        whySurfaced: item.whySurfaced,
                        severity: item.severity,
                        inboxBucket: item.inboxBucket,
                        rejectionReason: item.rejectionReason,
                        runId: run?.runId,
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
                      onReject={
                        canReject
                          ? run
                            ? () => handleReject(run.runId)
                            : item.sourceId
                              ? () => handleReject(item.sourceId)
                              : undefined
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
      }
      asideTitle="Detail"
      aside={null}
    />
  );
}
