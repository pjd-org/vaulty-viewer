import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useInbox } from '../../src/hooks/useInbox';
import {
  type InboxView,
  type InboxNote,
  defaultInboxView,
  INBOX_BUCKET_CONFIG,
  type InboxBucket,
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

/* ─── source type helper ────────────────────────────────────────────────── */

function itemSourceType(
  item: InboxItem,
  run?: Run
): 'agent' | 'mcp' | 'manual' {
  if (run?.runType === 'signals_infer' || run?.runType === 'conversation')
    return 'agent';
  if (run?.runType === 'mcp' || item.sourceType === 'pipeline') return 'mcp';
  if (
    item.inboxBucket === 'rejected_automated' ||
    item.inboxBucket === 'deferred'
  )
    return 'agent';
  return 'manual';
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

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'agent', label: 'Agent' },
  { value: 'mcp', label: 'MCP' },
  { value: 'manual', label: 'Manual' },
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

  // ── 8-bucket state ────────────────────────────────────────────────────────
  const [activeBucket, setActiveBucket] = useState<InboxBucket>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const anyActionInFlight = Object.values(actionState).some(
    (s) => s === 'committing' || s === 'rejecting'
  );
  const allItems = surface;

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

  // ── Per-bucket item counts (no filters applied, for tab badges) ──────────
  const bucketCounts = React.useMemo(() => {
    const counts: Record<InboxBucket, number> = {
      all: allItems.length,
      needs_action: 0,
      needs_approval: 0,
      failure: 0,
      drift_stale: 0,
      rejected_user: 0,
      rejected_automated: 0,
      deferred: 0,
    };
    for (const item of allItems) {
      for (const cfg of INBOX_BUCKET_CONFIG) {
        if (cfg.bucket !== 'all' && cfg.matches(item)) {
          counts[cfg.bucket]++;
        }
      }
    }
    return counts;
  }, [allItems]);

  // ── Apply bucket + severity + source filters ─────────────────────────────
  const visibleItems = React.useMemo(() => {
    const bucketConfig = INBOX_BUCKET_CONFIG.find(
      (c) => c.bucket === activeBucket
    )!;

    return allItems.filter((item) => {
      if (!bucketConfig.matches(item)) return false;
      if (severity && item.severity !== severity) return false;
      if (sourceFilter !== 'all') {
        const run = runById.get(item.sourceId);
        const src = itemSourceType(item, run);
        if (src !== sourceFilter) return false;
      }
      return true;
    });
  }, [allItems, activeBucket, severity, sourceFilter, runById]);

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
          <div className="mt-2 space-y-4">
            {/* ── 8-bucket pill tab bar ────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-3 py-2">
              <div className="overflow-x-auto">
                <div className="flex items-center gap-1.5 min-w-max pb-0.5">
                  {INBOX_BUCKET_CONFIG.map((cfg) => {
                    const isActive = activeBucket === cfg.bucket;
                    const count = bucketCounts[cfg.bucket];
                    return (
                      <button
                        key={cfg.bucket}
                        type="button"
                        onClick={() => setActiveBucket(cfg.bucket)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                          isActive
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cfg.shortLabel}
                        {count > 0 && (
                          <span
                            className={`ml-1.5 tabular-nums ${
                              isActive ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Filters row ─────────────────────────────────────────── */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Filter
                </span>
                <select
                  id="inbox-severity"
                  value={severity ?? ''}
                  onChange={(e) =>
                    navigate({
                      to: '/inbox',
                      search: {
                        view: viewParam,
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
                      {o.label === 'All' ? 'Severity: All' : o.label}
                    </option>
                  ))}
                </select>
                <select
                  id="inbox-source"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  {SOURCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.value === 'all' ? 'Source: All' : o.label}
                    </option>
                  ))}
                </select>
                <div className="ml-auto">
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

            {/* ── Summary line ────────────────────────────────────────── */}
            <p className="text-xs text-slate-500">
              {visibleItems.length} of {allItems.length} signal
              {allItems.length !== 1 ? 's' : ''} ·{' '}
              <span className="font-medium text-slate-700">
                {INBOX_BUCKET_CONFIG.find((c) => c.bucket === activeBucket)
                  ?.label ?? activeBucket}
              </span>
            </p>

            {visibleItems.length === 0 && (
              <EmptyState
                title="No signals in this bucket"
                description="Try a different bucket or clear the active filters."
              />
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => {
                const run = runById.get(item.sourceId);
                const note = noteByPath.get(item.sourceId);
                const expanded = selectedId === item.id;

                // Promote is available when item has approve/reopen/override action
                const canPromote =
                  item.allowedActions.some((a) =>
                    ['approve', 'reopen', 'override'].includes(a.actionType)
                  ) ||
                  (run && run.runType !== 'signals_infer');

                // Reject is available when item has defer action or there's a sourceId
                const canReject =
                  item.allowedActions.some((a) =>
                    ['defer', 'approve'].includes(a.actionType)
                  ) ||
                  !!run ||
                  !!item.sourceId;

                return (
                  <div key={item.id} className="space-y-1">
                    <InboxItemCard
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
                      isExpanded={expanded}
                      onToggle={() =>
                        setSelectedId(expanded ? undefined : item.id)
                      }
                      onInspect={() => setSelectedId(item.id)}
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
            </div>
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
      subtitle={`${allItems.length} signal${allItems.length !== 1 ? 's' : ''} · ${visibleItems.length} in view`}
      primary={primaryContent}
    />
  );
}
