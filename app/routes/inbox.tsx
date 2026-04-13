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
import { InboxItemCard } from '../components/inbox';
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
        className="btn-secondary rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
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

/* ─── Filter bar ─────────────────────────────────────────────────────────── */

const SEVERITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
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
      rejectedUser: groupedItems.archive.filter(
        (i) => i.rejectionType === 'user'
      ).length,
      rejectedAutomated: groupedItems.archive.filter(
        (i) => i.rejectionType === 'automated'
      ).length,
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

  const setRejectedTab = useCallback(
    (tab: 'user' | 'automated' | undefined) => {
      navigate({
        to: '/inbox',
        search: { view: 'archive', rejectedTab: tab },
        replace: true,
      });
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

  const visibleItems =
    activeView === 'queue'
      ? groupedItems.queue
      : activeView === 'workbench'
        ? groupedItems.workbench
        : archiveItems;

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
          <div className="mt-2 space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setView('queue')}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                  activeView === 'queue'
                    ? 'border-sky-300 bg-gradient-to-br from-sky-50 to-white shadow-[0_8px_24px_-16px_rgba(2,132,199,0.7)]'
                    : 'border-slate-200 bg-white/80 hover:bg-white'
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Queue
                </p>
                <p className="mt-1 text-3xl font-semibold leading-none text-slate-800 tabular-nums">
                  {counts.queue}
                </p>
                <div className="mt-2 h-px w-12 bg-slate-300" />
              </button>
              <button
                type="button"
                onClick={() => setView('workbench')}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                  activeView === 'workbench'
                    ? 'border-violet-300 bg-gradient-to-br from-violet-50 to-white shadow-[0_8px_24px_-16px_rgba(124,58,237,0.7)]'
                    : 'border-slate-200 bg-white/80 hover:bg-white'
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Workbench
                </p>
                <p className="mt-1 text-3xl font-semibold leading-none text-slate-800 tabular-nums">
                  {counts.workbench}
                </p>
                <div className="mt-2 h-px w-12 bg-slate-300" />
              </button>
              <button
                type="button"
                onClick={() => setView('archive')}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                  activeView === 'archive'
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-white shadow-[0_8px_24px_-16px_rgba(217,119,6,0.7)]'
                    : 'border-slate-200 bg-white/80 hover:bg-white'
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Archive
                </p>
                <p className="mt-1 text-3xl font-semibold leading-none text-slate-800 tabular-nums">
                  {counts.archive}
                </p>
                <div className="mt-2 h-px w-12 bg-slate-300" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView('queue')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                    activeView === 'queue'
                      ? 'border-slate-800 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView('archive');
                    setRejectedTab('user');
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                    activeView === 'archive' && rejectedTab === 'user'
                      ? 'border-slate-800 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Rejected
                </button>
                <button
                  type="button"
                  onClick={() => setView('workbench')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                    activeView === 'workbench'
                      ? 'border-slate-800 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Validated
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView('archive');
                    setRejectedTab('automated');
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                    activeView === 'archive' && rejectedTab === 'automated'
                      ? 'border-slate-800 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Auto-rejected
                </button>
                <div className="ml-auto flex items-center gap-2">
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
                            (e.target.value as 'high' | 'medium' | 'low') ||
                            undefined,
                        },
                        replace: true,
                      })
                    }
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    {SEVERITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    onClick={refresh}
                    disabled={loading || anyActionInFlight}
                  >
                    {loading ? 'Loading…' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>

            {activeView === 'queue' && groupedItems.queue.length === 0 && (
              <EmptyState
                title="Queue is clear"
                description="No staged proposals waiting."
                action={
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-sm font-medium transition-colors"
                    style={{
                      background: 'rgba(22,163,74,0.12)',
                      color: '#166534',
                      border: '1px solid rgba(22,163,74,0.25)',
                    }}
                    onClick={() => setView('workbench')}
                  >
                    Continue in Workbench →
                  </button>
                }
              />
            )}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => {
                const run = runById.get(item.sourceId);
                const note = noteByPath.get(item.sourceId);
                const expanded = selectedId === item.id;
                return (
                  <div key={item.id} className="space-y-1">
                    <InboxItemCard
                      item={inboxItemToDisplay(
                        item,
                        activeView === 'queue' ? undefined : note,
                        run
                      )}
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
                      isExpanded={expanded}
                      onToggle={() =>
                        setSelectedId(expanded ? undefined : item.id)
                      }
                      onInspect={() => setSelectedId(item.id)}
                      onPromote={
                        activeView === 'queue' &&
                        run &&
                        run.runType !== 'signals_infer'
                          ? () => handleCommit(run.runId)
                          : undefined
                      }
                      onReject={
                        activeView === 'queue'
                          ? run
                            ? () => handleReject(run.runId)
                            : item.sourceId
                              ? () => handleReject(item.sourceId)
                              : undefined
                          : undefined
                      }
                    />
                    {activeView === 'queue' && run && (
                      <ConvertPanel
                        runId={run.runId}
                        rawText={`${run.runId}${run.action ? ` — ${run.action}` : ''}${run.templateRef ? ` (${run.templateRef})` : ''}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {activeView === 'workbench' &&
              groupedItems.workbench.length === 0 && (
                <EmptyState
                  title="No draft or active inbox notes"
                  description="New notes will appear here when they arrive."
                />
              )}
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
          </div>
        </>
      )}
    </>
  );

  /* ─── aside detail panel ──────────────────────────────────────────────── */

  // Detail is now rendered inline within each InboxItemCard — no aside needed.

  return (
    <WorkspaceScaffold
      title="Inbox"
      subtitle="Review staged proposals, triage workbench notes, or browse the rejected archive."
      primary={primaryContent}
    />
  );
}
