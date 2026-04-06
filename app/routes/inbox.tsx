import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useInbox } from '../../src/hooks/useInbox';
import {
  type InboxView,
  type InboxNote,
  defaultInboxView,
} from '../../src/lib/inbox-logic';
import { inboxSearchParams } from '../../src/lib/routes/search-params';
import { toInboxItemDisplay } from '../lib/display';
import { InboxItemCard, InboxViewSwitcher } from '../components/inbox';
import { EmptyState } from '../components/ui';
import { WorkspaceScaffold } from '../components/layout';
import {
  useInboxConverterMutation,
  type InboxConvertResult,
} from '../lib/queries/agents';
import {
  buildInboxSurfacePayload,
  type InboxItem,
} from '../lib/viewer-adapter';

/* ─── types ───────────────────────────────────────────────────────────────── */

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

/* ─── helpers ────────────────────────────────────────────────────────────── */

function stripMarkdownExtension(path: string) {
  return path.endsWith('.md') ? path.slice(0, -3) : path;
}

function runToOriginSource(runType?: string): string {
  if (runType === 'signals_infer') return 'agent';
  if (runType === 'conversation') return 'llm';
  return runType ?? 'manual';
}

function isArchiveBucket(bucket: InboxItem['inboxBucket']) {
  return bucket === 'rejected_user' || bucket === 'rejected_automated';
}

function inboxItemToDisplay(item: InboxItem, note?: InboxNote, run?: Run) {
  const createdAt = (note?.frontmatter?.created ??
    note?.frontmatter?.createdAt ??
    null) as string | null | undefined;
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

  return toInboxItemDisplay({
    title: item.title,
    _source: source,
    _run_id: run?.runId,
    description: item.summary,
    createdAt: createdAt ?? item.surfacedAt,
    status:
      note?.status ??
      (item.severity === 'high' || item.severity === 'critical'
        ? 'blocked'
        : undefined),
  });
}

/* ─── Inline converter panel ─────────────────────────────────────────────── */

