import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useInbox } from '../../src/hooks/useInbox';
import { type InboxView, type InboxNote, defaultInboxView } from '../../src/lib/inbox-logic';
import { inboxSearchParams } from '../../src/lib/routes/search-params';
import { toInboxItemDisplay } from '../lib/display';
import { InboxItemCard, InboxViewSwitcher } from '../components/inbox';
import { EmptyState } from '../components/ui';
import { PageFrame } from '../components/layout';
import { useInboxConverterMutation, type InboxConvertResult } from '../lib/queries/agents';
import { getInboxSurfaceQueryOptions, useInboxSurface, type InboxItem } from '../lib/viewer-adapter';

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

interface ToastMsg {
  msg: string;
  isError: boolean;
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
  const createdAt =
    (note?.frontmatter?.created ?? note?.frontmatter?.createdAt ?? null) as
      | string
      | null
      | undefined;
  const source =
    item.rejectionType === 'user' ? 'manual'
    : note?.source === 'extracted' ? 'agent'
    : run ? runToOriginSource(run.runType)
    : item.inboxBucket === 'deferred' || item.inboxBucket === 'rejected_automated' ? 'agent'
    : 'manual';

  return toInboxItemDisplay({
    title: item.title,
    _source: source,
    _run_id: run?.runId,
    description: item.summary,
    createdAt: createdAt ?? item.surfacedAt,
    status:
      note?.status
      ?? (item.severity === 'high' || item.severity === 'critical' ? 'blocked' : undefined),
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
    return <span className="text-xs text-slate-400 px-2 py-1">Converting…</span>;
  }

  if (error) {
    return (
      <span className="text-xs text-red-500 px-2 py-1">
        Failed —{' '}
        <button type="button" className="underline" onClick={() => { reset(); mutate(rawText); }}>
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
          {data.project && <><span>·</span><span>{data.project}</span></>}
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

/* ─── Route ───────────────────────────────────────────────────────────────── */

export const Route = createFileRoute('/inbox')({
  validateSearch: inboxSearchParams,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(getInboxSurfaceQueryOptions());
  },
  component: InboxRoute,
});

function InboxRoute() {
  const {
    runs,
    workbenchNotes,
    archiveNotes,
    apiStatus,
    refresh,
    commitRun,
    rejectRun,
    actionState,
    pendingConfirmations,
  } = useInbox();
  const { data: surface, isLoading: surfaceLoading, error: surfaceError } = useInboxSurface();

  const { view: viewParam, rejectedTab } = Route.useSearch();
  const navigate = useNavigate();

  const [toastMsg, setToastMsg] = useState<ToastMsg | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const anyActionInFlight = Object.values(actionState).some(
    (s) => s === 'committing' || s === 'rejecting'
  );
  const surfaceItems = surface ?? [];
  const groupedItems = React.useMemo(() => {
    const queue: InboxItem[] = [];
    const workbench: InboxItem[] = [];
    const archive: InboxItem[] = [];

    surfaceItems.forEach((item) => {
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
  }, [surfaceItems]);
  const archiveItems = React.useMemo(() => {
    if (!rejectedTab) return groupedItems.archive;
    return groupedItems.archive.filter((item) => item.rejectionType === rejectedTab);
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
    () => new Map(
      [...(workbenchNotes as InboxNote[]), ...(archiveNotes as InboxNote[])]
        .map((note) => [note.path, note] as const)
    ),
    [archiveNotes, workbenchNotes]
  );
  const loading = surfaceLoading && !surface;
  const error =
    surfaceError instanceof Error ? surfaceError.message
    : typeof surfaceError === 'string' ? surfaceError
    : null;

  // Determine active view: URL param → smart default → 'workbench'
  const activeView: InboxView =
    viewParam ?? (loading ? 'queue' : defaultInboxView(counts.queue));

  const setView = useCallback(
    (v: InboxView) => {
      navigate({ to: '/inbox', search: { view: v }, replace: true });
    },
    [navigate]
  );

  const toast = useCallback((msg: string, isError = false) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg({ msg, isError });
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

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
          toast(
            `Partial commit (${parts.join(', ')}) — refreshing`,
            committed === 0
          );
          refresh();
        } else {
          toast(
            `Committed ${committed} item${committed !== 1 ? 's' : ''} from ${runId}`
          );
        }
      } catch (err) {
        toast((err as Error).message ?? 'Commit failed', true);
      }
    },
    [commitRun, refresh, toast]
  );

  const handleReject = useCallback(
    async (runId: string) => {
      try {
        const result = await rejectRun(runId);
        const rawErrors = result?.structuredContent?.errors ?? 0;
        const errorCount = Array.isArray(rawErrors) ? rawErrors.length : rawErrors;
        if (errorCount > 0) {
          toast(
            `Partial rejection: ${errorCount} item${errorCount !== 1 ? 's' : ''} could not be removed — refreshing`,
            true
          );
          refresh();
        } else {
          toast(`Rejected run ${runId}`);
        }
      } catch (err) {
        toast((err as Error).message ?? 'Reject failed', true);
      }
    },
    [rejectRun, refresh, toast]
  );

  return (
    <main className="inbox-page p-6 space-y-6">
      {toastMsg && (
        <div
          className={`inbox-toast ${toastMsg.isError ? 'inbox-toast--error' : 'inbox-toast--ok'}`}
          role="status"
          aria-live="polite"
        >
          {toastMsg.msg}
        </div>
      )}

      <PageFrame
        title="Inbox"
        subtitle="Review staged proposals, triage workbench notes, or browse the rejected archive."
        actions={
          <>
            <span className={`api-badge api-badge--${apiStatus}`}>
              {apiStatus === 'online' ? 'API online' : apiStatus === 'offline' ? 'API offline' : 'API'}
            </span>
            <button
              type="button"
              className="btn-secondary rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-white/80 disabled:opacity-60"
              onClick={refresh}
              disabled={loading || anyActionInFlight}
            >
              {loading ? 'Loading…' : '↻ Refresh'}
            </button>
          </>
        }
      >
        {loading && (
          <div className="inbox-state">
            <div className="inbox-spinner" />
            <span>Loading inbox…</span>
          </div>
        )}

        {!loading && error && (
          <div className="inbox-state inbox-state--error">
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

            <div className="mt-6 space-y-3">
              {activeView === 'queue' && groupedItems.queue.length === 0 && (
                <EmptyState
                  title="Queue is clear"
                  description="No staged proposals waiting. Continue in Workbench →"
                />
              )}
              {activeView === 'queue' && groupedItems.queue.map((item) => {
                const run = runById.get(item.sourceId);
                const inspectPath = run?.items[0]?.targetPath ?? run?.items[0]?.path;
                return (
                <div key={item.id} className="space-y-1">
                  <InboxItemCard
                    item={inboxItemToDisplay(item, undefined, run)}
                    onInspect={() => {
                      const p = inspectPath;
                      if (p) navigate({ to: '/note', search: { p: stripMarkdownExtension(p) } });
                    }}
                    onPromote={
                      run && run.runType !== 'signals_infer'
                        ? () => handleCommit(run.runId)
                        : undefined
                    }
                    onReject={
                      run ? () => handleReject(run.runId)
                      : item.sourceId ? () => handleReject(item.sourceId)
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
              )})}

              {activeView === 'workbench' && groupedItems.workbench.length === 0 && (
                <EmptyState
                  title="No draft or active inbox notes"
                  description="New notes will appear here when they arrive."
                />
              )}
              {activeView === 'workbench' && groupedItems.workbench.map((item) => {
                const note = noteByPath.get(item.sourceId);
                const notePath = note?.path ?? item.sourceId;
                return (
                  <InboxItemCard
                    key={item.id}
                    item={inboxItemToDisplay(item, note)}
                    onInspect={() => navigate({ to: '/note', search: { p: stripMarkdownExtension(notePath) } })}
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
              {activeView === 'archive' && archiveItems.map((item) => {
                const note = noteByPath.get(item.sourceId);
                const notePath = note?.path ?? item.sourceId;
                return (
                  <InboxItemCard
                    key={item.id}
                    item={inboxItemToDisplay(item, note)}
                    onInspect={() => navigate({ to: '/note', search: { p: stripMarkdownExtension(notePath) } })}
                  />
                );
              })}
            </div>
          </>
        )}
      </PageFrame>
    </main>
  );
}