function ConvertPanel({ runId, rawText }: { runId: string; rawText: string }) {
  const { mutate, data, isPending, error, reset } = useInboxConverterMutation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (!data && !isPending && !error) {
    return (
      <button
        type="button"
        className="text-xs text-slate-700 hover:text-slate-900 font-medium px-2 py-1 rounded-lg hover:bg-white/50 transition-colors"
        onClick={() => mutate(rawText)}
      >
        ✦ Convert to task
      </button>
    );
  }

  if (isPending) {
    return (
      <span className="text-xs text-slate-400 px-2 py-1">Converting…</span>
    );
  }

  if (error) {
    return (
      <span className="text-xs text-red-500 px-2 py-1">
        Failed —{' '}
        <button
          type="button"
          className="underline"
          onClick={() => {
            reset();
            mutate(rawText);
          }}
        >
          retry
        </button>
      </span>
    );
  }

  if (data) {
    return (
      <div className="mt-2 genie-surface genie-surface--utility rounded-xl px-3 py-2 space-y-1">
        <p className="text-xs font-semibold text-slate-800">{data.title}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span>{data.duration}</span>
          <span>·</span>
          <span className="capitalize">{data.effort}</span>
          <span>·</span>
          <span className="capitalize">{data.type}</span>
          {data.project && (
            <>
              <span>·</span>
              <span>{data.project}</span>
            </>
          )}
        </div>
        <button
          type="button"
          className="text-xs text-slate-500 hover:text-slate-800 mt-1"
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return null;
}

/* ─── Detail Panel ───────────────────────────────────────────────────────── */

function InboxDetailPanel({
  item,
  run,
  onPromote,
  onReject,
  onClose,
}: {
  item: InboxItem;
  run?: Run;
  onPromote?: () => void;
  onReject?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-800 text-base leading-snug">
          {item.title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-slate-400 hover:text-slate-700 text-xs px-2 py-1 rounded"
          aria-label="Close detail panel"
        >
          ✕
        </button>
      </div>

      {item.summary && (
        <p className="text-slate-600 leading-relaxed">{item.summary}</p>
      )}

      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Why surfaced
        </p>
        <p className="text-slate-600">
          {item.whySurfaced ?? 'No explanation provided.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Severity
          </p>
          <p className="mt-1 capitalize text-slate-700">
            {item.severity ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Bucket
          </p>
          <p className="mt-1 text-slate-700">{item.inboxBucket}</p>
        </div>
        {item.rejectionReason && (
          <div className="col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Rejection reason
            </p>
            <p className="mt-1 text-slate-700">{item.rejectionReason}</p>
          </div>
        )}
      </div>

      {run && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Run
          </p>
          <p className="text-slate-600 font-mono text-xs">{run.runId}</p>
          {run.action && <p className="text-slate-500 text-xs">{run.action}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
        {onPromote && (
          <button
            type="button"
            onClick={onPromote}
            className="rounded-full bg-slate-900 text-white text-xs font-semibold px-4 py-2 hover:bg-slate-700 transition-colors"
          >
            Promote
          </button>
        )}
        {onReject && (
          <button
            type="button"
            onClick={onReject}
            className="rounded-full border border-red-200 text-red-600 text-xs font-semibold px-4 py-2 hover:bg-red-50 transition-colors"
          >
            Reject
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Filter bar ─────────────────────────────────────────────────────────── */

const SEVERITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
] as const;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'confidence', label: 'Confidence' },
] as const;

/* ─── Route ───────────────────────────────────────────────────────────────── */

export const Route = createFileRoute('/inbox')({
  validateSearch: inboxSearchParams,
  component: InboxRoute,
});

function InboxRoute() {
  const {
    runs,
    workbenchNotes,
    archiveNotes,
    loading,
    error,
    apiStatus,
    refresh,
    commitRun,
    rejectRun,
    actionState,
    pendingConfirmations,
  } = useInbox();

  // Derive adapter surface items from the single useInbox() data source
  const surface = React.useMemo(
    () =>
      buildInboxSurfacePayload({
        runs: runs as unknown as Array<Record<string, unknown>>,
        workbenchNotes:
          workbenchNotes as unknown as import('../../src/lib/inbox-logic').InboxNote[],
        archiveNotes:
          archiveNotes as unknown as import('../../src/lib/inbox-logic').InboxNote[],
      }),
    [runs, workbenchNotes, archiveNotes]
  );

  const {
    view: viewParam,
    rejectedTab,
    selectedId,
    severity,
  } = Route.useSearch();
  const navigate = useNavigate();

  const anyActionInFlight = Object.values(actionState).some(
    (s) => s === 'committing' || s === 'rejecting'
  );
  const surfaceItems = surface;

  const filteredSurfaceItems = React.useMemo(() => {
    if (!severity) return surfaceItems;
    return surfaceItems.filter((item) => item.severity === severity);
  }, [surfaceItems, severity]);

  const groupedItems = React.useMemo(() => {
    const queue: InboxItem[] = [];
    const workbench: InboxItem[] = [];
    const archive: InboxItem[] = [];

    filteredSurfaceItems.forEach((item) => {
      if (item.inboxBucket === 'deferred') {
        workbench.push(item);
        return;
      }

      if (isArchiveBucket(item.inboxBucket)) {
        archive.push(item);
        return;
      }

      queue.push(item);
    });

    return { queue, workbench, archive };
  }, [filteredSurfaceItems]);

  const archiveItems = React.useMemo(() => {
    if (!rejectedTab) return groupedItems.archive;
    return groupedItems.archive.filter(
      (item) => item.rejectionType === rejectedTab
    );
  }, [groupedItems.archive, rejectedTab]);

  const counts = React.useMemo(
    () => ({
      queue: groupedItems.queue.length,
      workbench: groupedItems.workbench.length,
      archive: groupedItems.archive.length,
    }),
    [groupedItems]
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

  // Determine active view: URL param → smart default → 'workbench'
  const activeView: InboxView =
    viewParam ?? (loading ? 'queue' : defaultInboxView(counts.queue));

  const setView = useCallback(
    (v: InboxView) => {
      navigate({ to: '/inbox', search: { view: v }, replace: true });
    },
    [navigate]
  );

  const setSelectedId = useCallback(
    (id: string | undefined) => {
      navigate({
        to: '/inbox',
        search: {
          view: viewParam,
          rejectedTab,
          severity,
          selectedId: id,
        },
        replace: true,
      });
    },
    [navigate, viewParam, rejectedTab, severity]
  );

  const handleCommit = useCallback(
    async (runId: string) => {
      try {
        const result = await commitRun(runId);
        const status =
          result?.structuredContent?.status ?? result?.status ?? null;
        if (status === 'pending_confirmation') {
          const expiresAt =
            result?.structuredContent?.expiresAt ?? result?.expiresAt;
          toast(
            expiresAt
              ? `Confirmation armed for ${runId}. Click Commit again before ${expiresAt}.`
              : `Confirmation armed for ${runId}. Click Commit again to promote.`
          );
          return;
        }
        const committed = result?.structuredContent?.committed ?? 0;
        const failed = result?.structuredContent?.failed ?? 0;
        const rejected = result?.structuredContent?.rejected ?? 0;
        if (failed > 0 || rejected > 0) {
          const parts: string[] = [];
          if (committed > 0) parts.push(`${committed} committed`);
          if (rejected > 0) parts.push(`${rejected} rejected`);
          if (failed > 0) parts.push(`${failed} failed`);
          if (committed === 0) {
            toast.error(`Partial commit (${parts.join(', ')}) — refreshing`);
          } else {
            toast(`Partial commit (${parts.join(', ')}) — refreshing`);
          }
          refresh();
        } else {
          toast(
            `Committed ${committed} item${committed !== 1 ? 's' : ''} from ${runId}`
          );
        }
      } catch (err) {
        toast.error((err as Error).message ?? 'Commit failed');
      }
    },
    [commitRun, refresh]
  );

  const handleReject = useCallback(
    async (runId: string) => {
      try {
        const result = await rejectRun(runId);
        const rawErrors = result?.structuredContent?.errors ?? 0;
        const errorCount = Array.isArray(rawErrors)
          ? rawErrors.length
          : rawErrors;
        if (errorCount > 0) {
          toast.error(
            `Partial rejection: ${errorCount} item${errorCount !== 1 ? 's' : ''} could not be removed — refreshing`
          );
          refresh();
        } else {
          toast(`Rejected run ${runId}`);
        }
      } catch (err) {
        toast.error((err as Error).message ?? 'Reject failed');
      }
    },
    [rejectRun, refresh]
  );

  // Find the selected item across all buckets
  const selectedItem = React.useMemo(
    () =>
      selectedId
        ? surfaceItems.find((item) => item.id === selectedId)
        : undefined,
    [selectedId, surfaceItems]
  );
  const selectedRun = selectedItem
    ? runById.get(selectedItem.sourceId)
    : undefined;

  /* ─── toolbar ─────────────────────────────────────────────────────────── */

  const toolbar = (
    <div className="flex flex-wrap items-end gap-3">
      <span className={`api-badge api-badge--${apiStatus}`}>
        {apiStatus === 'online'
          ? 'API online'
          : apiStatus === 'offline'
            ? 'API offline'
            : 'API'}
      </span>
      <button
        type="button"
        className="btn-secondary rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-white/80 disabled:opacity-60"
        onClick={refresh}
        disabled={loading || anyActionInFlight}
      >
        {loading ? 'Loading…' : '↻ Refresh'}
      </button>
    </div>
  );

  /* ─── filter bar ──────────────────────────────────────────────────────── */

  const filterBar = (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-1.5">
        <label
          htmlFor="inbox-severity"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 shrink-0"
        >
          Severity
        </label>
        <select
          id="inbox-severity"
          value={severity ?? ''}
          onChange={(e) =>
            navigate({
              to: '/inbox',
              search: {
                view: activeView,
                rejectedTab,
                selectedId,
                severity:
                  (e.target.value as 'high' | 'medium' | 'low') || undefined,
              },
              replace: true,
            })
          }
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
        >
          {SEVERITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  /* ─── primary list ────────────────────────────────────────────────────── */

  const primaryContent = (
    <>
      {loading && (
        <div className="inbox-state">
          <div className="inbox-spinner" />
          <span>Loading inbox…</span>
        </div>
      )}

      {!loading && error && (
        <div className="inbox-state inbox-state--error" role="alert">
          <strong>Could not reach the API.</strong>
          <span>{error}</span>
          <button type="button" className="btn btn--refresh" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <InboxViewSwitcher
            view={activeView}
            onChange={setView}
            counts={counts}
          />
          {filterBar}

          <div className="mt-2 space-y-3">
            {activeView === 'queue' && groupedItems.queue.length === 0 && (
              <EmptyState
                title="Queue is clear"
                description="No staged proposals waiting. Continue in Workbench →"
              />
            )}
            {activeView === 'queue' &&
              groupedItems.queue.map((item) => {
                const run = runById.get(item.sourceId);
                return (
                  <div key={item.id} className="space-y-1">
                    <InboxItemCard
                      item={inboxItemToDisplay(item, undefined, run)}
                      onInspect={() => setSelectedId(item.id)}
                      onPromote={
                        run && run.runType !== 'signals_infer'
                          ? () => handleCommit(run.runId)
                          : undefined
                      }
                      onReject={
                        run
                          ? () => handleReject(run.runId)
                          : item.sourceId
                            ? () => handleReject(item.sourceId)
                            : undefined
                      }
                    />
                    {run && (
                      <ConvertPanel
                        runId={run.runId}
                        rawText={`${run.runId}${run.action ? ` — ${run.action}` : ''}${run.templateRef ? ` (${run.templateRef})` : ''}`}
                      />
                    )}
                  </div>
                );
              })}

            {activeView === 'workbench' &&
              groupedItems.workbench.length === 0 && (
                <EmptyState
                  title="No draft or active inbox notes"
                  description="New notes will appear here when they arrive."
                />
              )}
            {activeView === 'workbench' &&
              groupedItems.workbench.map((item) => {
                const note = noteByPath.get(item.sourceId);
                const notePath = note?.path ?? item.sourceId;
                return (
                  <InboxItemCard
                    key={item.id}
                    item={inboxItemToDisplay(item, note)}
                    onInspect={() => setSelectedId(item.id)}
                  />
                );
              })}

            {activeView === 'archive' && archiveItems.length === 0 && (
              <EmptyState
                title={
                  rejectedTab === 'user'
                    ? 'No user rejections'
                    : rejectedTab === 'automated'
                      ? 'No automated rejections'
                      : 'No rejected notes'
                }
                description="The archive is empty for the selected rejection tab."
              />
            )}
            {activeView === 'archive' &&
              archiveItems.map((item) => {
                const note = noteByPath.get(item.sourceId);
                return (
                  <InboxItemCard
                    key={item.id}
                    item={inboxItemToDisplay(item, note)}
                    onInspect={() => setSelectedId(item.id)}
                  />
                );
              })}
          </div>
        </>
      )}
    </>
  );

  /* ─── aside detail panel ──────────────────────────────────────────────── */

  const asideContent = selectedItem ? (
    <InboxDetailPanel
      item={selectedItem}
      run={selectedRun}
      onClose={() => setSelectedId(undefined)}
      onPromote={
        selectedRun && selectedRun.runType !== 'signals_infer'
          ? () => handleCommit(selectedRun.runId)
          : undefined
      }
      onReject={
        selectedRun
          ? () => handleReject(selectedRun.runId)
          : selectedItem.sourceId
            ? () => handleReject(selectedItem.sourceId)
            : undefined
      }
    />
  ) : (
    <EmptyState
      title="Select an item to inspect"
      description="Source context, rejection reason, and actions will appear here."
    />
  );

  return (
    <WorkspaceScaffold
      title="Inbox"
      subtitle="Review staged proposals, triage workbench notes, or browse the rejected archive."
      actions={toolbar}
      primaryTitle="Triage Queue"
      primarySubtitle="Sorted by COD rank, filtered by severity."
      primary={primaryContent}
      asideTitle="Item Detail"
      asideSubtitle="Source context and allowed actions."
      aside={asideContent}
    />
  );
}
